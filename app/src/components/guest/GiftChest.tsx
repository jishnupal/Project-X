import { cn } from "../../design-system/cn";

type GiftChestProps = {
  open?: boolean;
  opening?: boolean;
  onOpen?: () => void;
  className?: string;
  /** Guest first name for seal personalization */
  guestLabel?: string;
};

/**
 * Sealed gift box — warm wood + gold seal (DESIGN.md).
 * Replaces the cartoon treasure-chest loot look.
 */
export function GiftChest({
  open = false,
  opening = false,
  onOpen,
  className,
  guestLabel,
}: GiftChestProps) {
  const seal = (guestLabel || "4U").trim().slice(0, 4).toUpperCase() || "4U";
  const classNames = cn(
    "gift-chest",
    open && "is-open",
    opening && "is-opening",
    className,
  );

  const art = (
    <>
      <span className="gift-chest__glow" aria-hidden />

      <svg
        className="gift-chest__svg"
        viewBox="0 0 280 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <ellipse cx="140" cy="218" rx="92" ry="12" fill="#1a100c" opacity="0.4" />

        {/* Box body */}
        <g className="gift-chest__body">
          <path
            d="M48 118h184c10 0 18 8 18 18v64c0 12-10 22-22 22H52c-12 0-22-10-22-22v-64c0-10 8-18 18-18z"
            fill="#8b4a24"
          />
          <path
            d="M48 118h184c10 0 18 8 18 18v22H30v-22c0-10 8-18 18-18z"
            fill="#a35a2c"
          />
          <path d="M36 152h208" stroke="#6e3818" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 178h208" stroke="#6e3818" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
          {/* Vertical ribbon */}
          <rect x="126" y="118" width="28" height="104" fill="#feca43" opacity="0.92" />
          <rect x="126" y="118" width="28" height="104" fill="url(#giRibbonShine)" opacity="0.35" />
        </g>

        {/* Lid */}
        <g className="gift-chest__lid">
          <path
            d="M44 118c0-40 32-70 96-70s96 30 96 70H44z"
            fill="#9a5530"
          />
          <path
            d="M56 118c4-30 28-52 84-52s80 22 84 52H56z"
            fill="#b86838"
          />
          <path d="M62 88h156" stroke="#6e3818" strokeWidth="2.5" strokeLinecap="round" />
          {/* Horizontal ribbon on lid */}
          <rect x="44" y="102" width="192" height="22" fill="#feca43" opacity="0.95" />
          <rect x="126" y="48" width="28" height="76" fill="#feca43" opacity="0.95" />
          {/* Bow */}
          <path
            d="M140 96c-18-18-36-14-40-4 8-2 22 4 40 16 18-12 32-18 40-16-4-10-22-14-40 4z"
            fill="#e0a820"
          />
          <circle cx="140" cy="100" r="10" fill="#feca43" stroke="#1a100c" strokeWidth="1.5" />
        </g>

        {/* Gold seal */}
        <g className="gift-chest__badge" transform="translate(140 168)">
          <circle r="28" fill="#1a100c" />
          <circle r="24" fill="#feca43" />
          <circle r="20" fill="#ffd56a" />
          <text
            y="5"
            textAnchor="middle"
            fill="#1a100c"
            fontFamily="Manrope, sans-serif"
            fontSize="11"
            fontWeight="800"
            letterSpacing="0.06em"
          >
            {seal}
          </text>
        </g>

        <defs>
          <linearGradient id="giRibbonShine" x1="126" y1="118" x2="154" y2="222" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff8f5" stopOpacity="0.5" />
            <stop offset="1" stopColor="#feca43" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </>
  );

  if (onOpen) {
    return (
      <button type="button" className={classNames} onClick={onOpen} aria-label="Open your gift">
        {art}
      </button>
    );
  }

  return <div className={classNames}>{art}</div>;
}
