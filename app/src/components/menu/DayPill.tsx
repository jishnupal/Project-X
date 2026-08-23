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
        className={cn(
          "flex flex-col items-start rounded-xl transition-colors",
          compact ? "min-w-[92px] px-3 py-1.5" : "min-w-[120px] px-4 py-2",
          isActive
            ? "bg-primary-container text-white shadow-md"
            : "border border-outline-variant bg-surface group hover:border-primary",
        )}
      >
        <span
          className={cn(
            "font-label-caps text-[10px]",
            isActive
              ? "text-on-primary-container opacity-80"
              : "text-secondary group-hover:text-primary",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "font-body-md font-bold",
            compact ? "text-xs" : "text-sm",
            isActive ? "" : "text-on-surface",
          )}
        >
          {dateLabel || "—"}
        </span>
      </button>
    </div>
  );
}
