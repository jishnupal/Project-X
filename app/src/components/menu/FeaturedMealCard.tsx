import type { MenuRow } from "../../domain/types";
import {
  categorizeMenuItems,
  mealCourseIcon,
  menuItemsArray,
  menuUsesMultiCategory,
} from "../../domain/menu";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type FeaturedMealCardProps = {
  row: MenuRow;
  dayLabel: string;
  onOpen: () => void;
};

function formatItemLine(items: string[]): string {
  const filled = items.map((i) => i.trim()).filter(Boolean);
  return filled.length ? filled.join(", ") : "Not set yet";
}

export function FeaturedMealCard({ row, dayLabel, onOpen }: FeaturedMealCardProps) {
  const grouped = categorizeMenuItems(row);
  const items = menuItemsArray(row);
  const isConfirmed = row.status === "Confirmed";
  const multi = menuUsesMultiCategory(row.course);
  const liveItems = grouped["Live Counter"] || [];
  const icon = mealCourseIcon(row.course);

  const dessertLine = [
    formatItemLine(grouped.Dessert || []),
    liveItems.length
      ? `Live: ${formatItemLine(liveItems)}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left relative h-full"
    >
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-primary/20 blur-2xl rounded-[40px] pointer-events-none hidden lg:block" />
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[95%] h-full bg-white/40 blur-sm rounded-[32px] -z-10 pointer-events-none hidden lg:block" />

      <div
        className={cn(
          "hero-meal-card rounded-[24px] lg:rounded-[32px] overflow-hidden flex flex-col",
          "transition-transform duration-300 group-hover:-translate-y-1",
          "min-h-[240px] lg:min-h-[420px]",
        )}
      >
        <div className="p-5 sm:p-6 md:p-8 lg:p-10 flex-1 relative z-[2] text-white">
          <div className="flex justify-between items-start mb-6 md:mb-8 gap-4">
            <div className="min-w-0">
              <span
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border mb-3",
                  isConfirmed
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-white/80 border-white/10",
                )}
              >
                {isConfirmed && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
                {isConfirmed ? "Confirmed" : "In Discussion"}
              </span>
              <h3 className="font-headline-xl text-2xl md:text-4xl text-white leading-none mb-2">
                {dayLabel} {row.course}
              </h3>
              <p className="font-body-md text-white/80 text-sm md:text-base">
                Grand Buffet · {items.length} Signature Item{items.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg rotate-3 shrink-0">
              <Icon name={icon} className="text-[28px] md:text-[32px]" />
            </div>
          </div>

          {multi ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-2">
                <span className="font-label-caps text-[11px] text-white/60 tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-white/30" />
                  Appetizers
                </span>
                <p className="font-body-md text-white font-medium leading-relaxed text-sm md:text-base">
                  {formatItemLine(grouped.Appetizers || [])}
                </p>
              </div>
              <div className="space-y-2">
                <span className="font-label-caps text-[11px] text-white/60 tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-white/30" />
                  Main Course
                </span>
                <p className="font-body-md text-white font-medium leading-relaxed text-sm md:text-base">
                  {formatItemLine(grouped["Main Course"] || [])}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <span className="font-label-caps text-[11px] text-white/60 tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-white/30" />
                  Desserts & Live
                </span>
                <p className="font-body-md text-white font-medium leading-relaxed text-sm md:text-base">
                  {dessertLine || "Not set yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="font-label-caps text-[11px] text-white/60 tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-white/30" />
                Menu
              </span>
              <p className="font-body-md text-white font-medium leading-relaxed text-sm md:text-base">
                {formatItemLine(items)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/10 p-4 border-t border-white/10 relative z-[2] mx-4 mb-4 rounded-xl">
          <p className="text-[10px] font-label-caps text-white/50 tracking-widest uppercase">
            Tap to edit full menu
          </p>
        </div>
      </div>
    </button>
  );
}
