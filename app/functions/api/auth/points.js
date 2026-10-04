/**
 * GET /api/auth/points — lifetime Buzz meter + recent earn ledger
 */
import {
  json,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../_auth.js";

const EARN_TABLE = [
  { action: "publish_event", label: "Publish an event", points: 100 },
  { action: "send_invite", label: "Send an invite", points: 5 },
  { action: "enable_play", label: "Open Buzz play", points: 20 },
  { action: "claim_join", label: "Join with a claim code", points: 25 },
  { action: "trivia_correct", label: "Correct trivia answer", points: 15 },
  { action: "trivia_try", label: "Trivia attempt", points: 5 },
  { action: "task_done", label: "Mark a helper task done", points: 10 },
  { action: "upgrade_pro", label: "Go Pro on an event", points: 10 },
];

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);

  const row = await d1
    .prepare(
      "SELECT COALESCE(buzz_points, 0) as buzz_points, COALESCE(is_provisional, 0) as is_provisional FROM users WHERE id = ?",
    )
    .bind(user.id)
    .first();

  const ledger = await d1
    .prepare(
      `SELECT action, points, event_id, created_at
       FROM buzz_points_ledger
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 40`,
    )
    .bind(user.id)
    .all();

  return json({
    buzzPoints: row?.buzz_points || 0,
    provisional: Boolean(row?.is_provisional),
    earnTable: EARN_TABLE,
    recent: (ledger?.results || []).map((entry) => ({
      action: entry.action,
      points: entry.points,
      eventId: entry.event_id,
      at: entry.created_at,
    })),
  });
}
