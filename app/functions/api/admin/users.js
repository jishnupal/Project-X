/**
 * GET /api/admin/users
 * Platform admin only. Counts Gmail customers and the events they belong to.
 */
import { json, getRequestUser, ensureAuthSchema } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  await ensureAuthSchema(d1);
  const user = await getRequestUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  if (user.platformRole !== "platform_admin") return json({ error: "Not allowed." }, 403);

  const rows = await d1
    .prepare(
      `SELECT u.id, u.email, u.name, u.created_at,
              e.name AS event_name, e.code, e.owner_id, m.role AS member_role
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id AND m.status = 'active'
       LEFT JOIN events e ON e.id = m.event_id
         AND (e.deleted_at IS NULL OR e.deleted_at = 0)
       ORDER BY u.created_at ASC, e.name ASC`
    )
    .all();

  const byId = new Map();
  for (const row of rows?.results || []) {
    let person = byId.get(row.id);
    if (!person) {
      person = {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
        events: [],
      };
      byId.set(row.id, person);
    }
    if (row.code) {
      person.events.push({
        name: row.event_name,
        code: row.code,
        role: row.member_role,
        owner: row.owner_id === row.id,
      });
    }
  }

  const users = [...byId.values()];
  return json({ count: users.length, users });
}
