import { json as authJson, resolveEventAccess } from "../_auth.js";
import { authorizeHelperSession } from "./[code]/access.js";

const CODE_PATTERN = /^[A-Z0-9]{8}$/;
const MAX_BYTES = 900000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function db(env) {
  return env.BIYEFLOW_DB ?? null;
}

function kv(env) {
  return env.BIYEFLOW_SYNC ?? null;
}

let schemaReady = false;

async function ensureSchema(d1) {
  if (schemaReady) return;
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS weddings_v2 (
        code TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        payload TEXT NOT NULL
      )`,
    )
    .run();
  schemaReady = true;
}

function extractState(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed) return null;
    if (parsed.state) return parsed.state;
    if (parsed.guests || parsed.event) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function migrateFromLegacy(d1, env, code) {
  let state = null;

  try {
    const old = await d1
      .prepare("SELECT payload FROM weddings WHERE code = ?")
      .bind(code)
      .first();
    if (old?.payload) {
      state = extractState(old.payload);
    }
  } catch {
    /* old table may not exist */
  }

  if (!state) {
    const kvStore = kv(env);
    if (kvStore) {
      try {
        const raw = await kvStore.get(code);
        if (raw) {
          state = extractState(raw);
        }
      } catch {
        /* ignore KV failures */
      }
    }
  }

  if (!state) return null;

  try {
    await d1
      .prepare(
        "INSERT OR IGNORE INTO weddings_v2 (code, version, payload) VALUES (?, 1, ?)",
      )
      .bind(code, JSON.stringify(state))
      .run();
    const row = await d1
      .prepare("SELECT version, payload FROM weddings_v2 WHERE code = ?")
      .bind(code)
      .first();
    if (!row) return null;
    return { version: row.version, state: JSON.parse(row.payload) };
  } catch {
    return { version: 1, state };
  }
}

async function readWedding(d1, env, code) {
  await ensureSchema(d1);
  const row = await d1
    .prepare("SELECT version, payload FROM weddings_v2 WHERE code = ?")
    .bind(code)
    .first();
  if (!row?.payload) {
    return migrateFromLegacy(d1, env, code);
  }
  try {
    return { version: row.version, state: JSON.parse(row.payload) };
  } catch {
    return null;
  }
}

function guestCount(state) {
  return Array.isArray(state?.guests) ? state.guests.length : 0;
}

/** Keep the saved wedding. A helper may only flip done on tasks that already exist. */
function applyHelperTaskDone(current, incoming) {
  const currentTasks = Array.isArray(current?.tasks) ? current.tasks : [];
  const incomingTasks = Array.isArray(incoming?.tasks) ? incoming.tasks : [];
  const doneById = new Map(
    incomingTasks
      .filter((task) => task && typeof task.id === "string")
      .map((task) => [task.id, Boolean(task.done)]),
  );
  const tasks = currentTasks.map((task) => {
    if (!task || !doneById.has(task.id) || Boolean(task.done) === doneById.get(task.id)) {
      return task;
    }
    return { ...task, done: doneById.get(task.id), updatedAt: Date.now() };
  });
  return { ...current, tasks };
}


function buzzOf(state) {
  const buzz = state?.buzz && typeof state.buzz === "object" ? state.buzz : {};
  return {
    welcomeTitle: String(buzz.welcomeTitle || ""),
    welcomeMessage: String(buzz.welcomeMessage || ""),
    invitationNote: String(buzz.invitationNote || ""),
    venueName: String(buzz.venueName || ""),
    venueAddress: String(buzz.venueAddress || ""),
    venueMapUrl: String(buzz.venueMapUrl || ""),
  };
}

function tasksForGuest(state, guestId) {
  if (!guestId) return [];
  return (Array.isArray(state?.tasks) ? state.tasks : [])
    .filter((task) => task && task.guestId === guestId)
    .map((task) => ({
      id: task.id,
      title: task.title,
      guestId: task.guestId,
      done: Boolean(task.done),
      createdAt: task.createdAt || 0,
      updatedAt: task.updatedAt || 0,
    }));
}

function viewFor(state, access) {
  if (access.place === "host" || access.place === "cohost") {
    return { state, viewerName: "" };
  }
  const eventName = state?.event?.name || access.event?.name || "";
  return {
    viewerName: String(access.membership?.display_name || access.user?.name || ""),
    state: {
      event: { name: eventName, city: "", startDate: "", guests: "", scheduleConfirmed: false },
      functions: [],
      tasks: access.place === "buddy" ? tasksForGuest(state, access.membership.guest_id) : [],
      research: [],
      reminders: [],
      guests: [],
      guestGroups: [],
      menu: [],
      rooms: [],
      theme: {},
      grandMealByDay: {},
      buzz: buzzOf(state),
      modules: { stay: false, menu: false, asked: false },
    },
  };
}

function conflictView(state, access) {
  if (!access?.error && access?.place) return viewFor(state, access);
  return viewFor(state, {
    place: "guest",
    membership: { display_name: "" },
    user: { name: "" },
    event: { name: state?.event?.name || "" },
  });
}

/** A buddy may only flip done on tasks assigned to them. */
function applyBuddyTaskDone(current, incoming, guestId) {
  if (!guestId) return current;
  const incomingTasks = Array.isArray(incoming?.tasks) ? incoming.tasks : [];
  const doneById = new Map(
    incomingTasks
      .filter((task) => task && typeof task.id === "string")
      .map((task) => [task.id, Boolean(task.done)]),
  );
  const tasks = (Array.isArray(current?.tasks) ? current.tasks : []).map((task) => {
    if (!task || task.guestId !== guestId || !doneById.has(task.id)) return task;
    if (Boolean(task.done) === doneById.get(task.id)) return task;
    return { ...task, done: doneById.get(task.id), updatedAt: Date.now() };
  });
  return { ...current, tasks };
}

export async function onRequestGet({ params, env, request }) {
  const d1 = db(env);
  if (!d1) {
    return json({ error: "Cloud sync is not configured. Bind BIYEFLOW_DB (D1) and redeploy." }, 503);
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return authJson({ error: access.error }, access.status);

  const wedding = await readWedding(d1, env, code);
  if (!wedding) return json({ error: "Event not found." }, 404);

  const view = viewFor(wedding.state, access);
  return json({
    version: wedding.version,
    state: view.state,
    viewerName: view.viewerName,
    guestCount: access.place === "host" || access.place === "cohost" ? guestCount(wedding.state) : 0,
  });
}

export async function onRequestPut({ params, env, request }) {
  const d1 = db(env);
  if (!d1) {
    return json({ error: "Cloud sync is not configured. Bind BIYEFLOW_DB (D1) and redeploy." }, 503);
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  let writeMode = "";
  if (!access.error && (access.place === "host" || access.place === "cohost")) writeMode = "full";
  else if (!access.error && access.place === "buddy") writeMode = "buddy";
  else {
    const helper = await authorizeHelperSession(d1, code, request);
    if (!helper) return authJson({ error: access.error || "You can't change this event." }, access.status || 403);
    writeMode = "helper";
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: "Event data is too large to sync." }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid event payload." }, 400);
  }

  if (!body?.state) {
    return json({ error: "Event payload is missing state." }, 400);
  }

  if (writeMode === "helper") {
    const current = await readWedding(d1, env, code);
    if (!current) return json({ error: "Event not found." }, 404);
    body.state = applyHelperTaskDone(current.state, body.state);
  }
  if (writeMode === "buddy") {
    const current = await readWedding(d1, env, code);
    if (!current) return json({ error: "Event not found." }, 404);
    body.state = applyBuddyTaskDone(current.state, body.state, access.membership.guest_id);
  }

  const baseVersion = Number(body.baseVersion);
  if (!Number.isFinite(baseVersion) || baseVersion < 0) {
    return json({ error: "Event payload is missing baseVersion." }, 400);
  }

  await ensureSchema(d1);
  const payload = JSON.stringify(body.state);

  if (baseVersion === 0) {
    try {
      await d1
        .prepare("INSERT INTO weddings_v2 (code, version, payload) VALUES (?, 1, ?)")
        .bind(code, payload)
        .run();
      return json({ ok: true, version: 1, guestCount: guestCount(body.state) });
    } catch {
      const existing = await readWedding(d1, env, code);
      if (existing) {
        const view = conflictView(existing.state, access);
        return json({
          ok: false,
          conflict: true,
          version: existing.version,
          state: view.state,
          viewerName: view.viewerName,
          guestCount: guestCount(view.state),
        }, 409);
      }
      return json({ error: "Could not create event." }, 500);
    }
  }

  const result = await d1
    .prepare(
      "UPDATE weddings_v2 SET version = version + 1, payload = ? WHERE code = ? AND version = ?",
    )
    .bind(payload, code, baseVersion)
    .run();

  if ((result?.meta?.changes || 0) === 1) {
    return json({
      ok: true,
      version: baseVersion + 1,
      guestCount: guestCount(body.state),
    });
  }

  const existing = await readWedding(d1, env, code);
  if (!existing) {
    return json({ error: "Event not found." }, 404);
  }

  const view = conflictView(existing.state, access);
  return json({
    ok: false,
    conflict: true,
    version: existing.version,
    state: view.state,
    viewerName: view.viewerName,
    guestCount: access.place === "host" || access.place === "cohost" ? guestCount(existing.state) : 0,
  }, 409);
}
