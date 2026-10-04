import { useEffect, useRef, useState } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import {
  composeWhatsAppInviteText,
  openWhatsAppInvite,
  type ContactInvitePayload,
} from "../../domain/contactInvite";
import { LetterPreviewSheet } from "./LetterPreviewSheet";
import type { InviteLetterContent } from "./InviteLetterPreview";

type SendInviteSheetProps = {
  open: boolean;
  invite: ContactInvitePayload | null;
  /** Optional cherry-on-top note (e.g. Buzz invitation line). */
  defaultNote?: string;
  letterBase?: Omit<InviteLetterContent, "guestName" | "note" | "photoUrl">;
  onClose: () => void;
  onSent: (guestId: string) => void;
  showToast: (message: string) => void;
};

export function SendInviteSheet({
  open,
  invite,
  defaultNote = "",
  letterBase,
  onClose,
  onSent,
  showToast,
}: SendInviteSheetProps) {
  const [guestName, setGuestName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !invite) return;
    setGuestName(invite.name?.trim() || "Guest");
    setCustomNote(defaultNote.trim());
    setPhotoUrl(null);
    setPreviewOpen(false);
  }, [open, invite?.guestId, invite?.name, defaultNote]);

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const sendOnWhatsApp = () => {
    if (!invite) return;
    const text = composeWhatsAppInviteText(invite.whatsappText, customNote);
    const guestId = invite.guestId;
    onSent(guestId);
    onClose();
    showToast("Invitation sent");
    window.setTimeout(() => openWhatsAppInvite(text), 50);
  };

  const onPickPhoto = (file: File | null) => {
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    if (!file) {
      setPhotoUrl(null);
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
  };

  const letterContent: InviteLetterContent = {
    templateId: "classic",
    eventName: letterBase?.eventName || "Your event",
    guestName: guestName.trim() || "Guest",
    welcomeTitle: letterBase?.welcomeTitle || "",
    welcomeMessage: letterBase?.welcomeMessage || "",
    note: customNote,
    venueName: letterBase?.venueName || "",
    photoUrl,
  };

  return (
    <>
      <MobileSheet
        open={open && Boolean(invite)}
        onClose={onClose}
        title="Send invite"
        height="content"
        zIndexClass="z-[90]"
        headerAction="back"
        panelClassName="bg-[#fff8f5]"
      >
        {invite ? (
          <div className="space-y-4 px-4 pb-8">
            <label className="block">
              <span className="text-[13px] font-medium text-[#584141]">Guest name</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="mt-2 h-12 w-full rounded-full bg-white px-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#2c2419] outline-none"
                placeholder="Name on the letter"
              />
              <span className="mt-1.5 block text-[12px] font-medium text-[#9a8b82]">
                Auto-filled from Contacts — edit if you want.
              </span>
            </label>

            <div>
              <span className="text-[13px] font-medium text-[#584141]">Photo on the letter</span>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold"
                >
                  <Icon name="add_a_photo" className="text-[18px]" />
                  {photoUrl ? "Change photo" : "Add photo"}
                </button>
                {photoUrl ? (
                  <button
                    type="button"
                    onClick={() => onPickPhoto(null)}
                    className="text-[13px] font-semibold text-[#584141]"
                  >
                    Remove
                  </button>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onPickPhoto(event.target.files?.[0] || null)}
                />
              </div>
            </div>

            <label className="block">
              <span className="text-[13px] font-medium text-[#584141]">Customised message</span>
              <textarea
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                rows={4}
                placeholder="Add a short note for the letter…"
                className="mt-2 w-full resize-none rounded-[20px] bg-white px-4 py-3 text-[15px] font-medium leading-snug text-[#2c2419] outline-none placeholder:text-[#b5a9a4]"
              />
              <span className="mt-2 block text-[12px] font-medium leading-snug text-[#584141]">
                Shown on the letter. Your claim link is added automatically on WhatsApp.
              </span>
            </label>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-extrabold text-black"
            >
              <Icon name="mail" className="text-[18px]" />
              See letter
            </button>

            <button
              type="button"
              data-testid="contact-send-whatsapp"
              onClick={sendOnWhatsApp}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[15px] font-extrabold text-white"
            >
              <Icon name="chat" className="text-[18px]" />
              Send on WhatsApp
            </button>
          </div>
        ) : null}
      </MobileSheet>

      <LetterPreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        content={letterContent}
        title="Letter preview"
      />
    </>
  );
}
