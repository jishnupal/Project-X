/**
 * GET /api/auth/callback
 *
 * Google redirects here after consent.
 * Exchanges code → tokens → userinfo → upsert user → create session → set cookie → redirect.
 */
import {
  json,
  exchangeGoogleCode,
  fetchGoogleUser,
  upsertUser,
  createAuthSession,
  sessionCookie,
  contactsTokenCookie,
  ensureAuthSchema,
  safeReturnPath,
  safeLoginHint,
  parseCookie,
  validateSession,
  mergeProvisionalIntoGoogle,
} from "../_auth.js";

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return json({ error: "Google OAuth is not configured." }, 503);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  let returnTo = "/dashboard";
  let mode = "sso";
  let hint = "";
  let auto = false;
  let purpose = "";
  let mergeFrom = "";
  try {
    const state = JSON.parse(atob(stateRaw || ""));
    returnTo = safeReturnPath(state.returnTo, "/dashboard");
    mode = state.mode === "open" ? "open" : state.mode === "pick" ? "pick" : "sso";
    hint = safeLoginHint(state.hint);
    auto = state.auto === true;
    purpose = state.purpose === "contacts" ? "contacts" : state.purpose === "link" ? "link" : "";
    mergeFrom = typeof state.mergeFrom === "string" ? state.mergeFrom : "";
  } catch {
    /* ignore bad state */
  }

  if (purpose === "contacts") {
    const back = safeReturnPath(returnTo, "/people/contacts");
    if (error || !code) {
      return Response.redirect(new URL(back, url.origin).toString(), 302);
    }
    try {
      const tokens = await exchangeGoogleCode(env, code);
      if (!tokens.access_token) {
        return json({ error: "Failed to get access token from Google." }, 502);
      }
      const gUser = await fetchGoogleUser(tokens.access_token);
      const sessionUser = await validateSession(d1, parseCookie(request));
      const sameAccount =
        sessionUser?.email &&
        gUser.email &&
        sessionUser.email.toLowerCase() === String(gUser.email).toLowerCase();
      const dest = new URL(back, url.origin);
      if (!sameAccount) {
        dest.searchParams.set("google", "other");
        return Response.redirect(dest.toString(), 302);
      }
      dest.searchParams.set("google", "1");
      const headers = new Headers({ Location: dest.toString() });
      headers.append("Set-Cookie", contactsTokenCookie(tokens.access_token));
      return new Response(null, { status: 302, headers });
    } catch (err) {
      console.error("Contacts consent error:", err);
      return new Response(loginErrorPage("Google did not share contacts. Try again from the Contacts page."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  if (mode === "pick" && error) {
    const home = new URL("/login", url.origin);
    home.searchParams.set("stay", "1");
    home.searchParams.set("pick", "1");
    return Response.redirect(home.toString(), 302);
  }

  // A quiet return could not finish. Come back to our door instead of an email form.
  if (
    mode !== "open" &&
    (error === "login_required" || error === "interaction_required" || error === "consent_required")
  ) {
    if (auto && hint) {
      const next = new URL("/api/auth/login", url.origin);
      next.searchParams.set("return", returnTo);
      next.searchParams.set("mode", "open");
      next.searchParams.set("hint", hint);
      return Response.redirect(next.toString(), 302);
    }
    if (auto) {
      const home = new URL("/login", url.origin);
      home.searchParams.set("stay", "1");
      return Response.redirect(home.toString(), 302);
    }
    const next = new URL("/api/auth/login", url.origin);
    next.searchParams.set("return", returnTo);
    next.searchParams.set("mode", "open");
    if (hint) next.searchParams.set("hint", hint);
    return Response.redirect(next.toString(), 302);
  }

  if (error) {
    return new Response(loginErrorPage("Google sign-in was cancelled. Stay in this browser and try again."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!code) {
    return json({ error: "Missing authorization code." }, 400);
  }

  // Parse state for returnTo — default to dashboard (not login page)
  // already parsed above
  try {
    await ensureAuthSchema(d1);

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(env, code);
    if (!tokens.access_token) {
      return json({ error: "Failed to get access token from Google." }, 502);
    }

    // Fetch user profile
    const gUser = await fetchGoogleUser(tokens.access_token);
    if (!gUser.email) {
      return json({ error: "Could not read email from Google profile." }, 502);
    }

    // Upsert into our users table
    const user = await upsertUser(d1, {
      email: gUser.email,
      name: gUser.name || gUser.email.split("@")[0],
      avatarUrl: gUser.picture || null,
      googleSub: gUser.sub,
    });

    if (purpose === "link" && mergeFrom && mergeFrom !== user.id) {
      await mergeProvisionalIntoGoogle(d1, mergeFrom, user.id);
    } else {
      const sessionUser = await validateSession(d1, parseCookie(request));
      if (sessionUser?.id && sessionUser.id !== user.id) {
        const prov = await d1
          .prepare("SELECT is_provisional FROM users WHERE id = ?")
          .bind(sessionUser.id)
          .first();
        if (prov?.is_provisional) {
          await mergeProvisionalIntoGoogle(d1, sessionUser.id, user.id);
        }
      }
    }

    // Create session
    const deviceId = url.searchParams.get("device") || null;
    const sessionToken = await createAuthSession(d1, user.id, deviceId);

    // Redirect to app with session cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: returnTo,
        "Set-Cookie": sessionCookie(sessionToken),
      },
    });
  } catch (err) {
    console.error("Auth callback error:", err);
    return new Response(loginErrorPage(signInErrorMessage(err)), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function signInErrorMessage(err) {
  const text = String(err?.message || "");
  if (text.includes("invalid_grant")) {
    return "That sign-in expired. Tap Try again and finish it in this same window. Opening the email on another phone starts a new sign-in.";
  }
  if (text.includes("redirect_uri_mismatch")) {
    return "Google could not return to BiyeFlow. Try again from this page.";
  }
  return "Something went wrong during sign-in. Please try again.";
}

function loginErrorPage(message) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign In Error</title>
<style>
  body { font-family: Manrope, system-ui, sans-serif; display: flex; align-items: center;
         justify-content: center; min-height: 100vh; margin: 0; background: #faf6f0; color: #1a100c; }
  .card { background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center;
          box-shadow: 0 2px 12px rgba(26,16,12,0.08); }
  h1 { font-size: 20px; margin: 0 0 12px; }
  p { font-size: 14px; color: #7a6f62; margin: 0 0 20px; }
  a { display: inline-block; padding: 10px 24px; background: #1a100c; color: white; border-radius: 10px;
      text-decoration: none; font-weight: 700; font-size: 14px; }
</style></head>
<body><div class="card">
  <h1>Sign-in Error</h1>
  <p>${message}</p>
  <a href="/api/auth/login">Try Again</a>
</div></body></html>`;
}
