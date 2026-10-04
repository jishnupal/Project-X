/**
 * GET /api/google/contacts
 *
 * Lists names from the signed-in Google account after that account
 * has granted contacts access. The token cookie is short-lived and HttpOnly.
 */
import {
  json,
  parseCookie,
  parseContactsToken,
  clearContactsTokenCookie,
  validateSession,
} from "../_auth.js";

const PEOPLE_URL = "https://people.googleapis.com/v1/people/me/connections";

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  const user = await validateSession(d1, parseCookie(request));
  if (!user) return json({ error: "Sign in required." }, 401);

  const token = parseContactsToken(request);
  if (!token) return json({ needAuth: true }, 401);

  const people = [];
  let pageToken = "";
  for (let page = 0; page < 5; page += 1) {
    const url = new URL(PEOPLE_URL);
    url.searchParams.set("personFields", "names");
    url.searchParams.set("pageSize", "200");
    url.searchParams.set("sortOrder", "FIRST_NAME_ASCENDING");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      return json({ needAuth: true }, 401, { "Set-Cookie": clearContactsTokenCookie() });
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = String(body?.error?.message || "");
      if (res.status === 403 && /insufficient/i.test(message)) {
        return json({ needAuth: true }, 401, { "Set-Cookie": clearContactsTokenCookie() });
      }
      if (/people api has not been used|accessNotConfigured|SERVICE_DISABLED/i.test(message)) {
        return json({ error: "Google Contacts is not turned on for this app yet." }, 503);
      }
      return json({ error: "Could not read Google contacts." }, 502);
    }

    const data = await res.json();
    for (const person of data.connections || []) {
      const name = displayName(person);
      if (!name) continue;
      people.push({ id: person.resourceName || name, name });
    }
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  people.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return json({ people });
}

function displayName(person) {
  const name = person.names?.[0];
  if (!name) return "";
  return String(name.displayName || `${name.givenName || ""} ${name.familyName || ""}`).trim();
}
