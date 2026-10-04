/**
 * Co-host seat for one event.
 *
 * GET  /api/events/cohost?code=ABCD1234
 * POST /api/events/cohost  { action: "invite" | "revoke", code, email? }
 *
 * Only the event owner can invite or remove. One co-host. The invite
 * is an email-bound link; membership starts when that Google account accepts.
 */
import {
  json,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../_auth.js";

const CODE_PATTERN = /^[A-Z0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function inviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hostContext(d1, request, code) {
  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return { error: "Sign in required.", status: 401 };
  if (!CODE_PATTERN.test(code)) return { error: "Invalid event code.", status: 400 };

  const event = await d1
    .prepare("SELECT id, code, name, owner_id FROM events WHERE code = ?")
    .bind(code)
    .first();
  if (!event) return { error: "Event not found.", status: 404 };

  const membership = await d1
    .prepare("SELECT role, status FROM memberships WHERE event_id = ? AND user_id = ?")
    .bind(event.id, user.id)
    .first();
  if (!membership || membership.status !== "active") {
    return { error: "You are not on this event.", status: 403 };
  }

  return { user, event, isOwner: event.owner_id === user.id };
}

async function activeCohost(d1, event) {
  return d1
    .prepare(
      `SELECT m.user_id, u.email, u.name
       FROM memberships m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.event_id = ? AND m.role = 'admin' AND m.status = 'active' AND m.user_id != ?
       LIMIT 1`,
    )
    .bind(event.id, event.owner_id)
    .first();
}

async function pendingInvite(d1, eventId) {
  return d1
    .prepare(
      `SELECT token, email, expires_at FROM event_invites
       WHERE event_id = ? AND accepted_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(eventId, Date.now())
    .first();
}

function present(event, isOwner, cohost) {
  return { isOwner, eventName: event.name, cohost };
}

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() || "";
  const ctx = await hostContext(d1, request, code);
  if (ctx.error) return json({ error: ctx.error }, ctx.status);

  const seated = await activeCohost(d1, ctx.event);
  if (seated) {
    return json(present(ctx.event, ctx.isOwner, {
      email: seated.email,
      name: seated.name,
      status: "active",
    }));
  }

  if (ctx.isOwner) {
    const pending = await pendingInvite(d1, ctx.event.id);
    if (pending) {
      return json(present(ctx.event, true, {
        email: pending.email,
        status: "pending",
        token: pending.token,
      }));
    }
  }

  return json(present(ctx.event, ctx.isOwner, null));
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

  const code = String(body.code || "").trim().toUpperCase();
  const ctx = await hostContext(d1, request, code);
  if (ctx.error) return json({ error: ctx.error }, ctx.status);
  if (!ctx.isOwner) return json({ error: "Only the host can change the co-host." }, 403);

  const action = String(body.action || "");

  if (action === "invite") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
      return json({ error: "Enter a valid email." }, 400);
    }
    if (email === String(ctx.user.email || "").toLowerCase()) {
      return json({ error: "That is already your account." }, 400);
    }

    const seated = await activeCohost(d1, ctx.event);
    if (seated) {
      return json({ error: "Remove the current co-host before inviting another." }, 409);
    }

    const now = Date.now();
    await d1
      .prepare("DELETE FROM event_invites WHERE event_id = ? AND accepted_at IS NULL")
      .bind(ctx.event.id)
      .run();

    const token = inviteToken();
    await d1
      .prepare(
        `INSERT INTO event_invites (token, event_id, email, role, invited_by, expires_at, created_at)
         VALUES (?, ?, ?, 'admin', ?, ?, ?)`,
      )
      .bind(token, ctx.event.id, email, ctx.user.id, now + INVITE_TTL_MS, now)
      .run();

    return json({
      ok: true,
      cohost: { email, status: "pending", token },
    });
  }

  if (action === "revoke") {
    const seated = await activeCohost(d1, ctx.event);
    await d1
      .prepare("DELETE FROM event_invites WHERE event_id = ?")
      .bind(ctx.event.id)
      .run();

    if (seated?.user_id) {
      await d1
        .prepare(
          `UPDATE memberships SET status = 'removed', updated_at = ?
           WHERE event_id = ? AND user_id = ? AND role = 'admin'`,
        )
        .bind(Date.now(), ctx.event.id, seated.user_id)
        .run();

      await dropCohostSessions(d1, code, seated.user_id);
    }

    return json({ ok: true, cohost: null });
  }

  return json({ error: "Unknown action." }, 400);
}

async function dropCohostSessions(d1, code, userId) {
  try {
    const row = await d1.prepare("SELECT payload FROM wedding_access WHERE code = ?").bind(code).first();
    if (!row?.payload) return;
    const access = JSON.parse(row.payload);
    access.sessions = (access.sessions || []).filter((session) => session.userId !== userId);
    await d1
      .prepare("UPDATE wedding_access SET payload = ?, updated_at = ? WHERE code = ?")
      .bind(JSON.stringify(access), Date.now(), code)
      .run();
  } catch {
    /* access blob is best-effort */
  }
}
