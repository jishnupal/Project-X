/**
 * /api/events/:eventId/devices
 *
 * GET  — list devices for this event (admin: all devices; others: own devices)
 * POST — actions: register, revoke, heartbeat
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../../_auth.js";

const DEVICE_TTL_MS = 24 * 60 * 60 * 1000; // 24h idle = pruned from list

async function getRequestContext(d1, request, eventId) {
  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return { error: "Sign in required.", status: 401 };

  const membership = await d1
    .prepare("SELECT id, role, status FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'")
    .bind(eventId, user.id)
    .first();

  if (!membership) return { error: "You are not a member of this event.", status: 403 };
  return { user, membership };
}

// ─── GET: list devices ─────────────────────────────────────
export async function onRequestGet({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const eventId = params.eventId;
  const ctx = await getRequestContext(d1, request, eventId);
  if (ctx.error) return json({ error: ctx.error }, ctx.status);

  let query, binds;
  if (ctx.membership.role === "admin") {
    query = `SELECT d.id, d.device_id, d.user_id, d.label, d.platform, d.last_seen, d.revoked_at,
                    u.name, u.email
             FROM user_devices d
             LEFT JOIN users u ON u.id = d.user_id
             WHERE d.event_id = ?
             ORDER BY d.last_seen DESC`;
    binds = [eventId];
  } else {
    query = `SELECT id, device_id, label, platform, last_seen, revoked_at
             FROM user_devices
             WHERE event_id = ? AND user_id = ?
             ORDER BY last_seen DESC`;
    binds = [eventId, ctx.user.id];
  }

  const stmt = d1.prepare(query);
  const rows = await stmt.bind(...binds).all();

  return json({
    devices: (rows?.results || []).map((d) => ({
      id: d.id,
      deviceId: d.device_id,
      userId: d.user_id,
      userName: d.name,
      userEmail: d.email,
      label: d.label,
      platform: d.platform,
      lastSeen: d.last_seen,
      revokedAt: d.revoked_at,
    })),
  });
}

// ─── POST: device actions ──────────────────────────────────
export async function onRequestPost({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const eventId = params.eventId;
  const ctx = await getRequestContext(d1, request, eventId);
  if (ctx.error) return json({ error: ctx.error }, ctx.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const action = String(body.action || "");

  // ── Register / heartbeat device ──────────────────────────
  if (action === "register" || action === "heartbeat") {
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "deviceId required." }, 400);

    const label = String(body.label || "").trim() || "Device";
    const platform = String(body.platform || "web").trim();
    const now = Date.now();

    // Check if revoked
    const existing = await d1
      .prepare("SELECT id, revoked_at FROM user_devices WHERE device_id = ? AND user_id = ? AND event_id = ?")
      .bind(deviceId, ctx.user.id, eventId)
      .first();

    if (existing?.revoked_at) {
      return json({ error: "This device was removed. Contact the event admin." }, 403);
    }

    if (existing) {
      await d1
        .prepare("UPDATE user_devices SET label = ?, platform = ?, last_seen = ? WHERE id = ?")
        .bind(label, platform, now, existing.id)
        .run();
    } else {
      const id = newId("dev");
      await d1
        .prepare(
          "INSERT INTO user_devices (id, device_id, user_id, event_id, label, platform, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id, deviceId, ctx.user.id, eventId, label, platform, now)
        .run();
    }

    return json({ ok: true });
  }

  // ── Revoke a device (admin only) ─────────────────────────
  if (action === "revoke") {
    if (ctx.membership.role !== "admin") {
      return json({ error: "Admin access required." }, 403);
    }

    const targetDeviceId = String(body.targetDeviceId || "").trim();
    if (!targetDeviceId) return json({ error: "targetDeviceId required." }, 400);

    const now = Date.now();
    const result = await d1
      .prepare("UPDATE user_devices SET revoked_at = ?, revoked_by = ? WHERE device_id = ? AND event_id = ? AND revoked_at IS NULL")
      .bind(now, ctx.user.id, targetDeviceId, eventId)
      .run();

    if ((result?.meta?.changes || 0) === 0) {
      return json({ error: "Device not found or already revoked." }, 404);
    }

    // Kill sessions on that device
    const device = await d1
      .prepare("SELECT user_id FROM user_devices WHERE device_id = ? AND event_id = ?")
      .bind(targetDeviceId, eventId)
      .first();

    if (device) {
      await d1
        .prepare("DELETE FROM auth_sessions WHERE user_id = ? AND device_id = ?")
        .bind(device.user_id, targetDeviceId)
        .run();
    }

    return json({ ok: true, message: "Device revoked." });
  }

  return json({ error: "Unknown action." }, 400);
}
