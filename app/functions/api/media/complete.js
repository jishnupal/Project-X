/**
 * POST /api/media/complete
 * Body JSON: { code, key, uploadId, parts: [{ partNumber, etag }] }
 */
import { json, resolveEventAccess } from "../_auth.js";
import { CODE_PATTERN, publicUrl } from "./_store.js";

export async function onRequestPost({ request, env }) {
  const bucket = env.BIYEFLOW_MEDIA;
  if (!bucket) return json({ error: "R2 not configured." }, 503);

  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const code = String(body?.code || "")
    .trim()
    .toUpperCase();
  const key = String(body?.key || "").trim();
  const uploadId = String(body?.uploadId || "").trim();
  const parts = Array.isArray(body?.parts) ? body.parts : [];

  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);
  if (!key.startsWith(`invite/${code}/`) || key.includes("..")) {
    return json({ error: "Invalid media key." }, 400);
  }
  if (!uploadId || !parts.length) {
    return json({ error: "Missing uploadId or parts." }, 400);
  }

  const access = await resolveEventAccess(d1, request, code);
  if (access.error || (access.place !== "host" && access.place !== "cohost")) {
    return json(
      { error: access.error || "Only hosts can upload invite media." },
      access.status || 403,
    );
  }

  const multipart = bucket.resumeMultipartUpload(key, uploadId);
  await multipart.complete(
    parts
      .map((p) => ({
        partNumber: Number(p.partNumber),
        etag: String(p.etag || ""),
      }))
      .filter((p) => p.partNumber > 0 && p.etag)
      .sort((a, b) => a.partNumber - b.partNumber),
  );

  return json({
    url: publicUrl(key),
    key,
    backend: "r2",
  });
}
