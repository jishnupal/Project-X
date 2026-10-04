/**
 * POST /api/push/dispatch
 * Push-only fan-out after client already appended activity to synced state.
 * Body: { eventId?, eventCode?, type, title, body?, href?, audience, targetGuestId?, targetUserId? }
 */
import { ensureAuthSchema, json, parseCookie, validateSession } from "../_auth.js";
import { dispatchPush } from "../_push.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const title = String(body.title || "").trim();
  const type = String(body.type || "broadcast").trim();
  if (!title) return json({ error: "Missing title." }, 400);

  let eventId = String(body.eventId || "").trim();
  const eventCode = String(body.eventCode || body.code || "").trim().toUpperCase();
  if (!eventId && eventCode) {
    const ev = await d1.prepare("SELECT id, code FROM events WHERE code = ?").bind(eventCode).first();
    eventId = ev?.id || "";
  }
  if (!eventId) return json({ error: "Missing event." }, 400);

  const event = await d1
    .prepare("SELECT id, code, owner_id FROM events WHERE id = ?")
    .bind(eventId)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);

  const membership = await d1
    .prepare(
      "SELECT role FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(eventId, user.id)
    .first();
  const isOwner = event.owner_id === user.id;
  const role = membership?.role || (isOwner ? "admin" : null);
  if (!role) return json({ error: "Not a member." }, 403);

  const audience = String(body.audience || "all");
  // Guests may only dispatch if somehow needed — hosts/buddies for task updates
  if (role === "guest") return json({ error: "Not allowed." }, 403);

  const result = await dispatchPush(env, d1, {
    eventId,
    eventCode: event.code,
    type,
    title,
    body: body.body ? String(body.body) : "",
    href: body.href ? String(body.href) : "/",
    audience,
    targetUserId: body.targetUserId || null,
    targetGuestId: body.targetGuestId || null,
  });

  return json({ ok: true, ...result });
}
