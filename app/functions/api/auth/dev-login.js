/**
 * POST /api/auth/dev-login
 *
 * DEV ONLY — bypasses Google OAuth for local testing.
 * Disabled when GOOGLE_CLIENT_ID is set (i.e., production).
 *
 * Body: { email: "test@example.com", name: "Test User" }
 */
import { json, devLogin, sessionCookie, ensureAuthSchema } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  // Block in production: if Google credentials exist, dev login is off.
  if (env.GOOGLE_CLIENT_ID) {
    return json({ error: "Dev login is disabled in production." }, 403);
  }

  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  await ensureAuthSchema(d1);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return json({ error: "Valid email required." }, 400);
  }

  const { user, token } = await devLogin(d1, email, body.name);

  return json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        isNew: user.isNew,
      },
      message: "Dev session created. Cookie set.",
    },
    200,
    { "Set-Cookie": sessionCookie(token) },
  );
}
