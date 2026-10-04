/**
 * Shared auth utilities for BiyeFlow Pages Functions.
 *
 * - Google OAuth 2.0 helpers
 * - D1 session management (HttpOnly cookie)
 * - Schema bootstrap (CREATE TABLE IF NOT EXISTS)
 * - Middleware: requireUser, requirePlatformAdmin
 */

// ─── Constants ─────────────────────────────────────────────
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year — Google sign-in is once-in-a-lifetime
const COOKIE_NAME = "bf_session";

// ─── JSON response helper ──────────────────────────────────
/** App paths only. Blocks open redirects after Google sign-in. */
export function safeReturnPath(value, fallback = "/dashboard") {
  const path = String(value || "");
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://") ||
    /[\u0000-\u001f]/.test(path)
  ) {
    return fallback;
  }
  return path;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

// ─── ID generators ─────────────────────────────────────────
export function newId(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Crypto helpers ────────────────────────────────────────
async function sha256(text) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  const arr = new Uint8Array(digest);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Schema bootstrap ──────────────────────────────────────
let _schemaReady = false;

export async function ensureAuthSchema(d1) {
  if (_schemaReady) return;

  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      google_sub TEXT UNIQUE,
      platform_role TEXT NOT NULL DEFAULT 'customer',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      device_id TEXT,
      device_label TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'My Event',
      event_type TEXT NOT NULL DEFAULT 'wedding',
      config TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL DEFAULT 'guest',
      module_grants TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      blocked_by TEXT,
      blocked_at INTEGER,
      invited_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(event_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_devices (
      id TEXT PRIMARY KEY NOT NULL,
      device_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      label TEXT,
      platform TEXT DEFAULT 'web',
      last_seen INTEGER NOT NULL,
      revoked_at INTEGER,
      revoked_by TEXT,
      push_endpoint TEXT,
      push_p256dh TEXT,
      push_auth TEXT,
      UNIQUE(device_id, user_id, event_id)
    )`,
    `CREATE TABLE IF NOT EXISTS event_invites (
      token TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      invited_by TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      accepted_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS contact_invites (
      token TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      guest_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      invited_by TEXT NOT NULL,
      accepted_by TEXT,
      accepted_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS buzz_play (
      event_id TEXT PRIMARY KEY NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      pack_json TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS buzz_scores (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      UNIQUE(event_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS buzz_points_ledger (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT,
      action TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS claim_attempts (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL
    )`,
  ];

  for (const sql of stmts) {
    await d1.prepare(sql).run();
  }
  for (const sql of [
    "ALTER TABLE users ADD COLUMN passcode_hash TEXT",
    "ALTER TABLE users ADD COLUMN passcode_salt TEXT",
    "ALTER TABLE users ADD COLUMN buzz_points INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN is_provisional INTEGER DEFAULT 0",
    "ALTER TABLE events ADD COLUMN deleted_at INTEGER",
    "ALTER TABLE events ADD COLUMN plan_tier TEXT DEFAULT 'free'",
    "ALTER TABLE memberships ADD COLUMN display_name TEXT",
    "ALTER TABLE memberships ADD COLUMN guest_id TEXT",
    "ALTER TABLE contact_invites ADD COLUMN claim_code TEXT",
    "ALTER TABLE contact_invites ADD COLUMN status TEXT DEFAULT 'open'",
    "ALTER TABLE contact_invites ADD COLUMN claimed_device_id TEXT",
    "ALTER TABLE contact_invites ADD COLUMN expires_at INTEGER",
  ]) {
    try {
      await d1.prepare(sql).run();
    } catch {
      /* column already exists */
    }
  }
  try {
    await d1
      .prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_invites_claim_open ON contact_invites(claim_code) WHERE claim_code IS NOT NULL AND status = 'open'",
      )
      .run();
  } catch {
    /* sqlite may not support partial indexes the same way — ignore */
  }
  _schemaReady = true;
}

/** Short human claim code (no ambiguous I/O/0/1). */
export function mintClaimCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function awardBuzzPoints(d1, userId, action, points, eventId = null) {
  if (!userId || !points) return;
  const now = Date.now();
  await d1
    .prepare(
      "INSERT INTO buzz_points_ledger (id, user_id, event_id, action, points, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(newId("bp"), userId, eventId, action, points, now)
    .run();
  await d1
    .prepare("UPDATE users SET buzz_points = COALESCE(buzz_points, 0) + ?, updated_at = ? WHERE id = ?")
    .bind(points, now, userId)
    .run();
}

export async function mergeProvisionalIntoGoogle(d1, provisionalUserId, googleUserId) {
  if (!provisionalUserId || !googleUserId || provisionalUserId === googleUserId) return;
  const now = Date.now();
  const memberships = await d1
    .prepare("SELECT id, event_id FROM memberships WHERE user_id = ?")
    .bind(provisionalUserId)
    .all();
  for (const row of memberships?.results || []) {
    const clash = await d1
      .prepare("SELECT id FROM memberships WHERE event_id = ? AND user_id = ?")
      .bind(row.event_id, googleUserId)
      .first();
    if (clash) {
      await d1.prepare("DELETE FROM memberships WHERE id = ?").bind(row.id).run();
    } else {
      await d1
        .prepare("UPDATE memberships SET user_id = ?, updated_at = ? WHERE id = ?")
        .bind(googleUserId, now, row.id)
        .run();
    }
  }
  await d1
    .prepare("UPDATE contact_invites SET accepted_by = ? WHERE accepted_by = ?")
    .bind(googleUserId, provisionalUserId)
    .run();
  await d1
    .prepare("UPDATE buzz_scores SET user_id = ? WHERE user_id = ?")
    .bind(googleUserId, provisionalUserId)
    .run();
  await d1
    .prepare("UPDATE user_devices SET user_id = ? WHERE user_id = ?")
    .bind(googleUserId, provisionalUserId)
    .run();
  await d1
    .prepare("UPDATE auth_sessions SET user_id = ? WHERE user_id = ?")
    .bind(googleUserId, provisionalUserId)
    .run();
  const prov = await d1
    .prepare("SELECT COALESCE(buzz_points, 0) as buzz_points FROM users WHERE id = ?")
    .bind(provisionalUserId)
    .first();
  if (prov?.buzz_points) {
    await d1
      .prepare("UPDATE users SET buzz_points = COALESCE(buzz_points, 0) + ?, updated_at = ? WHERE id = ?")
      .bind(prov.buzz_points, now, googleUserId)
      .run();
  }
  await d1.prepare("DELETE FROM users WHERE id = ? AND is_provisional = 1").bind(provisionalUserId).run();
}

function bytesToB64(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary);
}

function b64ToBytes(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function normalizePasscode(pin) {
  const digits = String(pin || "").replace(/\D/g, "");
  return digits.length === 4 ? digits : null;
}

export async function hashPasscode(pin, saltB64) {
  const enc = new TextEncoder();
  const salt = saltB64 ? b64ToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return { hash: bytesToB64(bits), salt: bytesToB64(salt) };
}

export async function verifyPasscode(pin, passcodeHash, passcodeSalt) {
  if (!passcodeHash || !passcodeSalt) return false;
  const next = await hashPasscode(pin, passcodeSalt);
  return next.hash === passcodeHash;
}

/** Signed-in host or co-host. A guest or buddy cannot rewrite the event. */
export async function requireEventWriter(d1, request, code) {
  const access = await resolveEventAccess(d1, request, code);
  if (access.error) return { ok: false, error: access.error, status: access.status };
  if (access.place !== "host" && access.place !== "cohost") {
    return { ok: false, error: "You can't change this event.", status: 403 };
  }
  return { ok: true, user: access.user, role: access.membership.role, place: access.place };
}

/** The signed-in account's place on one event. */
export async function resolveEventAccess(d1, request, code) {
  await ensureAuthSchema(d1);
  const token = parseCookie(request);
  const user = token ? await validateSession(d1, token) : null;
  if (!user) return { error: "Sign in required.", status: 401 };

  const event = await d1
    .prepare("SELECT id, code, name, owner_id FROM events WHERE code = ?")
    .bind(code)
    .first();
  if (!event) return { error: "You don't have access to this event.", status: 403 };

  const membership = await d1
    .prepare(
      "SELECT id, role, status, display_name, guest_id FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'",
    )
    .bind(event.id, user.id)
    .first();
  if (!membership) return { error: "You don't have access to this event.", status: 403 };

  let place = "guest";
  if (event.owner_id === user.id) place = "host";
  else if (membership.role === "admin") place = "cohost";
  else if (membership.role === "buddy") place = "buddy";

  return { user, event, membership, place };
}

// ─── Google OAuth 2.0 ──────────────────────────────────────
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const CONTACTS_COOKIE = "bf_gcontacts";
export const GOOGLE_CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts.readonly";

export function safeLoginHint(value) {
  if (typeof value !== "string") return "";
  const hint = value.trim().toLowerCase();
  if (!hint || hint.length > 254) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hint)) return "";
  return hint;
}

export function googleAuthUrl(env, stateToken, { prompt, loginHint } = {}) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI || `${env.APP_URL || ""}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: stateToken,
  });
  // prompt=none continues the Google session already in this browser.
  // A blank email form is not requested. login_hint keeps a known host on that account.
  if (prompt) params.set("prompt", prompt);
  if (loginHint) params.set("login_hint", loginHint);
  return `${GOOGLE_AUTH_URL}?${params}`;
}

/** Extra consent so the signed-in account can pick its own Google contacts. Login itself stays email-only. */
export function googleContactsAuthUrl(env, stateToken, loginHint) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI || `${env.APP_URL || ""}/api/auth/callback`,
    response_type: "code",
    scope: `openid email profile ${GOOGLE_CONTACTS_SCOPE}`,
    include_granted_scopes: "true",
    access_type: "online",
    prompt: "consent",
    state: stateToken,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeGoogleCode(env, code) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI || `${env.APP_URL || ""}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function fetchGoogleUser(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  return res.json();
}

// ─── User CRUD ─────────────────────────────────────────────
export async function upsertUser(d1, { email, name, avatarUrl, googleSub }) {
  await ensureAuthSchema(d1);
  const now = Date.now();

  const existing = await d1
    .prepare("SELECT id, platform_role FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (existing) {
    await d1
      .prepare("UPDATE users SET name = ?, avatar_url = ?, google_sub = ?, updated_at = ? WHERE id = ?")
      .bind(name, avatarUrl || null, googleSub || null, now, existing.id)
      .run();
    return { id: existing.id, email, name, avatarUrl, platformRole: existing.platform_role, isNew: false };
  }

  const id = newId("u");
  await d1
    .prepare(
      "INSERT INTO users (id, email, name, avatar_url, google_sub, platform_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'customer', ?, ?)"
    )
    .bind(id, email, name, avatarUrl || null, googleSub || null, now, now)
    .run();
  return { id, email, name, avatarUrl, platformRole: "customer", isNew: true };
}

export async function getUserById(d1, userId) {
  await ensureAuthSchema(d1);
  const row = await d1
    .prepare("SELECT id, email, name, avatar_url, google_sub, platform_role, created_at, updated_at FROM users WHERE id = ?")
    .bind(userId)
    .first();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    googleSub: row.google_sub,
    platformRole: row.platform_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Session management ────────────────────────────────────
export async function createAuthSession(d1, userId, deviceId, deviceLabel) {
  await ensureAuthSchema(d1);
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = Date.now();

  await d1
    .prepare(
      "INSERT INTO auth_sessions (token_hash, user_id, device_id, device_label, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(tokenHash, userId, deviceId || null, deviceLabel || null, now + SESSION_TTL_MS, now)
    .run();

  return token;
}

export async function validateSession(d1, token) {
  if (!token) return null;
  await ensureAuthSchema(d1);
  const tokenHash = await sha256(token);
  const row = await d1
    .prepare("SELECT user_id, expires_at FROM auth_sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .first();
  if (!row || row.expires_at <= Date.now()) return null;
  return getUserById(d1, row.user_id);
}

export async function deleteSession(d1, token) {
  if (!token) return;
  const tokenHash = await sha256(token);
  await d1.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function deleteAllUserSessions(d1, userId) {
  await d1.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(userId).run();
}

// ─── Cookie helpers ────────────────────────────────────────
export function sessionCookie(token, maxAgeSec = 365 * 24 * 3600) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function parseCookie(request) {
  return readCookie(request, COOKIE_NAME);
}

export function contactsTokenCookie(token) {
  return `${CONTACTS_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`;
}

export function clearContactsTokenCookie() {
  return `${CONTACTS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function parseContactsToken(request) {
  const raw = readCookie(request, CONTACTS_COOKIE);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] || null;
}

// ─── Membership helpers ────────────────────────────────────
const REMOVED_KEEP_MS = 24 * 60 * 60 * 1000;

export function eventStateIsEmpty(state) {
  if (!state || typeof state !== "object") return true;
  const event = state.event || {};
  if (event.scheduleConfirmed) return false;
  if (Array.isArray(state.guests) && state.guests.length > 0) return false;
  if (Array.isArray(state.menu) && state.menu.length > 0) return false;
  if (Array.isArray(state.functions) && state.functions.length > 0) return false;
  if (Array.isArray(state.rooms) && state.rooms.length > 0) return false;
  if (Array.isArray(state.tasks) && state.tasks.length > 0) return false;
  return true;
}

async function eventIsEmpty(d1, code) {
  try {
    const row = await d1.prepare("SELECT payload FROM weddings_v2 WHERE code = ?").bind(code).first();
    if (!row?.payload) return true;
    return eventStateIsEmpty(JSON.parse(row.payload));
  } catch {
    return true;
  }
}

function mapMembership(row, extra = {}) {
  return {
    id: row.id,
    eventId: row.event_id,
    eventCode: row.code,
    eventName: row.event_name,
    eventType: row.event_type,
    role: row.role,
    moduleGrants: row.module_grants ? JSON.parse(row.module_grants) : {},
    status: row.status,
    ...extra,
  };
}

export async function getUserMemberships(d1, userId) {
  await ensureAuthSchema(d1);
  const rows = await d1
    .prepare(
      `SELECT m.id, m.event_id, m.role, m.module_grants, m.status,
              e.code, e.name as event_name, e.event_type, e.owner_id
       FROM memberships m
       JOIN events e ON e.id = m.event_id
       WHERE m.user_id = ? AND m.status = 'active'
         AND (e.deleted_at IS NULL OR e.deleted_at = 0)
       ORDER BY m.created_at DESC`
    )
    .bind(userId)
    .all();
  const list = [];
  for (const row of rows?.results || []) {
    list.push(mapMembership(row, { empty: await eventIsEmpty(d1, row.code), owner: row.owner_id === userId }));
  }
  return list;
}

export async function getRemovedMemberships(d1, userId) {
  await ensureAuthSchema(d1);
  const now = Date.now();
  const cutoff = now - REMOVED_KEEP_MS;
  const expired = await d1
    .prepare(
      `SELECT e.id, e.code FROM events e
       JOIN memberships m ON m.event_id = e.id
       WHERE m.user_id = ? AND e.deleted_at IS NOT NULL AND e.deleted_at > 0 AND e.deleted_at <= ?`
    )
    .bind(userId, cutoff)
    .all();
  for (const row of expired?.results || []) {
    try {
      await d1.prepare("DELETE FROM weddings_v2 WHERE code = ?").bind(row.code).run();
    } catch {
      /* legacy table may be missing */
    }
    await d1.prepare("DELETE FROM memberships WHERE event_id = ?").bind(row.id).run();
    await d1.prepare("DELETE FROM events WHERE id = ?").bind(row.id).run();
  }

  const rows = await d1
    .prepare(
      `SELECT m.id, m.event_id, m.role, m.module_grants, m.status,
              e.code, e.name as event_name, e.event_type, e.deleted_at
       FROM memberships m
       JOIN events e ON e.id = m.event_id
       WHERE m.user_id = ? AND m.status = 'active' AND e.deleted_at > ?
       ORDER BY e.deleted_at DESC`
    )
    .bind(userId, cutoff)
    .all();
  return (rows?.results || []).map((row) =>
    mapMembership(row, {
      deletedAt: row.deleted_at,
      restoreUntil: row.deleted_at + REMOVED_KEEP_MS,
    }),
  );
}

// ─── Middleware: extract current user from cookie ──────────
export async function getRequestUser(request, env) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return null;
  const token = parseCookie(request);
  if (!token) return null;
  return validateSession(d1, token);
}

// ─── Dev login (local development only) ────────────────────
export async function devLogin(d1, email, name) {
  const user = await upsertUser(d1, {
    email,
    name: name || email.split("@")[0],
    avatarUrl: null,
    googleSub: `dev_${email}`,
  });
  const token = await createAuthSession(d1, user.id);
  return { user, token };
}
