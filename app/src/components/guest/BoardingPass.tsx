import { cn } from "../../design-system/cn";

export type BoardingPassContent = {
  eventName: string;
  guestName: string;
  dateLine?: string;
  venueName?: string;
  claimCode?: string | null;
  /** Host custom background; falls back to default gradient art */
  backgroundUrl?: string | null;
};

export type BoardingPassPhase =
  | "arrive"
  | "poster"
  | "spin"
  | "scanning"
  | "blasting"
  | "open"
  | "stamped";

type BoardingPassProps = {
  content: BoardingPassContent;
  className?: string;
  /** arrive = flying in; spin = idle tumble; scanning/blasting = unlock; open = details */
  phase?: BoardingPassPhase;
  /** compact = send sheet; hero = invite landing */
  size?: "default" | "compact" | "hero";
  onOpenPass?: () => void;
  /** Stamp copy when phase is stamped (club door) */
  stampLabel?: string;
};

function splitEventTitle(name: string): [string, string] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    const raw = (words[0] || "EVENT").toUpperCase();
    if (raw.length <= 5) return [raw, ""];
    const mid = Math.ceil(raw.length / 2);
    return [raw.slice(0, mid), raw.slice(mid)];
  }
  const mid = Math.ceil(words.length / 2);
  return [
    words.slice(0, mid).join(" ").toUpperCase(),
    words.slice(mid).join(" ").toUpperCase(),
  ];
}

/**
 * Reference-faithful boarding pass — grain, notches, vertical barcode, type-as-hero.
 */
export function BoardingPass({
  content,
  className,
  phase = "poster",
  size = "default",
  onOpenPass,
  stampLabel = "You're in",
}: BoardingPassProps) {
  const eventName = content.eventName.trim() || "Event";
  const guest = content.guestName.trim() || "Guest";
  const code = (content.claimCode || "").trim().toUpperCase() || "640509";
  const opened = phase === "open" || phase === "stamped";
  const stamped = phase === "stamped";
  /** Keep barcode strip visible while scanning / settled */
  const showBarcode =
    opened ||
    phase === "spin" ||
    phase === "scanning" ||
    phase === "blasting";
  const interactive = Boolean(onOpenPass) && (phase === "spin" || phase === "poster");
  const [lineA, lineB] = splitEventTitle(eventName);
  const dateShort = (content.dateLine || "").trim() || "—";
  const cabin = content.venueName?.trim() || "GUEST";
  const stampText = stampLabel.trim() || "You're in";

  return (
    <div
      className={cn(
        "boarding-pass",
        size === "compact" && "boarding-pass--compact",
        size === "hero" && "boarding-pass--hero",
        phase === "arrive" && "boarding-pass--arrive",
        phase === "poster" && "boarding-pass--poster",
        phase === "spin" && "boarding-pass--spin",
        phase === "scanning" && "boarding-pass--scanning",
        phase === "blasting" && "boarding-pass--blasting",
        opened && "boarding-pass--open",
        stamped && "boarding-pass--stamped",
        className,
      )}
      data-testid="boarding-pass"
      data-phase={phase}
    >
      <button
        type="button"
        className="boarding-pass__face"
        onClick={onOpenPass}
        disabled={!interactive}
        aria-label={
          opened
            ? `${eventName} pass`
            : phase === "spin"
              ? `Unlock pass for ${guest}`
              : `Open pass for ${guest}`
        }
      >
        <span
          className="boarding-pass__art"
          style={
            content.backgroundUrl
              ? { backgroundImage: `url(${content.backgroundUrl})` }
              : undefined
          }
          aria-hidden
        />
        <span className="boarding-pass__topo" aria-hidden />
        <span className="boarding-pass__shine" aria-hidden />
        <span className="boarding-pass__grain" aria-hidden />
        <span className="boarding-pass__scallop boarding-pass__scallop--top" aria-hidden />
        <span className="boarding-pass__scallop boarding-pass__scallop--bottom" aria-hidden />
        <span className="boarding-pass__notch boarding-pass__notch--left" aria-hidden />
        <span className="boarding-pass__notch boarding-pass__notch--right" aria-hidden />
        <span className="boarding-pass__scan" aria-hidden />
        <span className="boarding-pass__flash" aria-hidden />

        <span className="boarding-pass__tag">X3A</span>

        <span className="boarding-pass__vbar" aria-hidden>
          <span className="boarding-pass__vbar-lines">
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} style={{ height: `${10 + ((i * 7) % 18)}px`, width: i % 4 === 0 ? 2.5 : 1.25 }} />
            ))}
          </span>
          <span className="boarding-pass__vbar-meta">
            <span>{code}</span>
            <span>CHECK-IN</span>
          </span>
        </span>

        <span className="boarding-pass__mid">
          <span className="boarding-pass__id">{code.slice(0, 6)}</span>
          <span className="boarding-pass__title">
            <span className="boarding-pass__title-line">{lineA}</span>
            {lineB ? <span className="boarding-pass__title-line">{lineB}</span> : null}
          </span>
          <span className="boarding-pass__boarding">BOARDING PASS*</span>
        </span>

        <span className={cn("boarding-pass__footer", showBarcode && "is-visible")}>
          <span className="boarding-pass__meta">
            <span className="boarding-pass__field">
              <span className="boarding-pass__label">Date</span>
              <span className="boarding-pass__value">{dateShort}</span>
            </span>
            <span className="boarding-pass__field">
              <span className="boarding-pass__label">Passenger</span>
              <span className="boarding-pass__value">{guest}</span>
            </span>
            <span className="boarding-pass__field">
              <span className="boarding-pass__label">Cabin</span>
              <span className="boarding-pass__value">{cabin}</span>
            </span>
          </span>
          <span className="boarding-pass__hbar" aria-hidden>
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i} style={{ width: i % 5 === 0 ? 2.8 : i % 3 === 0 ? 1.8 : 1.15 }} />
            ))}
          </span>
        </span>

        {stamped ? (
          <span className="boarding-pass__stamp" aria-hidden>
            {stampText}
          </span>
        ) : null}
      </button>
    </div>
  );
}
