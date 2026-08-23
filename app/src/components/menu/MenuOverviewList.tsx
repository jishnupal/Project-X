import { cn } from "../../design-system/cn";

type MenuOverviewListProps = {
  items: string[];
  variant?: "featured" | "featured-live" | "mini";
  maxItems?: number;
  bulletClassName?: string;
};

export function MenuOverviewList({
  items,
  variant = "mini",
  maxItems,
  bulletClassName,
}: MenuOverviewListProps) {
  const filled = items.map((item) => item.trim()).filter(Boolean);
  const visible = maxItems ? filled.slice(0, maxItems) : filled;
  const hiddenCount = maxItems ? Math.max(0, filled.length - maxItems) : 0;
  const isFeatured = variant === "featured" || variant === "featured-live";
  const isLive = variant === "featured-live";

  if (!filled.length) {
    return (
      <p
        className={cn(
          "text-xs italic",
          isFeatured ? "text-white/50" : "text-secondary",
        )}
      >
        No items yet
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1", isFeatured ? "space-y-1.5" : "space-y-1")}>
      {visible.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-2",
            isLive && "bg-tertiary-container/10 rounded-lg px-2 py-1",
          )}
        >
          <span
            className={cn(
              "rounded-full shrink-0 mt-1.5",
              isFeatured
                ? isLive
                  ? "w-1.5 h-1.5 bg-tertiary-fixed/60"
                  : "w-1.5 h-1.5 bg-white/40"
                : "w-1 h-1 bg-primary/30",
              bulletClassName,
            )}
          />
          <span
            className={cn(
              "leading-snug",
              isFeatured ? "text-white/90 text-xs" : "text-on-surface text-xs",
              isLive && "font-medium",
            )}
          >
            {item}
          </span>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li
          className={cn(
            "text-[10px] font-label-caps pl-3.5",
            isFeatured ? "text-white/50" : "text-secondary",
          )}
        >
          +{hiddenCount} more
        </li>
      )}
    </ul>
  );
}
