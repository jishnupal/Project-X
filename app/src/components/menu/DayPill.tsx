import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";

type DayPillProps = {
  isActive: boolean;
  name: string;
  dateLabel: string;
  canDelete: boolean;
  isRemoving: boolean;
  compact?: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

export function DayPill({
  isActive,
  name,
  dateLabel,
  canDelete,
  isRemoving,
  compact = false,
  onSelect,
  onDelete,
}: DayPillProps) {
  const showDelete = canDelete && isActive;

  return (
    <div className={cn("relative shrink-0", isRemoving && "day-pill-removing")}>
      {showDelete && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className={cn(
            "absolute -top-1.5 -right-1.5 z-10",
            "flex h-4 w-4 items-center justify-center rounded-full",
            "bg-error text-white shadow-sm",
            "transition-transform hover:scale-110 active:scale-95",
            "day-pill-delete-icon",
          )}
        >
          <Icon name="close" className="text-[10px] leading-none" />
        </button>
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isActive}
        className={cn(
          "relative inline-flex items-center justify-between gap-3 rounded-xl overflow-hidden text-white transition-[box-shadow,transform]",
          compact ? "h-11 min-w-[148px] px-4" : "h-12 min-w-[168px] px-5",
          isActive ? "day-pill-selected" : "day-pill-idle hover:brightness-110",
        )}
      >
        <span
          className={cn(
            "relative z-[1] font-headline-md text-white whitespace-nowrap leading-none",
            compact ? "text-[15px]" : "text-[16px]",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "relative z-[1] font-label-caps tracking-[0.06em] text-[#f3d58a] tabular-nums whitespace-nowrap leading-none",
            compact ? "text-[11px]" : "text-[12px]",
          )}
        >
          {dateLabel || "—"}
        </span>
      </button>
    </div>
  );
}
