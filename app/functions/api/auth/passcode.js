/**
 * POST /api/auth/passcode
 *
 * The admin passcode is the lock after Google sign-in.
 * action: "set" | "verify"
 * Body: { passcode: "1234" }
 */
import {
  json,
  parseCookie,
  validateSession,
  ensureAuthSchema,
  normalizePasscode,
  hashPasscode,
  verifyPasscode,
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return json({ error: "Sign in required." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const passcode = normalizePasscode(body.passcode);
  if (!passcode) return json({ error: "Passcode must be 4 digits." }, 400);

  const row = await d1
    .prepare("SELECT passcode_hash, passcode_salt FROM users WHERE id = ?")
    .bind(user.id)
    .first();

  const action = String(body.action || "");

  if (action === "set") {
    if (row?.passcode_hash) {
      return json({ error: "Passcode is already set." }, 409);
    }
    const hashed = await hashPasscode(passcode);
    await d1
      .prepare("UPDATE users SET passcode_hash = ?, passcode_salt = ?, updated_at = ? WHERE id = ?")
      .bind(hashed.hash, hashed.salt, Date.now(), user.id)
      .run();
    return json({ ok: true, hasPasscode: true });
  }

  if (action === "verify") {
    if (!row?.passcode_hash) {
      return json({ error: "Set a passcode first." }, 400);
    }
    const ok = await verifyPasscode(passcode, row.passcode_hash, row.passcode_salt);
    if (!ok) return json({ error: "Incorrect passcode." }, 401);
    return json({ ok: true });
  }

  return json({ error: "Unknown action." }, 400);
}
