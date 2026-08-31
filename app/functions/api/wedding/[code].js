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

export async function onRequestGet({ params, env }) {
  const d1 = db(env);
  if (!d1) {
    return json({ error: "Cloud sync is not configured. Bind BIYEFLOW_DB (D1) and redeploy." }, 503);
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);

  const wedding = await readWedding(d1, env, code);
  if (!wedding) return json({ error: "Wedding not found." }, 404);

  return json({
    version: wedding.version,
    state: wedding.state,
    guestCount: guestCount(wedding.state),
  });
}

export async function onRequestPut({ params, env, request }) {
  const d1 = db(env);
  if (!d1) {
    return json({ error: "Cloud sync is not configured. Bind BIYEFLOW_DB (D1) and redeploy." }, 503);
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: "Wedding data is too large to sync." }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid wedding payload." }, 400);
  }

  if (!body?.state) {
    return json({ error: "Wedding payload is missing state." }, 400);
  }

  const baseVersion = Number(body.baseVersion);
  if (!Number.isFinite(baseVersion) || baseVersion < 0) {
    return json({ error: "Wedding payload is missing baseVersion." }, 400);
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
        return json({
          ok: false,
          conflict: true,
          version: existing.version,
          state: existing.state,
          guestCount: guestCount(existing.state),
        }, 409);
      }
      return json({ error: "Could not create wedding." }, 500);
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
    return json({ error: "Wedding not found." }, 404);
  }

  return json({
    ok: false,
    conflict: true,
    version: existing.version,
    state: existing.state,
    guestCount: guestCount(existing.state),
  }, 409);
}
