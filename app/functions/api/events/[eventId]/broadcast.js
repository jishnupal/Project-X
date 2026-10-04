/**
 * POST /api/events/:eventId/broadcast
 * Host cheesy / custom push to event members.
 */
import { ensureAuthSchema, json, parseCookie, validateSession } from "../../_auth.js";
import { appendActivityToWedding, dispatchPush, newActivityItem } from "../../_push.js";

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;

export async function onRequestPost({ request, env, params }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);

  const eventId = String(params.eventId || "").trim();
  if (!eventId) return json({ error: "Missing event." }, 400);

  const event = await d1
    .prepare("SELECT id, code, owner_id, name FROM events WHERE id = ?")
    .bind(eventId)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);

  const membership = await d1
    .prepare(
      "SELECT role FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(eventId, user.id)
    .first();
  const isHost = event.owner_id === user.id || membership?.role === "admin";
  if (!isHost) return json({ error: "Only the host can broadcast." }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const title = String(body.title || "").trim().slice(0, 80);
  const text = String(body.body || "").trim().slice(0, 160);
  if (!title) return json({ error: "Add a title." }, 400);

  let audience = String(body.audience || "guest");
  if (!["guest", "buddy", "all"].includes(audience)) audience = "guest";

  const since = Date.now() - HOUR_MS;
  const recent = await d1
    .prepare(
      `SELECT COUNT(*) AS c FROM notifications
       WHERE event_id = ? AND type = 'broadcast' AND created_at >= ?`,
    )
    .bind(eventId, since)
    .first();
  if (Number(recent?.c || 0) >= MAX_PER_HOUR) {
    return json({ error: "Slow down — max 5 broadcasts per hour." }, 429);
  }

  const item = newActivityItem({
    type: "broadcast",
    title,
    body: text,
    href: "/buzz",
    audience: audience === "all" ? "all" : audience,
  });

  await appendActivityToWedding(d1, event.code, item);

  const push = await dispatchPush(env, d1, {
    eventId,
    eventCode: event.code,
    type: "broadcast",
    title,
    body: text,
    href: "/command-center",
    audience: audience === "buddy" ? "buddy" : audience === "all" ? "all" : "guest",
  });

  return json({ ok: true, activity: item, push });
}
