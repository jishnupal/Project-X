/**
 * Per-contact invite.
 * POST { code, guestId, role } creates a link + unique claim code.
 * POST { action: "accept", token } binds for an already signed-in Google user.
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  resolveEventAccess,
  mintClaimCode,
  awardBuzzPoints,
} from "../_auth.js";

const CODE_PATTERN = /^[A-Z0-9]{8}$/;
const CLAIM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function inviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadGuestName(d1, code, guestId) {
  const row = await d1.prepare("SELECT payload FROM weddings_v2 WHERE code = ?").bind(code).first();
  if (!row?.payload) return "";
  try {
    const state = JSON.parse(row.payload);
    const guest = (Array.isArray(state?.guests) ? state.guests : []).find((person) => person?.id === guestId);
    return String(guest?.name || "").trim();
  } catch {
    return "";
  }
}

async function uniqueClaimCode(d1) {
  for (let i = 0; i < 8; i += 1) {
    const code = mintClaimCode();
    const hit = await d1
      .prepare("SELECT token FROM contact_invites WHERE claim_code = ? AND status = 'open'")
      .bind(code)
      .first();
    if (!hit) return code;
  }
  return mintClaimCode() + mintClaimCode().slice(0, 2);
}

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  if (body.action === "accept") return acceptInvite(d1, request, body);

  const code = String(body.code || "").trim().toUpperCase();
  const guestId = String(body.guestId || "").trim();
  const role = body.role === "buddy" ? "buddy" : "guest";
  if (!CODE_PATTERN.test(code) || !guestId) return json({ error: "Missing invite details." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return json({ error: access.error }, access.status);
  if (access.place !== "host" && access.place !== "cohost") {
    return json({ error: "You can't send this invite." }, 403);
  }

  const plan = await d1
    .prepare("SELECT plan_tier FROM events WHERE id = ?")
    .bind(access.event.id)
    .first();
  const tier = plan?.plan_tier === "pro" ? "pro" : "free";
  if (tier === "free") {
    const invites = await d1
      .prepare("SELECT COUNT(*) as n FROM contact_invites WHERE event_id = ?")
      .bind(access.event.id)
      .first();
    if ((invites?.n || 0) >= 50) {
      return json({ error: "Free plan allows 50 invites. Upgrade to Pro for more." }, 402);
    }
  }

  const name = await loadGuestName(d1, code, guestId);
  if (!name) return json({ error: "That contact has no name yet." }, 400);

  const token = inviteToken();
  const claimCode = await uniqueClaimCode(d1);
  const now = Date.now();
  await d1
    .prepare(
      `INSERT INTO contact_invites
        (token, event_id, guest_id, name, role, invited_by, created_at, claim_code, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    )
    .bind(token, access.event.id, guestId, name, role, access.user.id, now, claimCode, now + CLAIM_TTL_MS)
    .run();

  await awardBuzzPoints(d1, access.user.id, "send_invite", 5, access.event.id);

  const origin = new URL(request.url).origin;
  return json({
    token,
    claimCode,
    name,
    role,
    url: `${origin}/invite/${role}/${token}`,
    claimUrl: `${origin}/claim/${claimCode}`,
    whatsappText: `You're invited to ${access.event.name || "our event"}.\nOpen your invite: ${origin}/claim/${claimCode}\nOr enter code ${claimCode} in BiyeFlow.`,
  });
}

async function acceptInvite(d1, request, body) {
  const token = String(body.token || "").trim();
  if (!token) return json({ error: "Missing invite." }, 400);
  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);
  return bindInvite(d1, user, token);
}

async function bindInvite(d1, user, token) {
  const invite = await d1
    .prepare(
      `SELECT token, event_id, guest_id, name, role, accepted_by, status, claimed_device_id
       FROM contact_invites WHERE token = ?`,
    )
    .bind(token)
    .first();
  if (!invite) return json({ error: "Invite not found." }, 404);
  if (invite.accepted_by && invite.accepted_by !== user.id) {
    return json({ error: "This invite was already accepted." }, 409);
  }

  const event = await d1
    .prepare("SELECT id, code, name, owner_id FROM events WHERE id = ?")
    .bind(invite.event_id)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);

  if (event.owner_id === user.id) {
    return json({
      ok: true,
      code: event.code,
      role: "admin",
      name: invite.name,
      eventName: event.name,
      already: "host",
    });
  }

  const existing = await d1
    .prepare("SELECT id, role FROM memberships WHERE event_id = ? AND user_id = ?")
    .bind(event.id, user.id)
    .first();

  const now = Date.now();
  let role = invite.role === "buddy" ? "buddy" : "guest";
  if (existing?.role === "admin" || existing?.role === "buddy") role = existing.role;
  else if (invite.role === "buddy") role = "buddy";

  if (existing) {
    await d1
      .prepare(
        "UPDATE memberships SET role = ?, display_name = ?, guest_id = ?, status = 'active', updated_at = ? WHERE id = ?",
      )
      .bind(role, invite.name, invite.guest_id, now, existing.id)
      .run();
  } else {
    await d1
      .prepare(
        `INSERT INTO memberships
          (id, event_id, user_id, role, module_grants, status, display_name, guest_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, '{}', 'active', ?, ?, ?, ?)`,
      )
      .bind(newId("m"), event.id, user.id, role, invite.name, invite.guest_id, now, now)
      .run();
    await awardBuzzPoints(d1, user.id, "claim_join", 25, event.id);
  }

  await d1
    .prepare(
      "UPDATE contact_invites SET accepted_by = ?, accepted_at = ?, status = 'claimed' WHERE token = ?",
    )
    .bind(user.id, now, token)
    .run();

  return json({
    ok: true,
    code: event.code,
    role: role === "admin" ? "admin" : role,
    name: invite.name,
    eventName: event.name,
  });
}
