const CODE_PATTERN = /^[A-Z0-9]{8}$/;
const MAX_BYTES = 900000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function store(env) {
  return env.BIYEFLOW_SYNC ?? null;
}

export async function onRequestGet({ params, env, request }) {
  const kv = store(env);
  if (!kv) {
    return json(
      {
        error:
          "Cloud sync is not configured. Bind the BIYEFLOW_SYNC KV namespace and redeploy.",
      },
      503,
    );
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);

  const url = new URL(request.url);
  if (url.searchParams.get("rev") === "1") {
    let rev = await kv.get(`${code}:rev`);
    if (!rev) {
      const raw = await kv.get(code);
      if (!raw) return json({ error: "Wedding not found." }, 404);
      try {
        rev = String(JSON.parse(raw).updatedAt || 0);
        if (rev !== "0") await kv.put(`${code}:rev`, rev);
      } catch {
        return json({ error: "Wedding not found." }, 404);
      }
    }
    return json({ updatedAt: Number(rev) || 0 });
  }

  const raw = await kv.get(code);
  if (!raw) return json({ error: "Wedding not found." }, 404);

  return new Response(raw, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPut({ params, env, request }) {
  const kv = store(env);
  if (!kv) {
    return json(
      {
        error:
          "Cloud sync is not configured. Bind the BIYEFLOW_SYNC KV namespace and redeploy.",
      },
      503,
    );
  }

  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: "Wedding data is too large to sync." }, 413);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid wedding payload." }, 400);
  }

  if (!payload?.state || typeof payload.updatedAt !== "number") {
    return json({ error: "Wedding payload is missing state." }, 400);
  }

  const envelope = {
    version: 1,
    updatedAt: payload.updatedAt,
    state: payload.state,
  };

  await kv.put(code, JSON.stringify(envelope));
  await kv.put(`${code}:rev`, String(envelope.updatedAt));
  return json({ ok: true, updatedAt: envelope.updatedAt });
}
