/**
 * GET /api/push/vapid-public-key
 */
import { json } from "../_auth.js";
import { getVapidPublicKey } from "../_push.js";

export async function onRequestGet({ env }) {
  const key = getVapidPublicKey(env);
  if (!key) return json({ error: "Push not configured." }, 503);
  return json({ publicKey: key });
}
