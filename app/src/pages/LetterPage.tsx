import { useEffect, useMemo, useRef, useState } from "react";
import { GuestInviteExperience } from "../components/guest/GuestInviteExperience";
import { Icon } from "../components/ui/Icon";
import { resolveDayName } from "../domain/functions";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";

const SAMPLE_PHOTO = "/home/letter-sample-couple.jpg";

/**
 * Immersive host dress-rehearsal of the guest invite.
 * Opened from Invitations → Preview as guest.
 */
export function LetterPage() {
  const go = useNavigateInsideEvent();
  const { state, showToast } = useWeddingState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sampleName, setSampleName] = useState("Riya");
  const [photoUrl, setPhotoUrl] = useState<string | null>(SAMPLE_PHOTO);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const nextDay = useMemo(() => {
    const first = (state.functions || []).find((row) => row.date || row.name);
    if (!first) return "";
    if (typeof first.id === "number") return resolveDayName(state, first.id);
    return first.name || "";
  }, [state]);

  const content = useMemo(
    () => ({
      templateId: "classic" as const,
      eventName: state.event?.name || "Your event",
      guestName: sampleName,
      welcomeTitle: state.buzz?.welcomeTitle || "",
      welcomeMessage: state.buzz?.welcomeMessage || "",
      note: state.buzz?.invitationNote || "",
      venueName: state.buzz?.venueName || "",
      photoUrl,
    }),
    [state.event?.name, state.buzz, sampleName, photoUrl],
  );

  const onPickPhoto = (file: File | null) => {
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    if (!file) {
      setPhotoUrl(null);
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
  };

  return (
    <div className="font-[Manrope,sans-serif] relative mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col bg-[#1a100c] text-black">
      <div className="sticky top-0 z-30 px-3 pt-[max(0.65rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 rounded-full bg-black/55 px-2 py-1.5 text-[#fff8f5] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => go("/people/invites")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label="Back to Invitations"
          >
            <Icon name="arrow_back" className="text-[18px]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#feca43]">
              Guest preview
            </p>
            <p className="truncate text-[12px] font-semibold text-white/75">
              Scroll the invite · guests never see this bar
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlaygroundOpen((open) => !open)}
            className="rounded-full bg-[#feca43] px-3 py-1.5 text-[12px] font-extrabold text-black"
          >
            {playgroundOpen ? "Done" : "Tweak"}
          </button>
        </div>

        {playgroundOpen ? (
          <div className="mt-2 space-y-3 rounded-[22px] bg-[#fff8f5] px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <label className="block">
              <span className="text-[12px] font-semibold text-[#584141]">Guest name on the letter</span>
              <input
                value={sampleName}
                onChange={(event) => setSampleName(event.target.value)}
                className="mt-1 h-10 w-full rounded-full bg-white px-4 text-[14px] font-semibold outline-none ring-1 ring-black/5"
                placeholder="Guest name"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
                  setPhotoUrl(SAMPLE_PHOTO);
                }}
                className="inline-flex h-9 items-center rounded-full bg-white px-3 text-[13px] font-semibold ring-1 ring-black/5"
              >
                Sample photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold ring-1 ring-black/5"
              >
                <Icon name="add_a_photo" className="text-[16px]" />
                Your photo
              </button>
              <button
                type="button"
                onClick={() => onPickPhoto(null)}
                className="inline-flex h-9 items-center rounded-full bg-white px-3 text-[13px] font-semibold text-[#584141] ring-1 ring-black/5"
              >
                No photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onPickPhoto(event.target.files?.[0] || null)}
              />
            </div>
            <p className="text-[11px] font-medium text-[#9a8b82]">
              Classic template · more looks with Pro later
            </p>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(120%_80%_at_50%_0%,#3d2418_0%,#1a100c_55%,#120c09_100%)] px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-3">
        <p className="mb-3 text-center text-[12px] font-semibold tracking-wide text-[#feca43]/70">
          This is the link experience guests open
        </p>
        <div className="rounded-[28px] bg-[#fff8f5] px-3 pb-8 pt-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <GuestInviteExperience
            mode="preview"
            content={content}
            teaser={{ nextDay }}
            onContinue={() =>
              showToast("That’s the guest continue — Buzz unlocks after they claim")
            }
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#120c09] via-[#120c09]/90 to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-12">
        <button
          type="button"
          onClick={() => go("/people/invites")}
          className="pointer-events-auto flex h-12 w-full items-center justify-center rounded-full bg-[#feca43] text-[15px] font-extrabold text-black shadow-[0_12px_32px_rgba(254,202,67,0.28)]"
        >
          Looks good — back to sending
        </button>
      </div>
    </div>
  );
}
