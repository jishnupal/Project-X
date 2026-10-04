/**
 * GET /api/invites/preview?token=... | ?code=CLAIM
 * Public: welcome + letter + FOMO teaser. No auth required.
 */
import { json, ensureAuthSchema } from "../_auth.js";

const DEFAULT_PACK = [
  {
    id: "q1",
    prompt: "Where did their story begin?",
    options: ["A college cafe", "A family celebration", "A rainy auto ride", "Nobody remembers"],
  },
  {
    id: "q2",
    prompt: "What should guests wear?",
    options: ["Festive colours", "All white", "Denim only", "Whatever feels like you"],
  },
  {
    id: "q3",
    prompt: "The week ends with…",
    options: ["Dinner & dancing", "A quiet brunch", "A road trip", "Surprise"],
  },
];

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const url = new URL(request.url);
  const raw = String(url.searchParams.get("token") || url.searchParams.get("code") || "")
    .trim()
    .toUpperCase();
  if (!raw) return json({ error: "Missing invite." }, 400);

  const invite = await d1
    .prepare(
      `SELECT token, event_id, guest_id, name, role, claim_code, status, accepted_by
       FROM contact_invites WHERE claim_code = ? OR token = ?`,
    )
    .bind(raw, raw.length === 6 ? raw : raw.toLowerCase() === raw ? raw : raw)
    .first();

  // Also try original case token (hex)
  const inviteRow =
    invite ||
    (await d1
      .prepare(
        `SELECT token, event_id, guest_id, name, role, claim_code, status, accepted_by
         FROM contact_invites WHERE token = ? OR claim_code = ?`,
      )
      .bind(String(url.searchParams.get("token") || url.searchParams.get("code") || "").trim(), raw)
      .first());

  if (!inviteRow) return json({ error: "Invite not found." }, 404);

  const event = await d1
    .prepare("SELECT id, code, name FROM events WHERE id = ?")
    .bind(inviteRow.event_id)
    .first();
  if (!event) return json({ error: "Event not found." }, 404);

  let buzz = {
    welcomeTitle: "",
    welcomeMessage: "",
    invitationNote: "",
    venueName: "",
  };
  let nextDay = "";
  try {
    const row = await d1.prepare("SELECT payload FROM weddings_v2 WHERE code = ?").bind(event.code).first();
    if (row?.payload) {
      const state = JSON.parse(row.payload);
      buzz = { ...buzz, ...(state.buzz || {}) };
      const fns = Array.isArray(state.functions) ? [...state.functions] : [];
      fns.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      const first = fns.find((fn) => fn?.name || fn?.date);
      if (first) {
        nextDay = first.date
          ? `${first.name || "Next day"} · ${first.date}`
          : String(first.name || "");
      }
    }
  } catch {
    /* ignore */
  }

  const play = await d1
    .prepare("SELECT enabled, pack_json FROM buzz_play WHERE event_id = ?")
    .bind(event.id)
    .first();
  let pack = DEFAULT_PACK;
  try {
    if (play?.pack_json) {
      const parsed = JSON.parse(play.pack_json);
      if (Array.isArray(parsed) && parsed.length) pack = parsed;
    }
  } catch {
    /* default */
  }

  const scores = await d1
    .prepare(
      `SELECT s.points, COALESCE(m.display_name, u.name) as name
       FROM buzz_scores s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN memberships m ON m.user_id = s.user_id AND m.event_id = s.event_id
       WHERE s.event_id = ?
       ORDER BY s.points DESC
       LIMIT 5`,
    )
    .bind(event.id)
    .all();

  const board = (scores?.results || []).map((row) => ({
    name: row.name || "Guest",
    points: row.points || 0,
  }));
  const playing = board.length;

  const firstQ = pack[0]
    ? { id: pack[0].id, prompt: pack[0].prompt, options: pack[0].options || [] }
    : null;

  return json({
    token: inviteRow.token,
    claimCode: inviteRow.claim_code || null,
    name: inviteRow.name,
    role: inviteRow.role === "buddy" ? "buddy" : "guest",
    status: inviteRow.status || (inviteRow.accepted_by ? "claimed" : "open"),
    eventName: event.name,
    eventCode: event.code,
    buzz: {
      welcomeTitle: buzz.welcomeTitle || `Welcome, ${inviteRow.name}`,
      welcomeMessage:
        buzz.welcomeMessage || "We are so glad you are here. Open your invitation below.",
      invitationNote: buzz.invitationNote || "Your presence is the greatest gift.",
      venueName: buzz.venueName || "",
    },
    nextDay,
    playEnabled: Boolean(play?.enabled ?? 1),
    teaser: {
      question: firstQ,
      board,
      playing,
    },
  });
}
