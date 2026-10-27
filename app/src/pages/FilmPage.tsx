import { useRef, useState } from "react";
import { Icon } from "../components/ui/Icon";
import { resolveInviteMedia } from "../domain/inviteMedia";
import {
  compressImageForUpload,
  extractVideoPoster,
  uploadInviteMedia,
} from "../domain/mediaUpload";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";

/**
 * Invitations · Film — host video streamed from R2 (KV fallback ≤20MB).
 */
export function FilmPage() {
  const go = useNavigateInsideEvent();
  const { state, setState, showToast, syncCode } = useWeddingState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<{
    url: string;
    kind: "video" | "photo";
  } | null>(null);

  const resolved = resolveInviteMedia(state.buzz);
  const previewVideo =
    localPreview?.kind === "video" ? localPreview.url : resolved.videoUrl;
  const previewPhoto =
    localPreview?.kind === "photo"
      ? localPreview.url
      : localPreview?.kind === "video"
        ? null
        : resolved.photoUrl;
  const onPick = (file: File | null) => {
    if (!file || busy) return;
    if (!syncCode) {
      showToast("Open an event first");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    setBusy(true);
    setProgress(0);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview({ url: objectUrl, kind: isVideo ? "video" : "photo" });

    void (async () => {
      try {
        if (isVideo) {
          const videoResult = await uploadInviteMedia({
            code: syncCode,
            file,
            kind: "video",
            onProgress: (pct) => setProgress(Math.min(90, pct)),
          });

          let posterUrl = "";
          try {
            const posterBlob = await extractVideoPoster(file);
            if (posterBlob) {
              const compressed = await compressImageForUpload(posterBlob);
              const posterFile = new File([compressed], "poster.jpg", {
                type: "image/jpeg",
              });
              const poster = await uploadInviteMedia({
                code: syncCode,
                file: posterFile,
                kind: "photo",
                onProgress: (pct) => setProgress(90 + Math.round(pct * 0.1)),
              });
              posterUrl = poster.url;
            }
          } catch {
            /* poster is optional */
          }

          setState((prev) => ({
            ...prev,
            buzz: {
              ...prev.buzz,
              letterVideoUrl: videoResult.url,
              ...(posterUrl ? { letterPhotoUrl: posterUrl } : {}),
            },
          }));
          setLocalPreview(null);
          showToast(
            videoResult.backend === "kv"
              ? "Film uploaded (temp storage) · enable R2 for large files"
              : "Film uploaded · streaming for guests",
          );
        } else {
          // Postcard stills belong on Note — never wipe the shared film here
          setLocalPreview(null);
          showToast("Postcard photos are on Note — film stays one clip for everyone");
          go("/people/letter");
          return;
        }
      } catch (error) {
        setLocalPreview(null);
        showToast(error instanceof Error ? error.message : "Could not upload media");
      } finally {
        URL.revokeObjectURL(objectUrl);
        setBusy(false);
        setProgress(0);
      }
    })();
  };

  const clearFilm = () => {
    setLocalPreview(null);
    setState((prev) => ({
      ...prev,
      buzz: {
        ...prev.buzz,
        letterVideoUrl: "",
        // Keep postcard photo on Note
      },
    }));
    showToast("Film cleared · postcard photo unchanged");
  };

  return (
    <div className="invite-craft invite-craft--film mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col text-[#2a2218]">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-[max(0.65rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => go("/people/invites")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fffdf8] shadow-[0_6px_16px_rgba(60,30,12,0.08)]"
          aria-label="Back to Invitations"
        >
          <Icon name="arrow_back" className="text-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
            Film
          </p>
          <p className="truncate text-[13px] font-semibold text-[#7a6f62]">
            Streams from the cloud · not in event sync
          </p>
        </div>
        <button
          type="button"
          onClick={() => go("/people/letter")}
          className="rounded-full bg-[#ece7e2] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#584141]"
        >
          Note
        </button>
      </header>

      <section className="shrink-0 px-3 pb-3">
        <p className="rounded-[16px] bg-[#fffdf8] px-3.5 py-3 text-[13px] font-semibold leading-snug text-[#584141] shadow-[0_8px_20px_rgba(60,30,12,0.06)] ring-1 ring-black/5">
          One film for every guest. Postcard photos you change anytime on Note when
          sending to new contacts.
        </p>

        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1a100c] px-4 text-[14px] font-extrabold text-[#fff8f5] disabled:opacity-50"
          >
            <Icon name="movie" className="text-[18px]" />
            {busy
              ? progress > 0
                ? `Uploading… ${progress}%`
                : "Preparing…"
              : previewVideo
                ? "Replace film"
                : "Add film"}
          </button>
          {previewVideo && !busy ? (
            <button
              type="button"
              onClick={clearFilm}
              className="inline-flex h-12 items-center rounded-full bg-[#ece7e2] px-3.5 text-[12px] font-bold text-[#584141]"
            >
              Remove
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              onPick(event.target.files?.[0] || null);
              event.target.value = "";
            }}
          />
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a8b82]">
          Guest film preview
        </p>
        <div className="guest-invite-media-box guest-invite-media-box--film overflow-hidden rounded-[22px] bg-[#120c0a] ring-1 ring-black/10">
          {previewVideo ? (
            <video
              className="guest-invite-media-box__media"
              src={previewVideo}
              poster={previewPhoto || undefined}
              playsInline
              controls
              preload="metadata"
            />
          ) : previewPhoto ? (
            <img className="guest-invite-media-box__media" src={previewPhoto} alt="" />
          ) : (
            <span className="guest-invite-media-box__placeholder px-6 py-16 text-center text-[13px] font-semibold text-white/55">
              No film yet — guests will see this beat once you upload.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => go("/people/preview")}
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#fffdf8] text-[13px] font-extrabold text-[#1a100c] shadow-[0_6px_16px_rgba(60,30,12,0.08)] ring-1 ring-black/5"
        >
          Try as guest
          <Icon name="arrow_forward" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
