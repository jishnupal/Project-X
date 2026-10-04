/**
 * POST /api/auth/link-google
 * Merges a provisional claim session into the Google account about to sign in.
 * Body: { returnTo? } → starts Google OAuth with merge hint in state.
 * Actual merge happens in callback when bf_session is provisional.
 *
 * Also supports POST { action: "merge-ready" } after OAuth — client calls refresh.
 */
import {
  json,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  googleAuthUrl,
  safeReturnPath,
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.action === "status") {
    const row = await d1
      .prepare("SELECT is_provisional, buzz_points, email, name FROM users WHERE id = ?")
      .bind(user.id)
      .first();
    return json({
      provisional: Boolean(row?.is_provisional),
      buzzPoints: row?.buzz_points || 0,
      email: row?.email || "",
      name: row?.name || "",
    });
  }

  if (!env.GOOGLE_CLIENT_ID) {
    return json({ error: "Google OAuth is not configured." }, 503);
  }

  const returnTo = safeReturnPath(body.returnTo, "/buzz");
  const state = btoa(
    JSON.stringify({
      returnTo,
      mode: "open",
      purpose: "link",
      mergeFrom: user.id,
    }),
  );
  const url = googleAuthUrl(env, state, { prompt: "select_account" });
  return json({ url });
}
