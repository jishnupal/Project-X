import { useEffect, useRef } from "react";
import { cn } from "../../design-system/cn";
import { Icon } from "./Icon";
import type { MobileEventOption } from "./MobileEventPicker";

/** Hard cap — all events share one compact row. */
export const MAX_MOBILE_EVENTS = 6;

type MobileEventButtonsProps = {
  options: MobileEventOption[];
  value: string;
  onChange: (id: string) => void;
  onAddEvent?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
};

function splitDateLabel(label: string): { weekday: string; dayNum: string } {
  const raw = String(label || "").trim();
  const dayMatch = raw.match(/\b(\d{1,2})\b/);
  const dayNum = dayMatch?.[1] || "\u2014";
  const weekdayMatch = raw.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i);
  if (weekdayMatch) {
    return { weekday: weekdayMatch[1].slice(0, 3), dayNum };
  }
  const monMatch = raw.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
  return {
    weekday: monMatch?.[1]?.slice(0, 3) || "Day",
    dayNum,
  };
}

/**
 * Slim date capsules — reference-style (white idle / espresso selected).
 * Free-flowing rail; no clay towers, no clipping cage.
 */
export function MobileEventButtons({
  options,
  value,
  onChange,
  onAddEvent,
  onDelete,
  className,
}: MobileEventButtonsProps) {
  const capped = options.slice(0, MAX_MOBILE_EVENTS);
  const atCap = capped.length >= MAX_MOBILE_EVENTS;
  const canAdd = Boolean(onAddEvent) && !atCap;
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const node = itemRefs.current[value];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto scroll-hide",
        "pt-2 pb-3",
        "[scroll-padding-inline:16px]",
        className,
      )}
      data-testid="mobile-event-buttons"
      role="group"
      aria-label="Filter guest list by event"
    >
      {capped.map((option, index) => {
        const active = value === option.id;
        const showDelete = Boolean(option.canDelete && onDelete && active);
        const { weekday, dayNum } = splitDateLabel(option.dateLabel);

        return (
          <div
            key={option.id}
            ref={(el) => {
              itemRefs.current[option.id] = el;
            }}
            className={cn(
              "relative shrink-0 overflow-visible event-day-cap",
              active && "is-active",
            )}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {showDelete ? (
              <button
                type="button"
                aria-label={`Remove ${option.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(option.id);
                }}
                className={cn(
                  "absolute -top-1 -right-1 z-10",
                  "flex h-4 w-4 items-center justify-center rounded-full",
                  "bg-black/50 text-white",
                )}
              >
                <Icon name="close" className="text-[10px] leading-none" />
              </button>
            ) : null}
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative w-[3.35rem] min-h-[4.75rem] rounded-full",
                "inline-flex flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-center",
                "transition-[transform,background,color,box-shadow] duration-250",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a100c]/35",
                "active:scale-[0.97]",
                active
                  ? "bg-[#feca43] text-black shadow-[0_10px_22px_-12px_rgba(30,27,24,0.28)]"
                  : "bg-white text-[#1e1b18] border border-black/10 shadow-[0_8px_18px_-14px_rgba(30,27,24,0.18)]",
              )}
            >
              <span className="h-1.5 w-1.5 mb-0.5" aria-hidden />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-wide",
                  active ? "text-black/55" : "text-[#584141]",
                )}
              >
                {weekday}
              </span>
              <span className="text-[17px] font-extrabold tabular-nums leading-none tracking-[-0.03em]">
                {dayNum}
              </span>
              <span
                className={cn(
                  "text-[8px] font-bold leading-tight truncate max-w-full px-0.5",
                  active ? "text-black/60" : "text-[#584141]",
                )}
              >
                {option.name}
              </span>
            </button>
          </div>
        );
      })}

      {canAdd ? (
        <button
          type="button"
          onClick={onAddEvent}
          aria-label="New event"
          title="New event"
          className={cn(
            "shrink-0 w-[3.35rem] min-h-[4.75rem] rounded-full event-day-cap",
            "border border-dashed border-[rgba(26,16,12,0.18)]",
            "bg-white/60 text-[#7a6f62]",
            "flex flex-col items-center justify-center gap-1",
            "active:scale-95 transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a100c]/30",
          )}
          style={{ animationDelay: `${capped.length * 40}ms` }}
        >
          <Icon name="add" className="text-[20px] leading-none block" />
          <span className="text-[8px] font-bold uppercase tracking-wider">New</span>
        </button>
      ) : null}
    </div>
  );
}
