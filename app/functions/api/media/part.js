/**
 * PUT /api/media/part?code=&key=&uploadId=&partNumber=
 * Body: raw part bytes. Completes one R2 multipart chunk.
 */
import { json, resolveEventAccess } from "../_auth.js";
import { CODE_PATTERN } from "./_store.js";

export async function onRequestPut({ request, env }) {
  const bucket = env.BIYEFLOW_MEDIA;
  if (!bucket) return json({ error: "R2 not configured." }, 503);

  const d1 = env.BIYEFLOW_DB;
  if (!d1) return json({ error: "Database not configured." }, 503);

  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") || "")
    .trim()
    .toUpperCase();
  const key = String(url.searchParams.get("key") || "").trim();
  const uploadId = String(url.searchParams.get("uploadId") || "").trim();
  const partNumber = Number(url.searchParams.get("partNumber"));

  if (!CODE_PATTERN.test(code)) return json({ error: "Invalid event code." }, 400);
  if (!key.startsWith(`invite/${code}/`) || key.includes("..")) {
    return json({ error: "Invalid media key." }, 400);
  }
  if (!uploadId || !Number.isFinite(partNumber) || partNumber < 1) {
    return json({ error: "Missing uploadId or partNumber." }, 400);
  }

  const access = await resolveEventAccess(d1, request, code);
  if (access.error || (access.place !== "host" && access.place !== "cohost")) {
    return json(
      { error: access.error || "Only hosts can upload invite media." },
      access.status || 403,
    );
  }

  const body = await request.arrayBuffer();
  if (!body.byteLength) return json({ error: "Empty part." }, 400);

  const multipart = bucket.resumeMultipartUpload(key, uploadId);
  const uploaded = await multipart.uploadPart(partNumber, body);

  return json({
    etag: uploaded.etag,
    partNumber,
  });
}
