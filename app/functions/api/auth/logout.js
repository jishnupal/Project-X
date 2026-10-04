/**
 * POST /api/auth/logout
 *
 * Kills the current session and clears the cookie.
 */
import { json, parseCookie, deleteSession, clearSessionCookie } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  const token = parseCookie(request);
  if (token) {
    await deleteSession(d1, token);
  }

  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
