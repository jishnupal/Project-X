/**
 * Invite media storage — free-tier first.
 * - R2 Standard (when enabled): 10GB free / mo, free egress
 * - KV fallback (always available on Pages): ≤20MB per file
 * Never use Infrequent Access or Stream (those leave free tier).
 */

export const CODE_PATTERN = /^[A-Z0-9]{8}$/;
/** Soft cap keeps many events inside R2's 10GB free tier. */
export const MAX_VIDEO_R2 = 40 * 1024 * 1024;
export const MAX_VIDEO_KV = 20 * 1024 * 1024;
export const MAX_PHOTO = 4 * 1024 * 1024;
export const KV_PREFIX = "bfmedia:";

export function newMediaId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeExt(raw, kind) {
  const e = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  if (kind === "video") {
    if (["mp4", "webm", "mov", "m4v"].includes(e)) return e;
    return "mp4";
  }
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(e)) return e === "jpeg" ? "jpg" : e;
  return "jpg";
}

export function publicUrl(key) {
  return `/api/media/file/${key}`;
}

export function hasR2(env) {
  return Boolean(env.BIYEFLOW_MEDIA);
}

export function hasKv(env) {
  return Boolean(env.BIYEFLOW_SYNC);
}

export function maxVideoBytes(env) {
  return hasR2(env) ? MAX_VIDEO_R2 : MAX_VIDEO_KV;
}

/**
 * @returns {{ backend: 'r2' | 'kv' }}
 */
export async function putObject(env, key, body, contentType, customMetadata = {}) {
  const size = body.byteLength ?? body.size ?? 0;
  if (env.BIYEFLOW_MEDIA) {
    await env.BIYEFLOW_MEDIA.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        ...customMetadata,
        uploadedAt: String(Date.now()),
      },
    });
    return { backend: "r2", size };
  }

  if (!env.BIYEFLOW_SYNC) {
    const err = new Error(
      "Media storage is not configured. Enable R2 in Cloudflare (bucket biyeflow-media) and redeploy.",
    );
    err.status = 503;
    throw err;
  }

  if (size > MAX_VIDEO_KV) {
    const err = new Error(
      "This file needs R2 (over 20MB). Enable R2 in the Cloudflare dashboard, create bucket biyeflow-media, redeploy — then upload again.",
    );
    err.status = 503;
    throw err;
  }

  await env.BIYEFLOW_SYNC.put(`${KV_PREFIX}${key}`, body, {
    metadata: {
      contentType,
      size: String(size),
      ...customMetadata,
    },
  });
  return { backend: "kv", size };
}

export async function getObject(env, key, opts = {}) {
  if (env.BIYEFLOW_MEDIA) {
    const object = opts.range
      ? await env.BIYEFLOW_MEDIA.get(key, { range: opts.range })
      : await env.BIYEFLOW_MEDIA.get(key);
    if (object) return { backend: "r2", object };
  }

  if (env.BIYEFLOW_SYNC) {
    const raw = await env.BIYEFLOW_SYNC.get(`${KV_PREFIX}${key}`, {
      type: "arrayBuffer",
      withMetadata: true,
    });
    if (raw?.value) {
      return {
        backend: "kv",
        buffer: raw.value,
        metadata: raw.metadata || {},
      };
    }
    // Older puts without withMetadata shape
    const buf = await env.BIYEFLOW_SYNC.get(`${KV_PREFIX}${key}`, { type: "arrayBuffer" });
    if (buf) return { backend: "kv", buffer: buf, metadata: {} };
  }

  return null;
}

export async function headObject(env, key) {
  if (env.BIYEFLOW_MEDIA) {
    const object = await env.BIYEFLOW_MEDIA.head(key);
    if (object) return { backend: "r2", object };
  }

  if (env.BIYEFLOW_SYNC) {
    const raw = await env.BIYEFLOW_SYNC.getWithMetadata(`${KV_PREFIX}${key}`);
    if (raw?.value != null || raw?.metadata) {
      const size = Number(raw.metadata?.size) || (typeof raw.value === "string" ? raw.value.length : 0);
      return {
        backend: "kv",
        contentType: raw.metadata?.contentType || "application/octet-stream",
        size,
      };
    }
  }

  return null;
}
