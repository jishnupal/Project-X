/**
 * POST /api/push/unsubscribe
 * Body: { deviceId, eventId? , eventCode? }
 */
import { ensureAuthSchema, json, parseCookie, validateSession } from "../_auth.js";

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
  if (!deviceId) return json({ error: "Missing device." }, 400);

  let eventId = String(body.eventId || "").trim();
  const eventCode = String(body.eventCode || body.code || "").trim().toUpperCase();
  if (!eventId && eventCode) {
    const ev = await d1.prepare("SELECT id FROM events WHERE code = ?").bind(eventCode).first();
    eventId = ev?.id || "";
  }

  if (eventId) {
    await d1
      .prepare(
        `UPDATE user_devices
         SET push_endpoint = NULL, push_p256dh = NULL, push_auth = NULL
         WHERE device_id = ? AND user_id = ? AND event_id = ?`,
      )
      .bind(deviceId, user.id, eventId)
      .run();
  } else {
    await d1
      .prepare(
        `UPDATE user_devices
         SET push_endpoint = NULL, push_p256dh = NULL, push_auth = NULL
         WHERE device_id = ? AND user_id = ?`,
      )
      .bind(deviceId, user.id)
      .run();
  }

  return json({ ok: true });
}
