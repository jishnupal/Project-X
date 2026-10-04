/**
 * GET  /api/buzz/play?code=EVENT
 * POST /api/buzz/play  { code, action: "enable"|"answer"|"leaderboard", ... }
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  resolveEventAccess,
  awardBuzzPoints,
} from "../_auth.js";

const DEFAULT_PACK = [
  {
    id: "q1",
    prompt: "Where did their story begin?",
    options: ["A college cafe", "A family celebration", "A rainy auto ride", "Nobody remembers"],
    correct: 0,
  },
  {
    id: "q2",
    prompt: "What should guests wear?",
    options: ["Festive colours", "All white", "Denim only", "Whatever feels like you"],
    correct: 0,
  },
  {
    id: "q3",
    prompt: "The week ends with…",
    options: ["Dinner & dancing", "A quiet brunch", "A road trip", "Surprise"],
    correct: 0,
  },
];

const PLAY_CAP = 50;

async function loadPack(d1, eventId) {
  const play = await d1
    .prepare("SELECT enabled, pack_json FROM buzz_play WHERE event_id = ?")
    .bind(eventId)
    .first();
  let pack = DEFAULT_PACK;
  try {
    if (play?.pack_json) {
      const parsed = JSON.parse(play.pack_json);
      if (Array.isArray(parsed) && parsed.length) pack = parsed;
    }
  } catch {
    /* default */
  }
  return { enabled: play ? Boolean(play.enabled) : false, pack };
}

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const code = String(new URL(request.url).searchParams.get("code") || "")
    .trim()
    .toUpperCase();
  if (!code) return json({ error: "Missing event." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return json({ error: access.error }, access.status);

  const { enabled, pack } = await loadPack(d1, access.event.id);
  const score = await d1
    .prepare("SELECT points, answers_json FROM buzz_scores WHERE event_id = ? AND user_id = ?")
    .bind(access.event.id, access.user.id)
    .first();

  const canEdit = access.place === "host" || access.place === "cohost";
  const publicPack = pack.map(({ id, prompt, options }) => ({ id, prompt, options }));

  const board = await d1
    .prepare(
      `SELECT s.points, COALESCE(m.display_name, u.name) as name
       FROM buzz_scores s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN memberships m ON m.user_id = s.user_id AND m.event_id = s.event_id
       WHERE s.event_id = ?
       ORDER BY s.points DESC
       LIMIT 20`,
    )
    .bind(access.event.id)
    .all();

  return json({
    enabled,
    canEdit,
    questions: enabled || canEdit ? publicPack : [],
    myPoints: score?.points || 0,
    answers: score?.answers_json ? JSON.parse(score.answers_json) : {},
    leaderboard: (board?.results || []).map((row) => ({
      name: row.name || "Guest",
      points: row.points || 0,
    })),
  });
}

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const code = String(body.code || "").trim().toUpperCase();
  const action = String(body.action || "");
  if (!code) return json({ error: "Missing event." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return json({ error: access.error }, access.status);
  const now = Date.now();

  if (action === "enable") {
    if (access.place !== "host" && access.place !== "cohost") {
      return json({ error: "Only hosts can enable play." }, 403);
    }
    const enabled = body.enabled === false ? 0 : 1;
    const packJson = JSON.stringify(DEFAULT_PACK);
    await d1
      .prepare(
        `INSERT INTO buzz_play (event_id, enabled, pack_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(event_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`,
      )
      .bind(access.event.id, enabled, packJson, now)
      .run();
    if (enabled) await awardBuzzPoints(d1, access.user.id, "enable_play", 20, access.event.id);
    return json({ ok: true, enabled: Boolean(enabled) });
  }

  if (action === "set_pack") {
    if (access.place !== "host" && access.place !== "cohost") {
      return json({ error: "Only hosts can edit the pack." }, 403);
    }
    const plan = await d1
      .prepare("SELECT plan_tier FROM events WHERE id = ?")
      .bind(access.event.id)
      .first();
    if (plan?.plan_tier !== "pro") {
      return json(
        { error: "Custom trivia packs are a Pro feature. Free events use the short default pack." },
        402,
      );
    }
    const incoming = Array.isArray(body.pack) ? body.pack : [];
    if (!incoming.length || incoming.length > 20) {
      return json({ error: "Pack must have 1–20 questions." }, 400);
    }
    const pack = incoming.map((q, i) => ({
      id: String(q.id || `q${i + 1}`),
      prompt: String(q.prompt || "").trim() || `Question ${i + 1}`,
      options: Array.isArray(q.options) ? q.options.map(String).slice(0, 6) : [],
      correct: Number(q.correct) || 0,
    }));
    if (pack.some((q) => q.options.length < 2)) {
      return json({ error: "Each question needs at least 2 options." }, 400);
    }
    const enabledRow = await d1
      .prepare("SELECT enabled FROM buzz_play WHERE event_id = ?")
      .bind(access.event.id)
      .first();
    await d1
      .prepare(
        `INSERT INTO buzz_play (event_id, enabled, pack_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(event_id) DO UPDATE SET pack_json = excluded.pack_json, updated_at = excluded.updated_at`,
      )
      .bind(access.event.id, enabledRow?.enabled ? 1 : 0, JSON.stringify(pack), now)
      .run();
    return json({ ok: true, questions: pack.length });
  }

  if (action === "answer") {
    const { enabled, pack } = await loadPack(d1, access.event.id);
    if (!enabled) return json({ error: "Play is not open yet." }, 403);
    const questionId = String(body.questionId || "");
    const choice = Number(body.choice);
    const question = pack.find((q) => q.id === questionId);
    if (!question) return json({ error: "Unknown question." }, 400);

    let row = await d1
      .prepare("SELECT points, answers_json FROM buzz_scores WHERE event_id = ? AND user_id = ?")
      .bind(access.event.id, access.user.id)
      .first();
    const answers = row?.answers_json ? JSON.parse(row.answers_json) : {};
    if (answers[questionId] != null) {
      return json({ error: "Already answered.", myPoints: row.points || 0 }, 409);
    }
    if ((row?.points || 0) >= PLAY_CAP) {
      return json({ error: "Play points capped for this event.", myPoints: row.points }, 400);
    }

    const correct = Number(question.correct) === choice;
    const gain = correct ? 15 : 5;
    answers[questionId] = { choice, correct };
    const nextPoints = Math.min(PLAY_CAP, (row?.points || 0) + gain);

    if (row) {
      await d1
        .prepare(
          "UPDATE buzz_scores SET points = ?, answers_json = ?, updated_at = ? WHERE event_id = ? AND user_id = ?",
        )
        .bind(nextPoints, JSON.stringify(answers), now, access.event.id, access.user.id)
        .run();
    } else {
      await d1
        .prepare(
          `INSERT INTO buzz_scores (id, event_id, user_id, points, answers_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(newId("bs"), access.event.id, access.user.id, nextPoints, JSON.stringify(answers), now)
        .run();
    }
    await awardBuzzPoints(d1, access.user.id, correct ? "trivia_correct" : "trivia_try", gain, access.event.id);
    return json({ ok: true, correct, gain, myPoints: nextPoints });
  }

  return json({ error: "Unknown action." }, 400);
}
