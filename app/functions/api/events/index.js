/**
 * /api/events
 *
 * GET  — list events for the logged-in user
 * POST — create a new event (logged-in users only)
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  getUserMemberships,
  ensureAuthSchema,
  awardBuzzPoints,
} from "../_auth.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

// ─── GET: list my events ───────────────────────────────────
export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return json({ error: "Sign in required." }, 401);

  const memberships = await getUserMemberships(d1, user.id);
  return json({ events: memberships });
}

// ─── POST: create event ────────────────────────────────────
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

  const name = String(body.name || "").trim() || "My Event";
  const eventType = String(body.eventType || "wedding").trim();
  const validTypes = ["wedding", "birthday", "conference", "party", "engagement", "reception", "other"];
  const type = validTypes.includes(eventType) ? eventType : "wedding";

  const now = Date.now();
  const eventId = newId("evt");
  const code = generateCode();

  const owned = await d1
    .prepare(
      `SELECT COUNT(*) as n FROM events
       WHERE owner_id = ? AND (deleted_at IS NULL OR deleted_at = 0)`,
    )
    .bind(user.id)
    .first();
  const ownedCount = owned?.n || 0;
  // Free: 1 active event. Pro owners can create more (plan_tier on each event).
  const proOwned = await d1
    .prepare(
      `SELECT COUNT(*) as n FROM events
       WHERE owner_id = ? AND plan_tier = 'pro' AND (deleted_at IS NULL OR deleted_at = 0)`,
    )
    .bind(user.id)
    .first();
  const isProHost = (proOwned?.n || 0) > 0 || body.planTier === "pro";
  if (!isProHost && ownedCount >= 1) {
    return json(
      { error: "Free plan allows 1 active event. Upgrade to Pro for more." },
      402,
    );
  }
  const planTier = body.planTier === "pro" ? "pro" : "free";

  // Create event
  await d1
    .prepare(
      "INSERT INTO events (id, code, owner_id, name, event_type, config, created_at, updated_at, plan_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(eventId, code, user.id, name, type, JSON.stringify({}), now, now, planTier)
    .run();

  // Auto-create admin membership for owner
  const membershipId = newId("m");
  await d1
    .prepare(
      "INSERT INTO memberships (id, event_id, user_id, role, module_grants, status, created_at, updated_at) VALUES (?, ?, ?, 'admin', ?, 'active', ?, ?)"
    )
    .bind(membershipId, eventId, user.id, JSON.stringify({}), now, now)
    .run();

  await awardBuzzPoints(d1, user.id, "publish_event", 100, eventId);

  // Also create a legacy wedding_access + weddings_v2 row so the existing app works
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS weddings_v2 (
          code TEXT PRIMARY KEY NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          payload TEXT NOT NULL
        )`
      )
      .run();
    const emptyState = JSON.stringify({
    event: { name, city: "", startDate: "", guests: "", scheduleConfirmed: false },
    functions: [],
    tasks: [],
    research: [],
    reminders: [],
    guests: [],
    guestGroups: [],
    menu: [],
    rooms: [],
    grandMealByDay: {},
    buzz: {
      welcomeTitle: "",
      welcomeMessage: "",
      invitationNote: "",
      venueName: "",
      venueAddress: "",
      venueMapUrl: "",
    },
    modules: { stay: false, menu: false, asked: false },
  });
    await d1
      .prepare("INSERT OR IGNORE INTO weddings_v2 (code, version, payload) VALUES (?, 1, ?)")
      .bind(code, emptyState)
      .run();
  } catch {
    /* legacy table creation is best-effort */
  }

  return json({
    event: {
      id: eventId,
      code,
      name,
      eventType: type,
      role: "admin",
    },
    message: `Event created. Share code ${code} with your guests.`,
  }, 201);
}
