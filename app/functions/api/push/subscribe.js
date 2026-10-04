/**
 * POST /api/push/subscribe
 * Body: { deviceId, eventId?, eventCode?, endpoint, keys: { p256dh, auth } }
 */
import {
  ensureAuthSchema,
  json,
  newId,
  parseCookie,
  validateSession,
} from "../_auth.js";

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

  const deviceId = String(body.deviceId || "").trim();
  const endpoint = String(body.endpoint || "").trim();
  const p256dh = String(body.keys?.p256dh || body.p256dh || "").trim();
  const auth = String(body.keys?.auth || body.auth || "").trim();
  if (!deviceId || !endpoint || !p256dh || !auth) {
    return json({ error: "Missing subscription fields." }, 400);
  }

  let eventId = String(body.eventId || "").trim();
  const eventCode = String(body.eventCode || body.code || "").trim().toUpperCase();
  if (!eventId && eventCode) {
    const ev = await d1.prepare("SELECT id FROM events WHERE code = ?").bind(eventCode).first();
    eventId = ev?.id || "";
  }
  if (!eventId) return json({ error: "Missing event." }, 400);

  const membership = await d1
    .prepare(
      "SELECT id FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(eventId, user.id)
    .first();
  const owner = await d1.prepare("SELECT owner_id FROM events WHERE id = ?").bind(eventId).first();
  if (!membership && owner?.owner_id !== user.id) {
    return json({ error: "Not a member of this event." }, 403);
  }

  const now = Date.now();
  const existing = await d1
    .prepare("SELECT id FROM user_devices WHERE device_id = ? AND user_id = ? AND event_id = ?")
    .bind(deviceId, user.id, eventId)
    .first();

  if (existing) {
    await d1
      .prepare(
        `UPDATE user_devices
         SET push_endpoint = ?, push_p256dh = ?, push_auth = ?, last_seen = ?, revoked_at = NULL
         WHERE id = ?`,
      )
      .bind(endpoint, p256dh, auth, now, existing.id)
      .run();
  } else {
    await d1
      .prepare(
        `INSERT INTO user_devices
          (id, device_id, user_id, event_id, label, platform, last_seen, push_endpoint, push_p256dh, push_auth)
         VALUES (?, ?, ?, ?, ?, 'web', ?, ?, ?, ?)`,
      )
      .bind(
        newId("ud"),
        deviceId,
        user.id,
        eventId,
        String(body.deviceLabel || "Web").trim() || "Web",
        now,
        endpoint,
        p256dh,
        auth,
      )
      .run();
  }

  return json({ ok: true });
}
