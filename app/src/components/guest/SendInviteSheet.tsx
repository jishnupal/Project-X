import { useEffect, useState } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import {
  composeWhatsAppInviteText,
  openWhatsAppInvite,
  type ContactInvitePayload,
} from "../../domain/contactInvite";
import { BoardingPass } from "./BoardingPass";
import type { InviteLetterContent } from "./InviteLetterPreview";

type SendInviteSheetProps = {
  open: boolean;
  invite: ContactInvitePayload | null;
  /** Optional cherry-on-top note (e.g. Buzz invitation line). */
  defaultNote?: string;
  letterBase?: Omit<InviteLetterContent, "guestName" | "note" | "photoUrl"> & {
    dateLine?: string;
    passArtUrl?: string | null;
    claimCode?: string | null;
  };
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
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    if (!open || !invite) return;
    setCustomNote(defaultNote.trim());
  }, [open, invite?.guestId, defaultNote]);

  const sendOnWhatsApp = () => {
    if (!invite) return;
    const text = composeWhatsAppInviteText(invite.whatsappText, customNote);
    const guestId = invite.guestId;
    // Sent when share sheet is invoked (browsers cannot detect WA delivery).
    onSent(guestId);
    onClose();
    showToast("Invitation sent");
    window.setTimeout(() => openWhatsAppInvite(text), 50);
  };

  const guestName = invite?.name?.trim() || "Guest";

  return (
    <MobileSheet
      open={open && Boolean(invite)}
      onClose={onClose}
      title="Send pass"
      height="content"
      zIndexClass="z-[90]"
      headerAction="back"
      panelClassName="bg-[#0c0814]"
    >
      {invite ? (
        <div className="space-y-5 px-4 pb-8">
          <BoardingPass
            phase="open"
            size="compact"
            content={{
              eventName: letterBase?.eventName || "Your event",
              guestName,
              dateLine: letterBase?.dateLine || "",
              venueName: letterBase?.venueName || "",
              claimCode: letterBase?.claimCode || invite.claimCode || null,
              backgroundUrl: letterBase?.passArtUrl || null,
            }}
          />

          <label className="block">
            <span className="text-[12px] font-semibold text-white/55">Optional note for WhatsApp</span>
            <textarea
              value={customNote}
              onChange={(event) => setCustomNote(event.target.value)}
              rows={2}
              placeholder="Short personal line…"
              className="mt-2 w-full resize-none rounded-[20px] bg-white/10 px-4 py-3 text-[14px] font-medium leading-snug text-[#fff8f5] outline-none placeholder:text-white/35"
            />
          </label>

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
  );
}
