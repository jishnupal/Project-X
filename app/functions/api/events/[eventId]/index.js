/**
 * /api/events/:eventId
 *
 * GET    — event summary + config (members of the event).
 * DELETE — soft-delete an empty event. Data stays for a day.
 * POST   — { action: "restore" } puts it back within that day.
 * POST   — { action: "rename", name } updates the event name.
 * POST   — { action: "updateConfig", config: { visibility } } host/cohost settings.
 */
import {
  json,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  eventStateIsEmpty,
} from "../../_auth.js";

const KEEP_MS = 24 * 60 * 60 * 1000;

function parseConfig(raw) {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeVisibility(value) {
  return value === "public" ? "public" : "invite";
}

async function requireOwner(d1, request, eventId) {
  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return { error: "Sign in required.", status: 401 };

  const event = await d1
    .prepare("SELECT id, code, owner_id, name, deleted_at, config FROM events WHERE id = ?")
    .bind(eventId)
    .first();
  if (!event) return { error: "Event not found.", status: 404 };
  if (event.owner_id !== user.id) return { error: "Only the host can change this event.", status: 403 };

  return { user, event };
}

async function requireHostOrCohost(d1, request, eventId) {
  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return { error: "Sign in required.", status: 401 };

  const event = await d1
    .prepare("SELECT id, code, owner_id, name, deleted_at, config FROM events WHERE id = ?")
    .bind(eventId)
    .first();
  if (!event) return { error: "Event not found.", status: 404 };
  if (event.deleted_at) return { error: "This event is removed.", status: 409 };

  if (event.owner_id === user.id) return { user, event, place: "host" };

  const membership = await d1
    .prepare(
      "SELECT role FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(eventId, user.id)
    .first();
  if (membership?.role === "admin") return { user, event, place: "cohost" };
  return { error: "Only the host can change this event.", status: 403 };
}

export async function onRequestGet({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return json({ error: "Sign in required." }, 401);

  const event = await d1
    .prepare("SELECT id, code, owner_id, name, deleted_at, config FROM events WHERE id = ?")
    .bind(params.eventId)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);
  if (event.deleted_at) return json({ error: "This event is removed." }, 409);

  const isOwner = event.owner_id === user.id;
  const membership = await d1
    .prepare(
      "SELECT role FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(params.eventId, user.id)
    .first();
  if (!isOwner && !membership) return json({ error: "Not a member." }, 403);

  const config = parseConfig(event.config);
  return json({
    id: event.id,
    code: event.code,
    name: event.name,
    owner: isOwner,
    config: {
      visibility: normalizeVisibility(config.visibility),
    },
  });
}

async function loadState(d1, code) {
  try {
    const row = await d1.prepare("SELECT payload FROM weddings_v2 WHERE code = ?").bind(code).first();
    if (!row?.payload) return null;
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

export async function onRequestDelete({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const gate = await requireOwner(d1, request, params.eventId);
  if (gate.error) return json({ error: gate.error }, gate.status);

  if (gate.event.deleted_at) return json({ error: "This event is already removed." }, 409);

  const state = await loadState(d1, gate.event.code);
  if (!eventStateIsEmpty(state)) {
    return json({ error: "This event has been set up, so it can't be deleted." }, 409);
  }

  const now = Date.now();
  await d1.prepare("UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, params.eventId).run();
  return json({ ok: true, deletedAt: now, restoreUntil: now + KEEP_MS });
}

export async function onRequestPost({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const action = body?.action;
  if (action !== "restore" && action !== "rename" && action !== "updateConfig") {
    return json({ error: "Unknown action." }, 400);
  }

  if (action === "updateConfig") {
    const gate = await requireHostOrCohost(d1, request, params.eventId);
    if (gate.error) return json({ error: gate.error }, gate.status);
    const incoming = body?.config && typeof body.config === "object" ? body.config : {};
    const current = parseConfig(gate.event.config);
    const next = {
      ...current,
      visibility: normalizeVisibility(incoming.visibility ?? current.visibility),
    };
    // hostKind / vendor scope is superadmin-only — never accept from clients
    delete next.hostKind;
    delete next.vendor;
    const now = Date.now();
    await d1
      .prepare("UPDATE events SET config = ?, updated_at = ? WHERE id = ?")
      .bind(JSON.stringify(next), now, params.eventId)
      .run();
    return json({ ok: true, config: { visibility: next.visibility } });
  }

  const gate = await requireOwner(d1, request, params.eventId);
  if (gate.error) return json({ error: gate.error }, gate.status);

  if (action === "rename") {
    const name = String(body.name || "").trim();
    if (!name) return json({ error: "Name it." }, 400);
    if (name.length > 80) return json({ error: "That name is too long." }, 400);
    if (gate.event.deleted_at) return json({ error: "This event is removed." }, 409);
    const now = Date.now();
    await d1.prepare("UPDATE events SET name = ?, updated_at = ? WHERE id = ?").bind(name, now, params.eventId).run();
    const state = await loadState(d1, gate.event.code);
    if (state) {
      state.event = { ...(state.event || {}), name };
      await d1
        .prepare("UPDATE weddings_v2 SET version = version + 1, payload = ? WHERE code = ?")
        .bind(JSON.stringify(state), gate.event.code)
        .run();
    }
    return json({ ok: true, name });
  }

  if (!gate.event.deleted_at) return json({ error: "This event is still here." }, 409);
  if (Date.now() - gate.event.deleted_at > KEEP_MS) {
    return json({ error: "The day to restore this event has passed." }, 410);
  }

  const now = Date.now();
  await d1.prepare("UPDATE events SET deleted_at = NULL, updated_at = ? WHERE id = ?").bind(now, params.eventId).run();
  return json({ ok: true });
}
