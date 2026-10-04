/**
 * POST /api/events/plan
 * Body: { code, planTier: "free"|"pro" }
 * Host upgrades / sets plan for one event (Pro SKU).
 */
import { json, ensureAuthSchema, resolveEventAccess, awardBuzzPoints } from "../_auth.js";

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
  const planTier = body.planTier === "pro" ? "pro" : "free";
  if (!code) return json({ error: "Missing event." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return json({ error: access.error }, access.status);
  if (access.place !== "host") return json({ error: "Only the host can change the plan." }, 403);

  await d1
    .prepare("UPDATE events SET plan_tier = ?, updated_at = ? WHERE id = ?")
    .bind(planTier, Date.now(), access.event.id)
    .run();

  if (planTier === "pro") {
    await awardBuzzPoints(d1, access.user.id, "upgrade_pro", 10, access.event.id);
  }

  return json({ ok: true, planTier });
}
