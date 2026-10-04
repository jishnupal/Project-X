/**
 * GET /api/auth/login
 *
 * Redirects to Google OAuth consent screen.
 * Query params:
 *   ?return=/some-path   — where to send user after login (default: /)
 */
import { googleAuthUrl, googleContactsAuthUrl, json, safeLoginHint, safeReturnPath } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) {
    return json({ error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID." }, 503);
  }

  const url = new URL(request.url);
  const returnTo = safeReturnPath(url.searchParams.get("return"), "/");
  const hint = safeLoginHint(url.searchParams.get("hint"));
  const auto = url.searchParams.get("auto") === "1";
  // mode=open is the second hop after a person taps. It does not ask for an email.
  const open = url.searchParams.get("mode") === "open";
  // pick=1 is sign-out's next step: Google's account chooser, not the last host.
  const pick = url.searchParams.get("pick") === "1";
  const contacts = url.searchParams.get("contacts") === "1";

  if (contacts) {
    const state = btoa(JSON.stringify({
      purpose: "contacts",
      returnTo: safeReturnPath(returnTo, "/people/contacts"),
      hint,
      ts: Date.now(),
    }));
    return Response.redirect(googleContactsAuthUrl(env, state, hint || undefined), 302);
  }

  const state = btoa(JSON.stringify({
    returnTo,
    mode: pick ? "pick" : open ? "open" : "sso",
    hint,
    auto: auto && !open && !pick,
    ts: Date.now(),
  }));
  const authUrl = googleAuthUrl(env, state, {
    prompt: pick ? "select_account" : open ? undefined : "none",
    loginHint: hint || undefined,
  });

  return Response.redirect(authUrl, 302);
}
