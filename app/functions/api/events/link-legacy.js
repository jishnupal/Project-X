/**
 * POST /api/events/link-legacy
 *
 * Bridges a legacy event code to the new auth system.
 * If the user has an event code (from the old system), this creates
 * an event + membership so it shows up on their dashboard.
 *
 * Body: { code: "ABCD1234", role: "admin" | "buddy" | "guest" }
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../_auth.js";

const CODE_PATTERN = /^[A-Z0-9]{8}$/;

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return json({ error: "Sign in required." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const code = String(body.code || "").trim().toUpperCase();
  if (!CODE_PATTERN.test(code)) {
    return json({ error: "Invalid event code." }, 400);
  }

  // Check if this event code exists in the legacy sync store
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS weddings_v2 (
          code TEXT PRIMARY KEY NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          payload TEXT NOT NULL
        )`
      )
      .run();
  } catch { /* table may already exist */ }

  const wedding = await d1
    .prepare("SELECT version, payload FROM weddings_v2 WHERE code = ?")
    .bind(code)
    .first();

  if (!wedding) {
    return json({ error: "Event not found. Check the code." }, 404);
  }

  // Parse wedding name from payload
  let weddingName = "My event";
  try {
    const state = JSON.parse(wedding.payload);
    if (state?.event?.name) weddingName = state.event.name;
    else if (state?.event?.coupleName) weddingName = state.event.coupleName;
  } catch { /* use default */ }

  // Check if event already exists for this code
  const existingEvent = await d1
    .prepare("SELECT id, owner_id, name FROM events WHERE code = ?")
    .bind(code)
    .first();

  if (!existingEvent) {
    return json({ error: "This event belongs to someone else." }, 403);
  }

  const eventId = existingEvent.id;
  if (existingEvent.name) weddingName = existingEvent.name;

  const existingMembership = await d1
    .prepare("SELECT id, role FROM memberships WHERE event_id = ? AND user_id = ?")
    .bind(eventId, user.id)
    .first();

  if (existingMembership) {
    return json({
      ok: true,
      linked: false,
      message: "Already linked.",
      event: { id: eventId, code, name: weddingName, role: existingMembership.role },
    });
  }

  if (existingEvent.owner_id !== user.id) {
    return json({ error: "This event belongs to someone else." }, 403);
  }

  const now = Date.now();
  const membershipId = newId("m");
  await d1
    .prepare(
      "INSERT INTO memberships (id, event_id, user_id, role, module_grants, status, created_at, updated_at) VALUES (?, ?, ?, 'admin', '{}', 'active', ?, ?)"
    )
    .bind(membershipId, eventId, user.id, now, now)
    .run();

  return json({
    ok: true,
    linked: true,
    message: `Linked ${code} to your account as host.`,
    event: { id: eventId, code, name: weddingName, role: "admin" },
  });
}
