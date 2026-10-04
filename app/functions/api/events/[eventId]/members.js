/**
 * /api/events/:eventId/members
 *
 * GET  — list members (admin only)
 * POST — actions: invite, block, unblock, update-role, remove
 */
import {
  json,
  newId,
  parseCookie,
  validateSession,
  ensureAuthSchema,
} from "../../_auth.js";

async function requireEventAdmin(d1, request, eventId) {
  const token = parseCookie(request);
  const user = await validateSession(d1, token);
  if (!user) return { error: "Sign in required.", status: 401 };

  const membership = await d1
    .prepare("SELECT role, status FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'")
    .bind(eventId, user.id)
    .first();

  if (!membership || membership.role !== "admin") {
    return { error: "Admin access required.", status: 403 };
  }

  return { user, membership };
}

// ─── GET: list all members ─────────────────────────────────
export async function onRequestGet({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const eventId = params.eventId;
  const gate = await requireEventAdmin(d1, request, eventId);
  if (gate.error) return json({ error: gate.error }, gate.status);

  const rows = await d1
    .prepare(
      `SELECT m.id, m.user_id, m.role, m.module_grants, m.status, m.blocked_at, m.created_at,
              u.email, u.name, u.avatar_url
       FROM memberships m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.event_id = ?
       ORDER BY m.created_at ASC`
    )
    .bind(eventId)
    .all();

  const members = (rows?.results || []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    email: r.email,
    name: r.name,
    avatarUrl: r.avatar_url,
    role: r.role,
    moduleGrants: r.module_grants ? JSON.parse(r.module_grants) : {},
    status: r.status,
    blockedAt: r.blocked_at,
    createdAt: r.created_at,
  }));

  return json({ members });
}

// ─── POST: member actions ──────────────────────────────────
export async function onRequestPost({ params, request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);
  await ensureAuthSchema(d1);

  const eventId = params.eventId;
  const gate = await requireEventAdmin(d1, request, eventId);
  if (gate.error) return json({ error: gate.error }, gate.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const action = String(body.action || "");

  // ── Invite a user by email ───────────────────────────────
  if (action === "invite") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ error: "Valid email required." }, 400);

    const role = ["buddy", "guest"].includes(body.role) ? body.role : "guest";
    const moduleGrants = body.moduleGrants && typeof body.moduleGrants === "object" ? body.moduleGrants : {};

    // Check if user exists
    let targetUser = await d1.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    let userId = targetUser?.id || null;

    // If user doesn't exist yet, create a placeholder
    if (!userId) {
      userId = newId("u");
      const now = Date.now();
      await d1
        .prepare(
          "INSERT INTO users (id, email, name, avatar_url, google_sub, platform_role, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, 'customer', ?, ?)"
        )
        .bind(userId, email, email.split("@")[0], now, now)
        .run();
    }

    // Check if already a member
    const existing = await d1
      .prepare("SELECT id, role, status FROM memberships WHERE event_id = ? AND user_id = ?")
      .bind(eventId, userId)
      .first();

    const now = Date.now();

    if (existing?.role === "admin") {
      return json({ error: "That account is already a host." }, 409);
    }

    if (existing) {
      // Reactivate if blocked/removed
      await d1
        .prepare("UPDATE memberships SET role = ?, module_grants = ?, status = 'active', blocked_by = NULL, blocked_at = NULL, updated_at = ? WHERE id = ?")
        .bind(role, JSON.stringify(moduleGrants), now, existing.id)
        .run();
      return json({ ok: true, message: `${email} updated to ${role}.`, reactivated: existing.status !== "active" });
    }

    const membershipId = newId("m");
    await d1
      .prepare(
        "INSERT INTO memberships (id, event_id, user_id, role, module_grants, status, invited_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)"
      )
      .bind(membershipId, eventId, userId, role, JSON.stringify(moduleGrants), now, now, now)
      .run();

    return json({ ok: true, message: `${email} invited as ${role}.` }, 201);
  }

  // ── Block a member ───────────────────────────────────────
  if (action === "block") {
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId required." }, 400);
    if (userId === gate.user.id) return json({ error: "You cannot block yourself." }, 400);

    const event = await d1.prepare("SELECT owner_id FROM events WHERE id = ?").bind(eventId).first();
    if (event?.owner_id === userId) return json({ error: "The host can't be blocked." }, 403);
    const target = await d1
      .prepare("SELECT role FROM memberships WHERE event_id = ? AND user_id = ?")
      .bind(eventId, userId)
      .first();
    if (target?.role === "admin") {
      return json({ error: "Remove a co-host from Profile." }, 403);
    }

    const now = Date.now();
    const result = await d1
      .prepare("UPDATE memberships SET status = 'blocked', blocked_by = ?, blocked_at = ?, updated_at = ? WHERE event_id = ? AND user_id = ? AND status = 'active'")
      .bind(gate.user.id, now, now, eventId, userId)
      .run();

    if ((result?.meta?.changes || 0) === 0) {
      return json({ error: "Member not found or already blocked." }, 404);
    }

    // Kill their sessions for this event
    await d1
      .prepare("DELETE FROM auth_sessions WHERE user_id = ?")
      .bind(userId)
      .run();

    // Revoke their devices for this event
    await d1
      .prepare("UPDATE user_devices SET revoked_at = ?, revoked_by = ? WHERE user_id = ? AND event_id = ? AND revoked_at IS NULL")
      .bind(now, gate.user.id, userId, eventId)
      .run();

    return json({ ok: true, message: "Member blocked." });
  }

  // ── Unblock a member ─────────────────────────────────────
  if (action === "unblock") {
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId required." }, 400);

    const now = Date.now();
    const result = await d1
      .prepare("UPDATE memberships SET status = 'active', blocked_by = NULL, blocked_at = NULL, updated_at = ? WHERE event_id = ? AND user_id = ? AND status = 'blocked'")
      .bind(now, eventId, userId)
      .run();

    if ((result?.meta?.changes || 0) === 0) {
      return json({ error: "Member not found or not blocked." }, 404);
    }

    return json({ ok: true, message: "Member unblocked." });
  }

  // ── Remove a member entirely ─────────────────────────────
  if (action === "remove") {
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId required." }, 400);
    if (userId === gate.user.id) return json({ error: "You cannot remove yourself." }, 400);

    const event = await d1.prepare("SELECT owner_id FROM events WHERE id = ?").bind(eventId).first();
    if (event?.owner_id === userId) return json({ error: "The host can't be removed." }, 403);
    const target = await d1
      .prepare("SELECT role FROM memberships WHERE event_id = ? AND user_id = ?")
      .bind(eventId, userId)
      .first();
    if (target?.role === "admin") {
      return json({ error: "Remove a co-host from Profile." }, 403);
    }

    await d1
      .prepare("UPDATE memberships SET status = 'removed', updated_at = ? WHERE event_id = ? AND user_id = ?")
      .bind(Date.now(), eventId, userId)
      .run();

    await d1
      .prepare("DELETE FROM auth_sessions WHERE user_id = ?")
      .bind(userId)
      .run();

    return json({ ok: true, message: "Member removed." });
  }

  // ── Update role / grants ─────────────────────────────────
  if (action === "update-role") {
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId required." }, 400);

    const role = ["buddy", "guest"].includes(body.role) ? body.role : null;
    if (body.role === "admin") {
      return json({ error: "A co-host is invited from Profile." }, 403);
    }
    const moduleGrants = body.moduleGrants && typeof body.moduleGrants === "object" ? body.moduleGrants : null;

    if (!role && !moduleGrants) return json({ error: "Provide role or moduleGrants." }, 400);

    const event = await d1.prepare("SELECT owner_id FROM events WHERE id = ?").bind(eventId).first();
    if (event?.owner_id === userId) return json({ error: "The host can't be changed here." }, 403);
    const target = await d1
      .prepare("SELECT role FROM memberships WHERE event_id = ? AND user_id = ? AND status = 'active'")
      .bind(eventId, userId)
      .first();
    if (target?.role === "admin") {
      return json({ error: "A co-host is changed from Profile." }, 403);
    }

    const now = Date.now();
    if (role && moduleGrants) {
      await d1
        .prepare("UPDATE memberships SET role = ?, module_grants = ?, updated_at = ? WHERE event_id = ? AND user_id = ? AND status = 'active'")
        .bind(role, JSON.stringify(moduleGrants), now, eventId, userId)
        .run();
    } else if (role) {
      await d1
        .prepare("UPDATE memberships SET role = ?, updated_at = ? WHERE event_id = ? AND user_id = ? AND status = 'active'")
        .bind(role, now, eventId, userId)
        .run();
    } else {
      await d1
        .prepare("UPDATE memberships SET module_grants = ?, updated_at = ? WHERE event_id = ? AND user_id = ? AND status = 'active'")
        .bind(JSON.stringify(moduleGrants), now, eventId, userId)
        .run();
    }

    return json({ ok: true, message: "Member updated." });
  }

  return json({ error: "Unknown action." }, 400);
}
