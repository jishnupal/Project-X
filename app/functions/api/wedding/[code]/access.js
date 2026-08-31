const DEVICE_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PIN_MAX_ATTEMPTS = 8;
const PIN_LOCK_MS = 5 * 60 * 1000;
const CODE_PATTERN = /^[A-Z0-9]{8}$/;
const AVATARS = new Set([
  "lotus",
  "marigold",
  "peacock",
  "diya",
  "swan",
  "conch",
  "rangoli",
  "bell",
]);
const DEFAULT_MODULES = ["buzz", "guests", "menu", "rooms", "access"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function db(env) {
  return env.BIYEFLOW_DB ?? null;
}

let schemaReady = false;

async function ensureSchema(d1) {
  if (schemaReady) return;
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS wedding_access (
        code TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    )
    .run();
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS wedding_invites (
        token TEXT PRIMARY KEY NOT NULL,
        wedding_code TEXT NOT NULL,
        kind TEXT NOT NULL
      )`,
    )
    .run();
  schemaReady = true;
}

function emptyAccess() {
  return {
    profiles: [],
    devices: [],
    revokedDeviceIds: [],
    adminProfileId: null,
    sessions: [],
    pinAttempts: {},
    enabledModules: [...DEFAULT_MODULES],
    guestInviteToken: null,
    buddyInviteToken: null,
    provisioned: false,
  };
}

async function readAccess(d1, code) {
  await ensureSchema(d1);
  const row = await d1
    .prepare("SELECT payload FROM wedding_access WHERE code = ?")
    .bind(code)
    .first();
  if (!row?.payload) return emptyAccess();
  try {
    const parsed = JSON.parse(row.payload);
    return {
      ...emptyAccess(),
      ...parsed,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
      revokedDeviceIds: Array.isArray(parsed.revokedDeviceIds) ? parsed.revokedDeviceIds : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      pinAttempts: parsed.pinAttempts && typeof parsed.pinAttempts === "object" ? parsed.pinAttempts : {},
      enabledModules: Array.isArray(parsed.enabledModules) ? parsed.enabledModules : DEFAULT_MODULES,
    };
  } catch {
    return emptyAccess();
  }
}

async function writeAccess(d1, code, access) {
  await ensureSchema(d1);
  const cleaned = pruneAccess(access);
  await d1
    .prepare(
      `INSERT INTO wedding_access (code, payload, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    )
    .bind(code, JSON.stringify(cleaned), Date.now())
    .run();
  return cleaned;
}

async function registerInvite(d1, token, weddingCode, kind) {
  await ensureSchema(d1);
  await d1
    .prepare(
      `INSERT INTO wedding_invites (token, wedding_code, kind) VALUES (?, ?, ?)
       ON CONFLICT(token) DO UPDATE SET wedding_code = excluded.wedding_code, kind = excluded.kind`,
    )
    .bind(token, weddingCode, kind)
    .run();
}

async function resolveInviteToken(d1, token) {
  await ensureSchema(d1);
  const row = await d1
    .prepare("SELECT wedding_code, kind FROM wedding_invites WHERE token = ?")
    .bind(token)
    .first();
  return row || null;
}

function pruneAccess(access) {
  const cutoff = Date.now() - DEVICE_TTL_MS;
  const sessionsCutoff = Date.now();
  return {
    ...access,
    devices: (access.devices || []).filter((d) => d.lastSeenAt >= cutoff),
    sessions: (access.sessions || []).filter((s) => s.expiresAt > sessionsCutoff),
  };
}

function normalizeRole(role) {
  if (role === "super_admin" || role === "admin" || role === "buddy" || role === "guest") return role;
  if (role === "member") return "buddy";
  if (role === "viewer") return "guest";
  return "guest";
}

function publicSnapshot(access, { includeTokens = false } = {}) {
  const cutoff = Date.now() - DEVICE_TTL_MS;
  const snap = {
    adminProfileId: access.adminProfileId || null,
    provisioned: Boolean(access.provisioned),
    enabledModules: access.enabledModules || DEFAULT_MODULES,
    guestInviteToken: includeTokens ? access.guestInviteToken || null : null,
    buddyInviteToken: includeTokens ? access.buddyInviteToken || null : null,
    profiles: (access.profiles || []).map((p) => publicProfile(p)),
    devices: (access.devices || [])
      .filter((d) => d.lastSeenAt >= cutoff)
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label,
        profileId: d.profileId,
        lastSeenAt: d.lastSeenAt,
      })),
  };
  return snap;
}

function newId(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function newInviteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePin(pin) {
  const digits = String(pin || "").replace(/\D/g, "");
  return digits.length === 4 ? digits : null;
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

async function hashPin(pin, saltB64) {
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

async function verifyPin(pin, pinHash, pinSalt) {
  if (!pinHash || !pinSalt) return false;
  const next = await hashPin(pin, pinSalt);
  return next.hash === pinHash;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return bytesToB64(digest);
}

function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function requirePrivileged(access, request) {
  const token = bearerToken(request);
  if (!token) return { ok: false, error: "Session required.", status: 401 };
  const tokenHash = await hashToken(token);
  const session = (access.sessions || []).find(
    (s) => s.tokenHash === tokenHash && s.expiresAt > Date.now(),
  );
  if (!session) return { ok: false, error: "Session expired. Sign in again.", status: 401 };
  const profile = (access.profiles || []).find((p) => p.id === session.profileId);
  if (!profile) return { ok: false, error: "Profile not found.", status: 404 };
  const role = normalizeRole(profile.role);
  if (role !== "admin" && role !== "super_admin") {
    return { ok: false, error: "Admin only.", status: 403 };
  }
  return { ok: true, profile, session };
}

function upsertDevice(access, deviceId, label, profileId) {
  const profile = (access.profiles || []).find((p) => p.id === profileId);
  const role = normalizeRole(profile?.role);
  if (role === "guest") {
    return { access };
  }
  if ((access.revokedDeviceIds || []).includes(deviceId)) {
    return { access, error: "This device was removed. Join again." };
  }
  const now = Date.now();
  const devices = (access.devices || []).filter((d) => d.deviceId !== deviceId);
  devices.push({ deviceId, label: label || "Device", profileId, lastSeenAt: now });
  return { access: { ...access, devices } };
}

function publicProfile(p) {
  return {
    id: p.id,
    name: p.name,
    role: normalizeRole(p.role),
    avatarId: p.avatarId,
    moduleGrants: p.moduleGrants && typeof p.moduleGrants === "object" ? p.moduleGrants : {},
    hasPin: Boolean(p.pinHash),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function defaultBuddyGrants() {
  return { buzz: "edit" };
}

function provisionSecretOk(env, secret) {
  const expected = env.BIYEFLOW_PROVISION_SECRET || "biyeflow-super-admin-dev";
  return String(secret || "") === expected;
}

async function ensureInviteTokens(d1, code, access) {
  let next = { ...access };
  if (!next.guestInviteToken) {
    next.guestInviteToken = newInviteToken();
    await registerInvite(d1, next.guestInviteToken, code, "guest");
  }
  if (!next.buddyInviteToken) {
    next.buddyInviteToken = newInviteToken();
    await registerInvite(d1, next.buddyInviteToken, code, "buddy");
  }
  return next;
}

async function createSession(access, profileId, deviceId) {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const sessions = [
    ...(access.sessions || []).filter((s) => s.profileId !== profileId || s.deviceId !== deviceId),
    {
      tokenHash,
      profileId,
      deviceId,
      expiresAt: Date.now() + SESSION_TTL_MS,
    },
  ];
  return { access: { ...access, sessions }, token };
}

function clearPinAttemptsForProfile(pinAttempts, profileId) {
  const next = { ...(pinAttempts || {}) };
  const suffix = `:${profileId}`;
  for (const key of Object.keys(next)) {
    if (key.endsWith(suffix)) delete next[key];
  }
  return next;
}

async function verifyPinWithLock(access, code, d1, deviceId, profileId, pin, profile) {
  const attemptKey = `${deviceId}:${profileId}`;
  const attempts = access.pinAttempts?.[attemptKey] || { count: 0, lockedUntil: 0 };
  const locked = attempts.lockedUntil > Date.now();
  const ok = await verifyPin(pin, profile.pinHash, profile.pinSalt);

  // Correct PIN always unlocks — even during lockout (so typos don't brick a valid PIN).
  if (ok) {
    access.pinAttempts = clearPinAttemptsForProfile(access.pinAttempts, profileId);
    return { ok: true, access };
  }

  if (locked) {
    return { ok: false, error: "Too many tries. Try again in a few minutes.", status: 429 };
  }

  const count = (attempts.count || 0) + 1;
  const lockedUntil = count >= PIN_MAX_ATTEMPTS ? Date.now() + PIN_LOCK_MS : 0;
  access.pinAttempts = {
    ...access.pinAttempts,
    [attemptKey]: { count: lockedUntil ? 0 : count, lockedUntil },
  };
  await writeAccess(d1, code, access);
  if (lockedUntil) {
    return { ok: false, error: "Too many tries. Try again in a few minutes.", status: 429 };
  }
  return { ok: false, error: "Incorrect PIN.", status: 401 };
}

export async function onRequestGet({ params, env }) {
  const d1 = db(env);
  if (!d1) return json({ error: "Cloud sync is not configured." }, 503);
  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);
  const access = await readAccess(d1, code);
  return json(publicSnapshot(access));
}

export async function onRequestPost({ params, env, request }) {
  const d1 = db(env);
  if (!d1) return json({ error: "Cloud sync is not configured." }, 503);
  const code = String(params.code || "").toUpperCase();
  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid wedding code." }, 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const action = String(body.action || "");
  let access = await readAccess(d1, code);

  if (action === "provisionWedding") {
    if (!provisionSecretOk(env, body.provisionSecret)) {
      return json({ error: "Invalid provision secret." }, 403);
    }
    if (access.profiles.some((p) => normalizeRole(p.role) === "admin")) {
      return json({ error: "Wedding already has an Admin." }, 409);
    }
    const enabledModules = Array.isArray(body.enabledModules)
      ? body.enabledModules.filter((m) => DEFAULT_MODULES.includes(m))
      : DEFAULT_MODULES;
    access = {
      ...emptyAccess(),
      ...access,
      enabledModules: enabledModules.length ? enabledModules : DEFAULT_MODULES,
      provisioned: true,
    };
    access = await ensureInviteTokens(d1, code, access);
    access = await writeAccess(d1, code, access);
    return json({ snapshot: publicSnapshot(access, { includeTokens: true }) });
  }

  if (action === "bootstrapAdmin" || action === "createWeddingAsAdmin") {
    const existingAdmin = access.profiles.find((p) => normalizeRole(p.role) === "admin");
    if (existingAdmin) {
      return json({ error: "This wedding already has an Admin. Sign in instead." }, 409);
    }
    const pin = normalizePin(body.pin);
    if (!pin) return json({ error: "Choose a 4-digit PIN." }, 400);
    const name = String(body.name || "").trim() || "Admin";
    const avatarId = AVATARS.has(body.avatarId) ? body.avatarId : "lotus";
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "Missing device." }, 400);
    const hashed = await hashPin(pin);
    const now = Date.now();
    const profile = {
      id: newId("p"),
      name,
      role: "admin",
      avatarId,
      moduleGrants: {},
      pinHash: hashed.hash,
      pinSalt: hashed.salt,
      createdAt: now,
      updatedAt: now,
    };
    access = {
      ...access,
      profiles: [...access.profiles.filter((p) => normalizeRole(p.role) !== "admin"), profile],
      adminProfileId: profile.id,
      provisioned: true,
    };
    access = await ensureInviteTokens(d1, code, access);
    const deviceResult = upsertDevice(access, deviceId, body.deviceLabel, profile.id);
    if (deviceResult.error) return json({ error: deviceResult.error }, 403);
    access = deviceResult.access;
    const sessionResult = await createSession(access, profile.id, deviceId);
    access = sessionResult.access;
    access = await writeAccess(d1, code, access);
    return json({
      profile: publicProfile(profile),
      adminToken: sessionResult.token,
      snapshot: publicSnapshot(access, { includeTokens: true }),
    });
  }

  if (action === "joinAsGuest") {
    const token = String(body.inviteToken || "");
    // Invite link (token) OR open join with wedding code (anyone who knows the code).
    if (token) {
      if (token !== access.guestInviteToken) {
        return json({ error: "Invalid guest invite link." }, 403);
      }
    } else {
      const hasAdmin = (access.profiles || []).some((p) => normalizeRole(p.role) === "admin");
      if (!hasAdmin && !access.provisioned) {
        return json({ error: "This wedding is not ready for guests yet." }, 400);
      }
    }
    const name = String(body.name || "").trim() || "Guest";
    const avatarId = AVATARS.has(body.avatarId) ? body.avatarId : "marigold";
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "Missing device." }, 400);
    const now = Date.now();
    const profile = {
      id: newId("p"),
      name,
      role: "guest",
      avatarId,
      moduleGrants: {},
      pinHash: "",
      pinSalt: "",
      createdAt: now,
      updatedAt: now,
    };
    access = {
      ...access,
      profiles: [...access.profiles, profile],
    };
    access = await writeAccess(d1, code, access);
    return json({ profile: publicProfile(profile), snapshot: publicSnapshot(access) });
  }

  if (action === "joinAsBuddy") {
    const token = String(body.inviteToken || "");
    if (!token || token !== access.buddyInviteToken) {
      return json({ error: "Invalid buddy invite link." }, 403);
    }
    const pin = normalizePin(body.pin);
    if (!pin) return json({ error: "Choose a 4-digit PIN." }, 400);
    const name = String(body.name || "").trim() || "Buddy";
    const avatarId = AVATARS.has(body.avatarId) ? body.avatarId : "peacock";
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "Missing device." }, 400);
    const hashed = await hashPin(pin);
    const now = Date.now();
    const profile = {
      id: newId("p"),
      name,
      role: "buddy",
      avatarId,
      moduleGrants: defaultBuddyGrants(),
      pinHash: hashed.hash,
      pinSalt: hashed.salt,
      createdAt: now,
      updatedAt: now,
    };
    access = {
      ...access,
      profiles: [...access.profiles, profile],
    };
    const deviceResult = upsertDevice(access, deviceId, body.deviceLabel, profile.id);
    if (deviceResult.error) return json({ error: deviceResult.error }, 403);
    access = deviceResult.access;
    const sessionResult = await createSession(access, profile.id, deviceId);
    access = sessionResult.access;
    access = await writeAccess(d1, code, access);
    return json({
      profile: publicProfile(profile),
      adminToken: sessionResult.token,
      snapshot: publicSnapshot(access),
    });
  }

  if (action === "selectProfile") {
    const profileId = String(body.profileId || "");
    const deviceId = String(body.deviceId || "").trim();
    const profile = access.profiles.find((p) => p.id === profileId);
    if (!profile) return json({ error: "Profile not found." }, 404);
    if (!deviceId) return json({ error: "Missing device." }, 400);
    const role = normalizeRole(profile.role);

    let adminToken = "";
    if (role === "guest") {
      /* Guests rejoin without PIN */
    } else {
      const pin = normalizePin(body.pin);
      if (!pin) return json({ error: "Enter your 4-digit PIN." }, 400);
      const verified = await verifyPinWithLock(access, code, d1, deviceId, profileId, pin, profile);
      if (!verified.ok) return json({ error: verified.error }, verified.status);
      access = verified.access;
      const sessionResult = await createSession(access, profileId, deviceId);
      access = sessionResult.access;
      adminToken = sessionResult.token;
    }

    const deviceResult = upsertDevice(access, deviceId, body.deviceLabel, profileId);
    if (deviceResult.error) return json({ error: deviceResult.error }, 403);
    access = deviceResult.access;
    access = await writeAccess(d1, code, access);
    return json({
      profile: publicProfile(profile),
      adminToken,
      snapshot: publicSnapshot(access),
    });
  }

  if (action === "restoreSession") {
    const profileId = String(body.profileId || "");
    const deviceId = String(body.deviceId || "").trim();
    const profile = access.profiles.find((p) => p.id === profileId);
    if (!profile || !deviceId) return json({ error: "Invalid session restore." }, 400);
    return json({
      profile: publicProfile(profile),
      snapshot: publicSnapshot(access),
    });
  }

  if (action === "heartbeat") {
    const deviceId = String(body.deviceId || "").trim();
    const profileId = String(body.profileId || "").trim();
    if (!deviceId || !profileId) return json({ error: "Missing device or profile." }, 400);
    const profile = access.profiles.find((p) => p.id === profileId);
    if (!profile || normalizeRole(profile.role) === "guest") {
      return json({ snapshot: publicSnapshot(access) });
    }
    const deviceResult = upsertDevice(access, deviceId, body.deviceLabel, profileId);
    if (deviceResult.error) return json({ error: deviceResult.error }, 403);
    access = await writeAccess(d1, code, deviceResult.access);
    return json({ snapshot: publicSnapshot(access) });
  }

  if (action === "updateBuddyGrants") {
    const gate = await requirePrivileged(access, request);
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    const profileId = String(body.profileId || "");
    const buddy = access.profiles.find((p) => p.id === profileId);
    if (!buddy || normalizeRole(buddy.role) !== "buddy") {
      return json({ error: "Buddy profile not found." }, 404);
    }
    const grants = body.moduleGrants && typeof body.moduleGrants === "object" ? body.moduleGrants : {};
    access.profiles = access.profiles.map((p) =>
      p.id === profileId
        ? {
            ...p,
            moduleGrants: { ...defaultBuddyGrants(), ...grants },
            updatedAt: Date.now(),
          }
        : p,
    );
    access = await writeAccess(d1, code, access);
    return json({ snapshot: publicSnapshot(access) });
  }

  if (action === "getInviteLinks") {
    const gate = await requirePrivileged(access, request);
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    access = await ensureInviteTokens(d1, code, access);
    access = await writeAccess(d1, code, access);
    return json({
      guestInviteToken: access.guestInviteToken,
      buddyInviteToken: access.buddyInviteToken,
      snapshot: publicSnapshot(access, { includeTokens: true }),
    });
  }

  if (action === "setPin") {
    const gate = await requirePrivileged(access, request);
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    const pin = normalizePin(body.pin);
    if (!pin) return json({ error: "PIN must be 4 digits." }, 400);
    const hashed = await hashPin(pin);
    access.profiles = access.profiles.map((p) =>
      p.id === gate.profile.id
        ? { ...p, pinHash: hashed.hash, pinSalt: hashed.salt, updatedAt: Date.now() }
        : p,
    );
    access.pinAttempts = clearPinAttemptsForProfile(access.pinAttempts, gate.profile.id);
    access = await writeAccess(d1, code, access);
    return json({ ok: true, snapshot: publicSnapshot(access) });
  }

  // Wedding code is the recovery key: anyone who can join the wedding can set a new Admin PIN.
  if (action === "resetAdminPin") {
    const admin = access.profiles.find((p) => normalizeRole(p.role) === "admin");
    if (!admin) return json({ error: "No Admin profile on this wedding." }, 404);
    const pin = normalizePin(body.pin);
    if (!pin) return json({ error: "Choose a new 4-digit PIN." }, 400);
    const confirmPin = normalizePin(body.confirmPin);
    if (!confirmPin || confirmPin !== pin) {
      return json({ error: "PINs do not match." }, 400);
    }
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "Missing device." }, 400);
    const hashed = await hashPin(pin);
    access.profiles = access.profiles.map((p) =>
      p.id === admin.id
        ? { ...p, pinHash: hashed.hash, pinSalt: hashed.salt, updatedAt: Date.now() }
        : p,
    );
    access.pinAttempts = clearPinAttemptsForProfile(access.pinAttempts, admin.id);
    const deviceResult = upsertDevice(access, deviceId, body.deviceLabel, admin.id);
    if (deviceResult.error) return json({ error: deviceResult.error }, 403);
    access = deviceResult.access;
    const sessionResult = await createSession(access, admin.id, deviceId);
    access = sessionResult.access;
    access = await writeAccess(d1, code, access);
    return json({
      profile: publicProfile(admin),
      adminToken: sessionResult.token,
      snapshot: publicSnapshot(access, { includeTokens: true }),
    });
  }

  if (action === "revokeDevice") {
    const gate = await requirePrivileged(access, request);
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return json({ error: "Missing device." }, 400);
    if (deviceId === gate.session.deviceId) {
      return json({ error: "You cannot remove this device while using it." }, 400);
    }
    access = {
      ...access,
      devices: access.devices.filter((d) => d.deviceId !== deviceId),
      revokedDeviceIds: Array.from(new Set([...(access.revokedDeviceIds || []), deviceId])),
      sessions: (access.sessions || []).filter((s) => s.deviceId !== deviceId),
    };
    access = await writeAccess(d1, code, access);
    return json({ snapshot: publicSnapshot(access) });
  }

  if (action === "updateProfile") {
    const profileId = String(body.profileId || "");
    const deviceId = String(body.deviceId || "").trim();
    const profile = access.profiles.find((p) => p.id === profileId);
    if (!profile) return json({ error: "Profile not found." }, 404);
    const name = body.name != null ? String(body.name).trim() : profile.name;
    const avatarId = AVATARS.has(body.avatarId) ? body.avatarId : profile.avatarId;
    access.profiles = access.profiles.map((p) =>
      p.id === profileId
        ? { ...p, name: name || p.name, avatarId, updatedAt: Date.now() }
        : p,
    );
    if (deviceId && normalizeRole(profile.role) !== "guest") {
      const deviceResult = upsertDevice(access, deviceId, body.deviceLabel || "Device", profileId);
      if (deviceResult.error) return json({ error: deviceResult.error }, 403);
      access = deviceResult.access;
    }
    access = await writeAccess(d1, code, access);
    return json({ snapshot: publicSnapshot(access) });
  }

  return json({ error: "Unknown action." }, 400);
}
