import { cn } from "../../design-system/cn";

/** Default free template. Pro can unlock more ids later. */
export type InviteLetterTemplateId = "classic";

export type InviteLetterContent = {
  templateId?: InviteLetterTemplateId;
  eventName: string;
  guestName: string;
  welcomeTitle: string;
  welcomeMessage: string;
  note: string;
  venueName?: string;
  /** Optional host photo shown in the letter body. */
  photoUrl?: string | null;
};

type InviteLetterPreviewProps = {
  content: InviteLetterContent;
  className?: string;
  /** Compact card for sheets; immersive for guest dress-rehearsal. */
  size?: "full" | "sheet" | "immersive";
};

/**
 * Shared invite letter renderer — host preview and guest claim use the same template.
 */
export function InviteLetterPreview({
  content,
  className,
  size = "full",
}: InviteLetterPreviewProps) {
  const templateId = content.templateId || "classic";
  const guest = content.guestName.trim() || "Guest";
  const note = content.note.trim();
  const isSheet = size === "sheet";
  const isImmersive = size === "immersive";

  return (
    <article
      data-template={templateId}
      className={cn(
        "invite-letter relative overflow-hidden text-[#1a100c]",
        isImmersive
          ? "rounded-[32px] shadow-[0_24px_60px_rgba(26,16,12,0.18)]"
          : isSheet
            ? "rounded-[28px] shadow-[0_10px_28px_rgba(26,16,12,0.08)]"
            : "rounded-[28px] shadow-[0_16px_40px_rgba(26,16,12,0.12)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[linear-gradient(165deg,#1a100c_0%,#3d2418_42%,#6b3f2a_100%)] text-[#fff8f5]",
          isSheet ? "px-5 pb-6 pt-5" : isImmersive ? "px-6 pb-9 pt-8" : "px-6 pb-8 pt-7",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#feca43]/15 blur-2xl"
        />
        <p className="relative text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#feca43]/85">
          {content.eventName.trim() || "You're invited"}
        </p>
        <h1
          className={cn(
            "relative mt-3 font-[Playfair_Display,serif] font-semibold leading-[1.12] tracking-[-0.02em]",
            isSheet ? "text-[28px]" : isImmersive ? "text-[36px]" : "text-[32px]",
          )}
        >
          Dear {guest},
        </h1>
        <p
          className={cn(
            "relative mt-3 max-w-[20ch] font-medium leading-relaxed text-[#fff8f5]/78",
            isSheet ? "text-[14px]" : "text-[15px]",
          )}
        >
          {content.welcomeTitle.trim() || "Welcome to our celebration"}
        </p>
      </div>

      <div
        className={cn(
          "relative bg-[#fffdf8]",
          isSheet ? "px-5 py-5" : isImmersive ? "px-6 py-7" : "px-6 py-6",
        )}
      >
        {content.photoUrl ? (
          <div
            className={cn(
              "overflow-hidden bg-[#ece7e2] ring-1 ring-black/5",
              isImmersive ? "rounded-[24px]" : "rounded-[20px]",
            )}
          >
            <img
              src={content.photoUrl}
              alt=""
              className={cn(
                "w-full object-cover",
                isSheet ? "aspect-[4/3] max-h-40" : isImmersive ? "aspect-[4/3] max-h-64" : "aspect-[4/3] max-h-56",
              )}
            />
          </div>
        ) : (
          <div
            className={cn(
              "grid place-items-center border border-dashed border-[#d8cfc6] bg-[#f7f1ea] text-center text-[#9a8b82]",
              isImmersive ? "h-44 rounded-[24px] px-6" : isSheet ? "h-28 rounded-[20px] px-4" : "h-36 rounded-[20px] px-6",
            )}
          >
            <div>
              <p className="text-[13px] font-bold tracking-[-0.02em]">Your photo</p>
              <p className="mt-1 text-[12px] font-medium">Add one when you send</p>
            </div>
          </div>
        )}

        <p
          className={cn(
            "mt-6 font-medium leading-relaxed text-[#584141]",
            isSheet ? "text-[14px]" : "text-[16px]",
          )}
        >
          {content.welcomeMessage.trim() ||
            "We would love for you to celebrate with us."}
        </p>

        <div
          className={cn(
            "relative mt-6 bg-white shadow-[0_1px_0_rgba(26,16,12,0.04)]",
            isImmersive ? "rounded-[24px] px-5 py-5" : "rounded-[20px] px-4 py-4",
          )}
        >
          <div
            aria-hidden
            className="absolute -top-3 right-5 grid h-8 w-8 place-items-center rounded-full bg-[#9a5a38] text-[11px] font-extrabold text-[#fff8f5] shadow-[0_6px_14px_rgba(154,90,56,0.35)]"
          >
            ✦
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
            A note for you
          </p>
          <p
            className={cn(
              "mt-2 whitespace-pre-wrap font-[Playfair_Display,serif] font-medium leading-relaxed text-[#2c2419]",
              isSheet ? "text-[17px]" : "text-[19px]",
            )}
          >
            {note || "Your presence is our greatest gift."}
          </p>
        </div>

        {content.venueName?.trim() ? (
          <p className="mt-5 text-[13px] font-semibold tracking-wide text-[#7a6f62]">
            At {content.venueName.trim()}
          </p>
        ) : null}
      </div>
    </article>
  );
}
