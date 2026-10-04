/**
 * Web Push (VAPID) helpers for Pages Functions.
 */
import { buildPushPayload } from "@block65/webcrypto-web-push";
import { newId } from "./_auth.js";

const ACTIVITY_CAP = 30;

export function getVapidPublicKey(env) {
  return String(env.VAPID_PUBLIC_KEY || "").trim();
}

function getVapidConfig(env) {
  const publicKey = String(env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = String(env.VAPID_PRIVATE_KEY || "").trim();
  const subject = String(env.VAPID_SUBJECT || "mailto:hello@biyeflow.app").trim();
  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export async function ensureNotificationsTable(d1) {
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        event_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        target_role TEXT,
        target_user_id TEXT,
        payload TEXT,
        sent_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
    )
    .run();
}

export async function appendActivityToWedding(d1, code, item) {
  if (!d1 || !code) return false;
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS weddings_v2 (
        code TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        payload TEXT NOT NULL
      )`,
    )
    .run();

  const upper = String(code).toUpperCase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = await d1
      .prepare("SELECT version, payload FROM weddings_v2 WHERE code = ?")
      .bind(upper)
      .first();
    if (!row?.payload) return false;
    let state;
    try {
      state = JSON.parse(row.payload);
    } catch {
      return false;
    }
    const activity = Array.isArray(state.activity) ? state.activity : [];
    // Skip duplicate append if the same activity id is already present.
    if (activity.some((entry) => entry?.id === item?.id)) return true;
    state.activity = [item, ...activity].slice(0, ACTIVITY_CAP);
    const payload = JSON.stringify(state);
    const result = await d1
      .prepare(
        "UPDATE weddings_v2 SET version = version + 1, payload = ? WHERE code = ? AND version = ?",
      )
      .bind(payload, upper, row.version)
      .run();
    if ((result?.meta?.changes || 0) > 0) return true;
  }
  return false;
}

/**
 * Fan-out push to devices for an event, filtered by audience.
 * audience: host | guest | buddy | all
 */
export async function dispatchPush(env, d1, {
  eventId,
  eventCode,
  type,
  title,
  body,
  href,
  audience = "all",
  targetUserId = null,
  targetGuestId = null,
}) {
  if (!d1 || !eventId) return { sent: 0, skipped: true };
  const vapid = getVapidConfig(env);
  if (!vapid) return { sent: 0, skipped: true, reason: "vapid_missing" };

  await ensureNotificationsTable(d1);
  const now = Date.now();
  const notifId = newId("n");
  await d1
    .prepare(
      `INSERT INTO notifications
        (id, event_id, type, title, body, target_role, target_user_id, payload, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      notifId,
      eventId,
      type,
      title,
      body || null,
      audience,
      targetUserId,
      JSON.stringify({ href, targetGuestId, eventCode }),
      now,
      now,
    )
    .run();

  const event = await d1.prepare("SELECT owner_id FROM events WHERE id = ?").bind(eventId).first();
  const ownerId = event?.owner_id || null;

  let sql = `
    SELECT ud.push_endpoint, ud.push_p256dh, ud.push_auth, ud.id AS device_row_id, m.role, m.guest_id, m.user_id
    FROM user_devices ud
    LEFT JOIN memberships m ON m.user_id = ud.user_id AND m.event_id = ud.event_id AND m.status = 'active'
    WHERE ud.event_id = ?
      AND ud.revoked_at IS NULL
      AND ud.push_endpoint IS NOT NULL
      AND ud.push_p256dh IS NOT NULL
      AND ud.push_auth IS NOT NULL
  `;
  const binds = [eventId];

  if (audience === "host") {
    sql += ` AND (m.role = 'admin' OR ud.user_id = ?)`;
    binds.push(ownerId || "");
  } else if (audience === "guest") {
    sql += ` AND m.role IN ('guest', 'buddy')`;
  } else if (audience === "buddy") {
    sql += ` AND m.role = 'buddy'`;
    if (targetGuestId) {
      sql += ` AND m.guest_id = ?`;
      binds.push(targetGuestId);
    }
    if (targetUserId) {
      sql += ` AND m.user_id = ?`;
      binds.push(targetUserId);
    }
  } else {
    // all → member or event owner device
    sql += ` AND (m.user_id IS NOT NULL OR ud.user_id = ?)`;
    binds.push(ownerId || "");
  }

  const { results } = await d1.prepare(sql).bind(...binds).all();
  const rows = results || [];
  let sent = 0;
  let failed = 0;

  const message = {
    data: {
      title,
      body: body || "",
      href: href || "/",
      type,
    },
    options: {
      ttl: 60 * 60 * 12,
      urgency: type === "invite.claimed" || type === "broadcast" ? "high" : "normal",
    },
  };

  for (const row of rows) {
    try {
      const subscription = {
        endpoint: row.push_endpoint,
        expirationTime: null,
        keys: { p256dh: row.push_p256dh, auth: row.push_auth },
      };
      const payload = await buildPushPayload(message, subscription, vapid);
      // Apple accepts TTL; some runtimes are case-sensitive on the header name.
      if (payload?.headers?.ttl && !payload.headers.TTL) {
        payload.headers.TTL = String(payload.headers.ttl);
      }
      const res = await fetch(row.push_endpoint, payload);
      if (res.status === 201 || res.status === 200) {
        sent += 1;
      } else if (res.status === 404 || res.status === 410) {
        failed += 1;
        await d1
          .prepare(
            "UPDATE user_devices SET push_endpoint = NULL, push_p256dh = NULL, push_auth = NULL WHERE id = ?",
          )
          .bind(row.device_row_id)
          .run();
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    sent,
    failed,
    total: rows.length,
    reason: rows.length === 0 ? "no_subscribers" : undefined,
  };
}

function defaultActivityHref(type) {
  if (type === "task.assigned" || type === "task.updated") return "/buddies";
  if (type === "buzz.published" || type === "broadcast") return "/buzz";
  if (type === "invite.claimed") return "/command-center?invites=1";
  return "/command-center";
}

export function newActivityItem({ type, title, body, href, audience, targetGuestId, targetUserId }) {
  const kind = String(type || "broadcast").trim();
  return {
    id: newId("act"),
    type: kind,
    title: String(title || "").trim(),
    body: body ? String(body).trim() : undefined,
    href: href || defaultActivityHref(kind),
    audience: audience || "all",
    targetGuestId: targetGuestId || undefined,
    targetUserId: targetUserId || undefined,
    createdAt: Date.now(),
  };
}
