import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { InviteLetterPreview } from "../components/guest/InviteLetterPreview";
import { Icon } from "../components/ui/Icon";
import {
  composeWhatsAppInviteText,
  createContactInvite,
  openWhatsAppInvite,
} from "../domain/contactInvite";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";

const MAX_MEDIA_BYTES = 2_500_000;
const FALLBACK_MESSAGE = "You're invited — we'd love to have you with us.";

/**
 * Customize invite (message + media). Opened from Send pass.
 * Optional ?send=guestId continues into WhatsApp.
 */
export function LetterPage() {
  const go = useNavigateInsideEvent();
  const [searchParams] = useSearchParams();
  const sendGuestId = (searchParams.get("send") || "").trim();
  const { state, setState, showToast, syncCode } = useWeddingState();
  const mediaRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  const guest = useMemo(
    () => (sendGuestId ? state.guests.find((row) => row.id === sendGuestId) : null),
    [state.guests, sendGuestId],
  );

  const message = state.buzz?.welcomeMessage ?? "";
  const savedMedia = (state.buzz?.letterPhotoUrl || "").trim();

  const content = useMemo(
    () => ({
      templateId: "classic" as const,
      eventName: state.event?.name || "Your event",
      guestName: guest?.name?.trim() || "Guest",
      welcomeTitle: "",
      welcomeMessage: message.trim() || FALLBACK_MESSAGE,
      note: "",
      venueName: "",
      photoUrl: savedMedia || null,
    }),
    [state.event?.name, guest?.name, message, savedMedia],
  );

  const setMessage = (welcomeMessage: string) => {
    setState((prev) => ({
      ...prev,
      buzz: { ...prev.buzz, welcomeMessage },
    }));
  };

  const onPickMedia = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      showToast("Keep media under ~2.5MB for now");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setState((prev) => ({
        ...prev,
        buzz: { ...prev.buzz, letterPhotoUrl: String(reader.result || "") },
      }));
      showToast(file.type.startsWith("video/") ? "Video added" : "Photo added");
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setState((prev) => ({
      ...prev,
      buzz: { ...prev.buzz, letterPhotoUrl: "" },
    }));
    showToast("Media cleared");
  };

  const sendOnWhatsApp = async () => {
    if (!guest || sending) return;
    if (!syncCode) {
      showToast("Open an event first");
      return;
    }
    setSending(true);
    try {
      const payload = await createContactInvite({
        code: syncCode,
        guestId: guest.id,
        role: guest.isBuddy ? "buddy" : "guest",
      });
      const note = (message.trim() || state.buzz?.invitationNote || "").trim();
      const text = composeWhatsAppInviteText(payload.whatsappText, note);
      setState((prev) => ({
        ...prev,
        guests: prev.guests.map((row) =>
          row.id === guest.id
            ? { ...row, invitationSent: true, inviteStatus: "Sent" as const }
            : row,
        ),
      }));
      showToast("Invitation sent");
      window.setTimeout(() => openWhatsAppInvite(text), 50);
      go("/people/invites");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not prepare invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="invite-craft invite-craft--letter invite-craft--simple mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col text-[#2a2218]">
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
            Customize invite
          </p>
          <p className="truncate text-[13px] font-semibold text-[#7a6f62]">
            {guest?.name?.trim()
              ? `Sending to ${guest.name.trim()}`
              : "Your message and media"}
          </p>
        </div>
      </header>

      <section className="invite-craft__edit shrink-0 px-3 pb-3">
        <label className="block rounded-[20px] bg-[#fffdf8] px-3.5 py-3 shadow-[0_8px_20px_rgba(60,30,12,0.08)] ring-1 ring-black/5">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9a5a38]">
            Message
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder={FALLBACK_MESSAGE}
            className="mt-1.5 w-full resize-none rounded-[14px] bg-white px-3 py-2.5 text-[15px] font-semibold leading-relaxed text-[#1a100c] outline-none ring-1 ring-black/5 placeholder:text-[#b5a9a4]"
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => mediaRef.current?.click()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1a100c] px-4 text-[13px] font-extrabold text-[#fff8f5]"
          >
            <Icon name="add_a_photo" className="text-[18px]" />
            {savedMedia ? "Change media" : "Add image / video"}
          </button>
          {savedMedia ? (
            <button
              type="button"
              onClick={clearMedia}
              className="inline-flex h-11 items-center rounded-full bg-[#ece7e2] px-3.5 text-[12px] font-bold text-[#584141]"
            >
              Remove
            </button>
          ) : null}
          <input
            ref={mediaRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => onPickMedia(event.target.files?.[0] || null)}
          />
        </div>

        {guest ? (
          <button
            type="button"
            data-testid="contact-send-whatsapp"
            disabled={sending || !guest.name.trim()}
            onClick={() => void sendOnWhatsApp()}
            className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[15px] font-extrabold text-white disabled:opacity-50"
          >
            <Icon name="chat" className="text-[18px]" />
            {sending ? "Preparing…" : "Send on WhatsApp"}
          </button>
        ) : null}
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-1">
        <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a8b82]">
          Live preview
        </p>
        <InviteLetterPreview
          className="invite-letter--postcard invite-letter--enter"
          content={content}
          size="immersive"
        />
      </div>
    </div>
  );
}
