/**
 * POST /api/invites/claim
 * Body: { code | token, deviceId?, deviceLabel? }
 * Claims a unique invite without Google. Burns the code onto this device.
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  createAuthSession,
  sessionCookie,
  mintClaimCode,
  awardBuzzPoints,
} from "../_auth.js";

const CLAIM_WINDOW_MS = 15 * 60 * 1000;
const CLAIM_MAX_TRIES = 12;

async function rateLimit(d1, key) {
  const now = Date.now();
  const row = await d1.prepare("SELECT count, window_start FROM claim_attempts WHERE key = ?").bind(key).first();
  if (!row || now - row.window_start > CLAIM_WINDOW_MS) {
    await d1
      .prepare(
        "INSERT OR REPLACE INTO claim_attempts (key, count, window_start) VALUES (?, 1, ?)",
      )
      .bind(key, now)
      .run();
    return true;
  }
  if (row.count >= CLAIM_MAX_TRIES) return false;
  await d1
    .prepare("UPDATE claim_attempts SET count = count + 1 WHERE key = ?")
    .bind(key)
    .run();
  return true;
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

  const raw =
    String(body.code || body.claimCode || "").trim().toUpperCase() ||
    String(body.token || "").trim();
  if (!raw) return json({ error: "Enter your invite code." }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "local";
  const allowed = await rateLimit(d1, `claim:${ip}`);
  if (!allowed) return json({ error: "Too many tries. Wait a few minutes." }, 429);

  const deviceId =
    String(body.deviceId || "").trim() ||
    newId("dev").replace("dev_", "d");
  const deviceLabel = String(body.deviceLabel || "Phone").trim() || "Phone";

  const invite = await d1
    .prepare(
      `SELECT token, event_id, guest_id, name, role, accepted_by, status, claim_code,
              claimed_device_id, expires_at
       FROM contact_invites
       WHERE claim_code = ? OR token = ?`,
    )
    .bind(raw, raw)
    .first();

  if (!invite) return json({ error: "Invite not found." }, 404);
  if (invite.expires_at && invite.expires_at < Date.now()) {
    return json({ error: "This invite has expired." }, 410);
  }

  const status = invite.status || (invite.accepted_by ? "claimed" : "open");
  if (status === "claimed" && invite.claimed_device_id && invite.claimed_device_id !== deviceId) {
    return json({ error: "This invite was already claimed on another device." }, 409);
  }

  const event = await d1
    .prepare("SELECT id, code, name, owner_id FROM events WHERE id = ?")
    .bind(invite.event_id)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);

  const existingSession = await validateSession(d1, parseCookie(request));
  const now = Date.now();
  const role = invite.role === "buddy" ? "buddy" : "guest";
  const firstClaim = status !== "claimed";

  // Host testing their own WhatsApp link still has a host session cookie.
  // Never attach a guest/buddy invite to the event owner — mint a provisional guest
  // so the invite claims and hosts get the join activity + push.
  let userId = existingSession?.id || invite.accepted_by || null;
  if (userId && event.owner_id === userId) {
    userId = null;
  }

  if (!userId) {
    userId = newId("u");
    const email = `claim+${userId.replace(/[^a-z0-9]/gi, "")}@pending.biyeflow.local`;
    await d1
      .prepare(
        `INSERT INTO users
          (id, email, name, avatar_url, google_sub, platform_role, created_at, updated_at, buzz_points, is_provisional)
         VALUES (?, ?, ?, NULL, NULL, 'customer', ?, ?, 0, 1)`,
      )
      .bind(userId, email, invite.name, now, now)
      .run();
  }

  const existing = await d1
    .prepare("SELECT id, role FROM memberships WHERE event_id = ? AND user_id = ?")
    .bind(event.id, userId)
    .first();

  let nextRole = role;
  if (existing?.role === "admin" || existing?.role === "buddy") nextRole = existing.role;

  if (existing) {
    await d1
      .prepare(
        "UPDATE memberships SET role = ?, display_name = ?, guest_id = ?, status = 'active', updated_at = ? WHERE id = ?",
      )
      .bind(nextRole, invite.name, invite.guest_id, now, existing.id)
      .run();
  } else {
    await d1
      .prepare(
        `INSERT INTO memberships
          (id, event_id, user_id, role, module_grants, status, display_name, guest_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, '{}', 'active', ?, ?, ?, ?)`,
      )
      .bind(newId("m"), event.id, userId, nextRole, invite.name, invite.guest_id, now, now)
      .run();
    await awardBuzzPoints(d1, userId, "claim_join", 25, event.id);
  }

  const deviceRow = await d1
    .prepare("SELECT id FROM user_devices WHERE device_id = ? AND user_id = ? AND event_id = ?")
    .bind(deviceId, userId, event.id)
    .first();
  if (deviceRow) {
    await d1
      .prepare("UPDATE user_devices SET last_seen = ?, label = ?, revoked_at = NULL WHERE id = ?")
      .bind(now, deviceLabel, deviceRow.id)
      .run();
  } else {
    await d1
      .prepare(
        `INSERT INTO user_devices
          (id, device_id, user_id, event_id, label, platform, last_seen)
         VALUES (?, ?, ?, ?, ?, 'web', ?)`,
      )
      .bind(newId("ud"), deviceId, userId, event.id, deviceLabel, now)
      .run();
  }

  await d1
    .prepare(
      `UPDATE contact_invites
       SET accepted_by = ?, accepted_at = ?, status = 'claimed', claimed_device_id = ?
       WHERE token = ?`,
    )
    .bind(userId, now, deviceId, invite.token)
    .run();

  if (firstClaim) {
    try {
      const { appendActivityToWedding, dispatchPush, newActivityItem } = await import("../_push.js");
      const name = String(invite.name || "Someone").trim() || "Someone";
      const item = newActivityItem({
        type: "invite.claimed",
        title: `${name} joined`,
        body: "Invite accepted",
        href: "/command-center?invites=1",
        audience: "host",
      });
      await appendActivityToWedding(d1, event.code, item);
      await dispatchPush(env, d1, {
        eventId: event.id,
        eventCode: event.code,
        type: item.type,
        title: item.title,
        body: item.body,
        href: "/command-center",
        audience: "host",
      });
    } catch {
      /* non-fatal */
    }
  }

  const sessionToken = await createAuthSession(d1, userId, deviceId, deviceLabel);

  return json(
    {
      ok: true,
      code: event.code,
      role: nextRole,
      name: invite.name,
      guestId: invite.guest_id,
      eventName: event.name,
      deviceId,
      provisional: true,
    },
    200,
    { "Set-Cookie": sessionCookie(sessionToken) },
  );
}

// Keep mint available for tests / re-exports
export { mintClaimCode };
