/**
 * POST /api/cohost/accept
 * Body: { token }
 *
 * The signed-in Google account must be the invited email.
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const sessionToken = parseCookie(request);
  const user = await validateSession(d1, sessionToken);
  if (!user) return json({ error: "Sign in with Google to accept." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const token = String(body.token || "").trim();
  if (token.length < 16) return json({ error: "Invalid invite." }, 400);

  const invite = await d1
    .prepare(
      "SELECT token, event_id, email, expires_at, accepted_at FROM event_invites WHERE token = ?",
    )
    .bind(token)
    .first();
  if (!invite) return json({ error: "This invite is no longer valid." }, 404);
  if (invite.expires_at <= Date.now() && !invite.accepted_at) {
    return json({ error: "This invite has expired. Ask the host for a new link." }, 410);
  }

  const email = String(user.email || "").toLowerCase();
  if (email !== String(invite.email || "").toLowerCase()) {
    return json({
      error: `This invite is for ${invite.email}. Sign in with that Google account.`,
    }, 403);
  }

  const event = await d1
    .prepare("SELECT id, code, name, owner_id FROM events WHERE id = ?")
    .bind(invite.event_id)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);
  if (event.owner_id === user.id) {
    return json({ error: "You are already the host of this event." }, 400);
  }

  const existing = await d1
    .prepare("SELECT id, role, status FROM memberships WHERE event_id = ? AND user_id = ?")
    .bind(event.id, user.id)
    .first();

  const alreadyHost = existing?.status === "active" && existing?.role === "admin";
  if (existing && !alreadyHost && invite.accepted_at) {
    return json({ error: "The host removed this co-host." }, 403);
  }

  const now = Date.now();
  if (!alreadyHost) {
    const seated = await d1
      .prepare(
        `SELECT user_id FROM memberships
         WHERE event_id = ? AND role = 'admin' AND status = 'active' AND user_id != ? AND user_id != ?
         LIMIT 1`,
      )
      .bind(event.id, event.owner_id, user.id)
      .first();
    if (seated) return json({ error: "This event already has a co-host." }, 409);

    if (!existing) {
      await d1
        .prepare(
          `INSERT INTO memberships (id, event_id, user_id, role, module_grants, status, invited_at, created_at, updated_at)
           VALUES (?, ?, ?, 'admin', '{}', 'active', ?, ?, ?)`,
        )
        .bind(newId("m"), event.id, user.id, now, now, now)
        .run();
    } else {
      await d1
        .prepare(
          `UPDATE memberships
           SET role = 'admin', status = 'active', blocked_by = NULL, blocked_at = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .bind(now, existing.id)
        .run();
    }
  }

  if (!invite.accepted_at) {
    await d1
      .prepare("UPDATE event_invites SET accepted_at = ? WHERE token = ?")
      .bind(now, token)
      .run();
  }

  return json({
    ok: true,
    code: event.code,
    name: event.name,
  });
}
