/**
 * POST /api/buddies/task-done
 * Buddy marks a task complete → awards Buzz points (once per task id).
 * Body: { code, taskId }
 */
import {
  json,
  ensureAuthSchema,
  resolveEventAccess,
  awardBuzzPoints,
} from "../_auth.js";

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
  const taskId = String(body.taskId || "").trim();
  if (!code || !taskId) return json({ error: "Missing task." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return json({ error: access.error }, access.status);
  if (access.place !== "buddy" && access.place !== "host" && access.place !== "cohost") {
    return json({ error: "Only helpers can earn task points." }, 403);
  }

  const actionKey = `task_done:${taskId}`;
  const prior = await d1
    .prepare(
      "SELECT id FROM buzz_points_ledger WHERE user_id = ? AND action = ? LIMIT 1",
    )
    .bind(access.user.id, actionKey)
    .first();
  if (prior) return json({ ok: true, already: true, points: 0 });

  await awardBuzzPoints(d1, access.user.id, actionKey, 10, access.event.id);
  return json({ ok: true, points: 10 });
}
