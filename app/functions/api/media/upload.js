/**
 * POST /api/media/upload?code=&kind=video|photo&ext=
 * Body: raw bytes. R2 primary; KV fallback ≤20MB until R2 is enabled.
 */
import { json, resolveEventAccess } from "../_auth.js";
import {
  CODE_PATTERN,
  MAX_PHOTO,
  maxVideoBytes,
  newMediaId,
  publicUrl,
  putObject,
  safeExt,
  hasR2,
} from "./_store.js";

export async function onRequestPost({ request, env }) {
  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") || "")
    .trim()
    .toUpperCase();
  const kind =
    String(url.searchParams.get("kind") || "photo").toLowerCase() === "video"
      ? "video"
      : "photo";
  const ext = safeExt(url.searchParams.get("ext"), kind);

  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);

  const access = await resolveEventAccess(d1, request, code);
  if (access.error || (access.place !== "host" && access.place !== "cohost")) {
    return json(
      { error: access.error || "Only hosts can upload invite media." },
      access.status || 403,
    );
  }

  const contentType =
    request.headers.get("Content-Type") ||
    (kind === "video" ? "video/mp4" : "image/jpeg");

  const body = await request.arrayBuffer();
  const size = body.byteLength;
  if (!size) return json({ error: "Empty upload." }, 400);

  const videoCap = maxVideoBytes(env);
  if (kind === "video" && size > videoCap) {
    return json(
      {
        error: hasR2(env)
          ? "Video is too large (max 40MB on free tier). Use a short 720p clip."
          : "Video over 20MB needs free R2. Enable R2 in Cloudflare → create biyeflow-media → redeploy.",
      },
      hasR2(env) ? 413 : 503,
    );
  }
  if (kind === "photo" && size > MAX_PHOTO) {
    return json({ error: "Photo is too large (max 4MB)." }, 413);
  }

  const id = newMediaId();
  const key = `invite/${code}/${kind}_${id}.${ext}`;

  try {
    const stored = await putObject(env, key, body, contentType, {
      eventCode: code,
      kind,
    });
    return json({
      url: publicUrl(key),
      key,
      contentType,
      size: stored.size || size,
      backend: stored.backend,
    });
  } catch (error) {
    return json({ error: error.message || "Upload failed." }, error.status || 500);
  }
}
