import { cn } from "../../design-system/cn";

export type InviteReceiptContent = {
  eventName: string;
  guestName: string;
  dateLine?: string;
  venueName?: string;
  claimCode?: string | null;
};

type InviteReceiptProps = {
  content: InviteReceiptContent;
  className?: string;
  /** Play the long slot dispense (~7.5s) */
  dispensing?: boolean;
};

/**
 * VVIP clearance receipt — slowly prints from a ticket slot after pass scan.
 */
export function InviteReceipt({ content, className, dispensing = false }: InviteReceiptProps) {
  const guest = content.guestName.trim() || "Guest";
  const eventName = content.eventName.trim() || "Event";
  const code = (content.claimCode || "").trim().toUpperCase() || "VVIP";
  const dateLine = (content.dateLine || "").trim();
  const venue = (content.venueName || "").trim();
  const meta = [dateLine, venue].filter(Boolean).join(" · ");

  return (
    <div
      className={cn("invite-receipt", dispensing && "is-dispensing", className)}
      data-testid="invite-receipt"
    >
      <div className="invite-receipt__slot" aria-hidden>
        <span className="invite-receipt__slot-shade" />
        <span className="invite-receipt__slot-lip" />
      </div>

      <div className="invite-receipt__gate">
        <article className="invite-receipt__paper">
          <p className="invite-receipt__eyebrow">VVIP</p>
          <h2 className="invite-receipt__header">You&apos;re on the list</h2>

          <div className="invite-receipt__stars" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="invite-receipt__star" />
            ))}
          </div>

          <p className="invite-receipt__event">{eventName}</p>
          <p className="invite-receipt__guest">{guest}</p>

          {meta ? <p className="invite-receipt__meta">{meta}</p> : null}

          <div className="invite-receipt__rule" aria-hidden />

          <div className="invite-receipt__barcode" aria-hidden>
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.25,
                  opacity: 0.85 + ((i * 7) % 15) / 100,
                }}
              />
            ))}
          </div>
          <p className="invite-receipt__code">{code}</p>

          <p className="invite-receipt__foot">Keep this for the door</p>
        </article>
      </div>
    </div>
  );
}
