import type { CSSProperties } from "react";
import { cn } from "../../design-system/cn";
import { useNavigateInsideEvent } from "../../navigation/eventHistory";

type HomeModuleCardProps = {
  title: string;
  line: string;
  image: string;
  pending?: number;
  to?: string;
  onOpen?: () => void;
  liftArt?: boolean;
  /** rail = flat strip (legacy); stack = coverflow slot; pin = fixed People grid */
  layout?: "rail" | "stack" | "pin";
  className?: string;
  style?: CSSProperties;
};

function pendingLabel(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function HomeLiveCard({
  title,
  line,
  image,
  pending = 0,
  to,
  onOpen,
  liftArt = false,
  layout = "rail",
  className,
  style,
}: HomeModuleCardProps) {
  const go = useNavigateInsideEvent();
  const waiting = pending > 0;
  const label = waiting ? `${title}, ${pending} pending` : title;
  const face = (
    <>
      <span className="home-module__copy">
        <span className="home-module__title">{title}</span>
        <span className="home-module__line">{line}</span>
      </span>
      <img src={image} alt="" className={liftArt ? "home-module__art home-module__art--lift" : "home-module__art"} />
    </>
  );
  const badge = waiting ? (
    <span className="home-module__badge" aria-hidden>
      {pendingLabel(pending)}
    </span>
  ) : null;

  return (
    <span
      className={cn(
        "home-module-slot",
        layout === "stack" && "home-module-slot--stack",
        layout === "pin" && "home-module-slot--pin",
        className,
      )}
      style={style}
      data-home-stack-card={layout === "stack" ? "" : undefined}
    >
      <button
        type="button"
        aria-label={label}
        className="home-module"
        onClick={() => {
          if (to) go(to);
          else onOpen?.();
        }}
      >
        {face}
      </button>
      {badge}
    </span>
  );
}
