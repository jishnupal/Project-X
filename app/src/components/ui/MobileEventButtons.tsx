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

/**
 * Single-row event strip. Idle = light; selected = maroon + gold sheen.
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
  const n = Math.max(capped.length, 1);
  const atCap = capped.length >= MAX_MOBILE_EVENTS;
  const canAdd = Boolean(onAddEvent) && !atCap;

  const nameClass =
    n <= 2 ? "text-[12px]" : n === 3 ? "text-[11px]" : n === 4 ? "text-[10px]" : "text-[9px]";
  const dateClass = n <= 3 ? "text-[8px]" : "text-[7px]";

  return (
    <div
      className={cn("flex items-stretch gap-1", className)}
      data-testid="mobile-event-buttons"
    >
      <div className="flex flex-1 min-w-0 gap-1">
        {capped.map((option) => {
          const active = value === option.id;
          const showDelete = Boolean(option.canDelete && onDelete && active);

          return (
            <div key={option.id} className="relative flex-1 min-w-0">
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
                    "flex h-3.5 w-3.5 items-center justify-center rounded-full",
                    "bg-error text-white shadow-sm",
                  )}
                >
                  <Icon name="close" className="text-[9px] leading-none" />
                </button>
              ) : null}
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(option.id)}
                className={cn(
                  "relative w-full h-9 rounded-[10px] overflow-hidden",
                  "inline-flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-center",
                  "active:scale-[0.98] transition-[transform,background,box-shadow,color] duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d58a]/70",
                  active ? "day-pill-selected text-white" : "event-btn-idle",
                )}
              >
                <span
                  className={cn(
                    "relative z-[1] font-headline-md leading-none truncate w-full text-center",
                    nameClass,
                    active ? "text-white" : "text-primary",
                  )}
                >
                  {option.name}
                </span>
                <span
                  className={cn(
                    "relative z-[1] font-label-caps tracking-[0.04em] tabular-nums leading-none truncate w-full text-center",
                    dateClass,
                    active ? "text-[#f3d58a]" : "text-secondary",
                  )}
                >
                  {option.dateLabel || "—"}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={onAddEvent}
          aria-label="New event"
          title="New event"
          className={cn(
            "shrink-0 h-9 w-9 rounded-[10px]",
            "border border-dashed border-[rgba(128,0,32,0.22)] bg-[#fff8f5] text-primary",
            "flex items-center justify-center",
            "active:scale-95 transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <Icon name="add" className="text-[18px]" />
        </button>
      ) : null}
    </div>
  );
}
