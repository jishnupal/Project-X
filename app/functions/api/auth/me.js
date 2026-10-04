/**
 * GET /api/auth/me
 *
 * Returns the current user + their event memberships.
 * No cookie / expired session → { user: null }
 */
import {
  json,
  parseCookie,
  validateSession,
  getUserMemberships,
  getRemovedMemberships,
  ensureAuthSchema,
} from "../_auth.js";

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  await ensureAuthSchema(d1);

  const token = parseCookie(request);
  if (!token) return json({ user: null });

  const user = await validateSession(d1, token);
  if (!user) return json({ user: null });

  const memberships = await getUserMemberships(d1, user.id);
  const removed = await getRemovedMemberships(d1, user.id);
  const passcodeRow = await d1
    .prepare("SELECT passcode_hash, COALESCE(buzz_points, 0) as buzz_points, COALESCE(is_provisional, 0) as is_provisional FROM users WHERE id = ?")
    .bind(user.id)
    .first();

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      platformRole: user.platformRole,
      hasPasscode: Boolean(passcodeRow?.passcode_hash),
      buzzPoints: passcodeRow?.buzz_points || 0,
      provisional: Boolean(passcodeRow?.is_provisional),
    },
    memberships,
    removed,
  });
}
