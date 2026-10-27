/** Shared invite media helpers — URLs stream; never scan fat base64 for type. */

export function isVideoUrl(url: string): boolean {
  const u = (url || "").trim();
  if (!u) return false;
  if (u.startsWith("data:")) return u.startsWith("data:video");
  try {
    const path = u.startsWith("http") ? new URL(u).pathname : u.split("?")[0] || u;
    return /\.(mp4|webm|mov|m4v)$/i.test(path);
  } catch {
    return /\.(mp4|webm|mov|m4v)$/i.test(u.split("?")[0] || "");
  }
}

export type InviteMediaBuzz = {
  letterPhotoUrl?: string;
  letterVideoUrl?: string;
};

/** Prefer dedicated video field; legacy photo field may still hold a video path. */
export function resolveInviteMedia(buzz: InviteMediaBuzz | null | undefined): {
  videoUrl: string | null;
  photoUrl: string | null;
} {
  const videoField = (buzz?.letterVideoUrl || "").trim();
  const photoField = (buzz?.letterPhotoUrl || "").trim();
  if (videoField) {
    return {
      videoUrl: videoField,
      photoUrl: photoField && !isVideoUrl(photoField) ? photoField : null,
    };
  }
  if (photoField && isVideoUrl(photoField)) {
    return { videoUrl: photoField, photoUrl: null };
  }
  return { videoUrl: null, photoUrl: photoField || null };
}
