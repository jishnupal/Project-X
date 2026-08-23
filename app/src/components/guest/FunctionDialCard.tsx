import { resolveDayName, resolveFunctionDateLabel } from "../../domain/functions";
import {
  dialColor,
  dialPercentage,
  guestsByFunctionDay,
  type GuestFunctionDay,
} from "../../domain/guest";
import type { GuestRow, WeddingState } from "../../domain/types";
import { useDialAnimation } from "../../hooks/useDialAnimation";
import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";

type FunctionDialCardProps = {
  day: GuestFunctionDay;
  guests: GuestRow[];
  state: WeddingState;
  active: boolean;
  maxCount: number;
  onToggle: (day: GuestFunctionDay) => void;
  compact?: boolean;
};

export function FunctionDialCard({
  day,
  guests,
  state,
  active,
  maxCount,
  onToggle,
  compact = false,
}: FunctionDialCardProps) {
  const count = guestsByFunctionDay(guests, day);
  const pct = dialPercentage(count, maxCount);
  const circleRef = useDialAnimation(pct);
  const color = dialColor(day);
  const label = resolveDayName(state, Number(day));
  const dateLabel = resolveFunctionDateLabel(state, Number(day));
  const ringSize = compact ? "w-14 h-14" : "w-20 h-20";
  const centerText = compact ? "text-[11px]" : "text-[14px]";

  return (
    <button
      type="button"
      onClick={() => onToggle(day)}
      aria-pressed={active}
      className={cn(
        "relative p-4 md:p-6 rounded-2xl bg-white border flex items-center gap-4 md:gap-6 text-left transition-all cursor-pointer group",
        compact && "min-w-[220px] shrink-0",
        active
          ? "border-2 border-primary shadow-lg scale-[1.02] md:scale-[1.05] ring-4 md:ring-8 ring-primary/5 overflow-hidden"
          : "border-outline-variant/20 hover:border-primary/30 shadow-sm hover:shadow-md",
      )}
    >
      {active ? (
        <div className="absolute inset-0 glossy-overlay opacity-10 pointer-events-none" />
      ) : null}
      <div className={cn("relative flex items-center justify-center shrink-0", ringSize)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f1f1" strokeWidth="5" />
          <circle
            ref={circleRef}
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="5"
          />
        </svg>
        <span
          className={cn(
            "absolute font-black text-on-surface tabular-nums",
            centerText,
          )}
        >
          {count}
        </span>
      </div>
      <div className="min-w-0 flex-1 relative">
        <h4
          className={cn(
            "font-display text-sm md:text-base font-bold truncate",
            active ? "text-primary" : "text-on-surface",
          )}
        >
          {label}
        </h4>
        <p
          className={cn(
            "text-[10px] font-bold",
            active ? "text-secondary" : "text-on-surface-variant",
          )}
        >
          {dateLabel || `Day ${day}`}
        </p>
      </div>
      {active ? (
        <span className="ml-auto text-secondary relative">
          <Icon name="verified" className="text-[18px]" filled />
        </span>
      ) : null}
    </button>
  );
}
