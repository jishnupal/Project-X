/** Host upload of invite film/photo — R2 multipart when available, else single POST (KV ≤20MB). */

/** Free-tier friendly caps (R2 10GB / KV ≤20MB). */
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export type MediaUploadKind = "photo" | "video";

export type MediaUploadResult = {
  url: string;
  key: string;
  contentType?: string;
  size?: number;
  backend?: string;
};

function extFor(file: File, kind: MediaUploadKind): string {
  const name = (file.name || "").toLowerCase();
  const fromName = name.match(/\.([a-z0-9]+)$/)?.[1];
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase();
  if (kind === "video") {
    if (file.type.includes("webm")) return "webm";
    if (file.type.includes("quicktime")) return "mov";
    return "mp4";
  }
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    /* ignore */
  }
  return "Upload failed";
}

function uploadWithProgress(
  url: string,
  file: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<MediaUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(data?.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as MediaUploadResult;
        if (!data?.url) reject(new Error("Upload succeeded but no URL returned"));
        else resolve(data);
      } catch {
        reject(new Error("Upload succeeded but no URL returned"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

async function uploadMultipart(opts: {
  code: string;
  file: File;
  kind: MediaUploadKind;
  contentType: string;
  ext: string;
  session: {
    key: string;
    uploadId: string;
    partSize: number;
    url: string;
  };
  onProgress?: (pct: number) => void;
}): Promise<MediaUploadResult> {
  const { code, file, contentType, session, onProgress } = opts;
  const partSize = Math.max(session.partSize || 5 * 1024 * 1024, 5 * 1024 * 1024);
  const total = file.size;
  const parts: { partNumber: number; etag: string }[] = [];
  let uploaded = 0;
  let partNumber = 1;

  for (let offset = 0; offset < total; offset += partSize) {
    const chunk = file.slice(offset, Math.min(offset + partSize, total));
    const partUrl =
      `/api/media/part?code=${encodeURIComponent(code)}` +
      `&key=${encodeURIComponent(session.key)}` +
      `&uploadId=${encodeURIComponent(session.uploadId)}` +
      `&partNumber=${partNumber}`;

    const response = await fetch(partUrl, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": contentType },
      body: chunk,
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as { etag?: string; partNumber?: number };
    if (!data.etag) throw new Error("Part upload missing etag");
    parts.push({ partNumber, etag: data.etag });
    uploaded += chunk.size;
    onProgress?.(Math.min(99, Math.round((uploaded / total) * 100)));
    partNumber += 1;
  }

  const complete = await fetch("/api/media/complete", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      key: session.key,
      uploadId: session.uploadId,
      parts,
    }),
  });
  if (!complete.ok) throw new Error(await readError(complete));
  const result = (await complete.json()) as MediaUploadResult;
  onProgress?.(100);
  if (!result?.url) throw new Error("Upload succeeded but no URL returned");
  return { ...result, contentType, size: file.size };
}

export async function uploadInviteMedia(opts: {
  code: string;
  file: File;
  kind: MediaUploadKind;
  onProgress?: (pct: number) => void;
}): Promise<MediaUploadResult> {
  const { code, file, kind, onProgress } = opts;
  const eventCode = code.trim().toUpperCase();
  if (!eventCode) throw new Error("Open an event first");
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
    throw new Error("Keep invite videos under 40MB (short 720p clip — free tier)");
  }
  if (kind === "photo" && file.size > MAX_PHOTO_BYTES) {
    throw new Error("That image is too large (max 4MB)");
  }

  const ext = extFor(file, kind);
  const contentType = file.type || (kind === "video" ? "video/mp4" : "image/jpeg");
  onProgress?.(0);

  // Ask server whether to multipart (R2) or single-shot (R2/KV)
  type SessionPayload = {
    backend?: string;
    key?: string;
    uploadId?: string;
    partSize?: number;
    url?: string;
  };
  let session: SessionPayload | null = null;
  try {
    const sessionRes = await fetch("/api/media/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: eventCode,
        kind,
        ext,
        contentType,
        size: file.size,
      }),
    });
    if (sessionRes.ok) {
      session = (await sessionRes.json()) as SessionPayload;
    }
  } catch {
    session = null;
  }

  if (
    session &&
    session.backend === "multipart" &&
    typeof session.uploadId === "string" &&
    typeof session.key === "string"
  ) {
    return uploadMultipart({
      code: eventCode,
      file,
      kind,
      contentType,
      ext,
      session: {
        key: session.key,
        uploadId: session.uploadId,
        partSize: session.partSize || 5 * 1024 * 1024,
        url: session.url || "",
      },
      onProgress,
    });
  }

  const url =
    `/api/media/upload?code=${encodeURIComponent(eventCode)}` +
    `&kind=${kind}&ext=${encodeURIComponent(ext)}`;

  const result = await uploadWithProgress(url, file, contentType, onProgress);
  onProgress?.(100);
  return result;
}

/** Compress stills / posters before upload. */
export async function compressImageForUpload(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image");
    ctx.drawImage(bitmap, 0, 0, w, h);
    let quality = 0.82;
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    while (blob && blob.size > 900_000 && quality > 0.5) {
      quality -= 0.08;
      blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
      );
    }
    if (!blob) throw new Error("Could not compress image");
    return blob;
  } finally {
    bitmap.close();
  }
}

/** Grab a light JPEG poster from the first frames of a video file. */
export async function extractVideoPoster(file: File): Promise<Blob | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const onError = () => reject(new Error("Could not read video"));
      video.addEventListener("loadeddata", () => resolve(), { once: true });
      video.addEventListener("error", onError, { once: true });
    });

    const seekTo = Math.min(0.35, Math.max(0.05, (video.duration || 1) * 0.08));
    if (Number.isFinite(video.duration) && video.duration > 0) {
      await new Promise<void>((resolve) => {
        const onSeeked = () => resolve();
        video.addEventListener("seeked", onSeeked, { once: true });
        try {
          video.currentTime = seekTo;
        } catch {
          resolve();
        }
      });
    }

    const maxEdge = 1280;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    const w = Math.max(1, Math.round(vw * scale));
    const h = Math.max(1, Math.round(vh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.78),
    );
    return blob;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
