/**
 * POST /api/media/session — start R2 multipart upload for large films.
 * Body JSON: { code, kind, ext, contentType, size }
 * Returns: { key, uploadId, url, partSize, backend }
 *
 * Without R2, returns backend:"single" so the client uses POST /api/media/upload.
 */
import { json, resolveEventAccess } from "../_auth.js";
import {
  CODE_PATTERN,
  MAX_PHOTO,
  MAX_VIDEO_R2,
  hasR2,
  newMediaId,
  publicUrl,
  safeExt,
} from "./_store.js";

const PART_SIZE = 5 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
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
  const kind = String(body?.kind || "photo").toLowerCase() === "video" ? "video" : "photo";
  const ext = safeExt(body?.ext, kind);
  const contentType =
    String(body?.contentType || "") ||
    (kind === "video" ? "video/mp4" : "image/jpeg");
  const size = Number(body?.size) || 0;

  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error || (access.place !== "host" && access.place !== "cohost")) {
    return json(
      { error: access.error || "Only hosts can upload invite media." },
      access.status || 403,
    );
  }

  if (kind === "video" && size > MAX_VIDEO_R2) {
    return json({ error: "Video is too large (max 40MB on free tier)." }, 413);
  }
  if (kind === "photo" && size > MAX_PHOTO) {
    return json({ error: "Photo is too large (max 4MB)." }, 413);
  }

  const id = newMediaId();
  const key = `invite/${code}/${kind}_${id}.${ext}`;

  if (!hasR2(env) || size < PART_SIZE * 2) {
    return json({
      backend: "single",
      key,
      url: publicUrl(key),
      partSize: PART_SIZE,
    });
  }

  const multipart = await env.BIYEFLOW_MEDIA.createMultipartUpload(key, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      eventCode: code,
      kind,
      uploadedAt: String(Date.now()),
    },
  });

  return json({
    backend: "multipart",
    key,
    uploadId: multipart.uploadId,
    url: publicUrl(key),
    partSize: PART_SIZE,
  });
}
