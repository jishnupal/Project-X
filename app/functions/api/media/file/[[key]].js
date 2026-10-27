/**
 * GET /api/media/file/invite/CODE/kind_id.ext
 * Streams R2 (Range) or KV fallback for progressive / full playback.
 */
import { getObject, headObject } from "../_store.js";

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

function badRequest(msg) {
  return new Response(msg || "Bad request", { status: 400, headers: { "Cache-Control": "no-store" } });
}

function resolveKey(params) {
  const parts = params.key;
  const key = Array.isArray(parts)
    ? parts.map(decodeURIComponent).join("/")
    : decodeURIComponent(String(parts || ""));
  if (!key || key.includes("..") || !key.startsWith("invite/")) return null;
  return key;
}

function parseRange(header, size) {
  const m = String(header || "").match(/bytes=(\d*)-(\d*)/);
  if (!m) return null;
  let start = m[1] === "" ? NaN : Number(m[1]);
  let end = m[2] === "" ? NaN : Number(m[2]);
  if (Number.isNaN(start)) {
    // suffix bytes
    if (Number.isNaN(end)) return null;
    start = Math.max(0, size - end);
    end = size - 1;
  } else {
    if (Number.isNaN(end) || end >= size) end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return null;
  return { start, end, length: end - start + 1 };
}

export async function onRequestGet({ request, env, params }) {
  const key = resolveKey(params);
  if (!key) return badRequest("Invalid media key");

  const rangeHeader = request.headers.get("Range");
  const hit = await getObject(env, key, rangeHeader ? { range: request.headers } : {});
  if (!hit) return notFound();

  if (hit.backend === "r2") {
    const object = hit.object;
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (rangeHeader && object.range) {
      const { offset, length } = object.range;
      const end = offset + length - 1;
      headers.set("Content-Range", `bytes ${offset}-${end}/${object.size}`);
      headers.set("Content-Length", String(length));
      return new Response(object.body, { status: 206, headers });
    }
    headers.set("Content-Length", String(object.size));
    return new Response(object.body, { status: 200, headers });
  }

  // KV fallback — slice for Range so short films still scrub
  const buffer = hit.buffer;
  const size = buffer.byteLength;
  const contentType = hit.metadata?.contentType || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(range.length));
    return new Response(buffer.slice(range.start, range.end + 1), {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(size));
  return new Response(buffer, { status: 200, headers });
}

export async function onRequestHead({ request, env, params }) {
  const key = resolveKey(params);
  if (!key) return badRequest("Invalid media key");

  const hit = await headObject(env, key);
  if (!hit) return notFound();

  if (hit.backend === "r2") {
    const object = hit.object;
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Length", String(object.size));
    return new Response(null, { status: 200, headers });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": hit.contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(hit.size || 0),
    },
  });
}
