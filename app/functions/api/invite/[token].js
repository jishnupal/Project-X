const CODE_PATTERN = /^[A-Z0-9]{8}$/;

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

export async function onRequestGet({ params, env }) {
  const d1 = db(env);
  if (!d1) return json({ error: "Cloud sync is not configured." }, 503);
  const token = String(params.token || "").trim();
  if (!token || token.length < 16) return json({ error: "Invalid invite link." }, 400);

  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS wedding_invites (
        token TEXT PRIMARY KEY NOT NULL,
        wedding_code TEXT NOT NULL,
        kind TEXT NOT NULL
      )`,
    )
    .run();

  const row = await d1
    .prepare("SELECT wedding_code, kind FROM wedding_invites WHERE token = ?")
    .bind(token)
    .first();
  if (!row) return json({ error: "Invite link not found." }, 404);

  const weddingCode = String(row.wedding_code || "").toUpperCase();
  if (!CODE_PATTERN.test(weddingCode)) return json({ error: "Invalid wedding." }, 404);

  return json({
    weddingCode,
    kind: String(row.kind || "guest"),
  });
}
