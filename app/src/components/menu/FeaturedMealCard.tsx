import type { GrandMealCourse, MenuRow } from "../../domain/types";
import {
  categorizeMenuItems,
  mealCourseIcon,
  menuItemsArray,
  menuUsesMultiCategory,
} from "../../domain/menu";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { GrandMealSwitcher } from "./GrandMealSwitcher";

type FeaturedMealCardProps = {
  row: MenuRow;
  dayLabel: string;
  onOpen: () => void;
  grandCourse: GrandMealCourse;
  onGrandCourseChange: (course: GrandMealCourse) => void;
  swapTo?: GrandMealCourse | null;
};

function cleanItems(items: string[] | undefined): string[] {
  return (items || []).map((item) => item.trim()).filter(Boolean);
}

function MenuColumn({
  title,
  items,
  max = 6,
}: {
  title: string;
  items: string[];
  max?: number;
}) {
  const filled = cleanItems(items);
  const visible = filled.slice(0, max);
  const extra = Math.max(0, filled.length - visible.length);

  return (
    <section className="min-w-0 min-h-0 flex flex-col">
      <p className="font-label-caps text-[10px] tracking-[0.18em] text-white/45 mb-2">
        {title}
      </p>
      {visible.length ? (
        <ul className="space-y-[6px]">
          {visible.map((item) => (
            <li
              key={item}
              className="text-[13px] leading-[1.4] text-white/[0.92] font-medium tracking-[0.01em]"
            >
              {item}
            </li>
          ))}
          {extra > 0 ? (
            <li className="pt-0.5 text-[10px] font-label-caps tracking-[0.14em] text-white/40">
              +{extra} more
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-[13px] leading-[1.35] text-white/35">Not set</p>
      )}
    </section>
  );
}

export function FeaturedMealCard({
  row,
  dayLabel,
  onOpen,
  grandCourse,
  onGrandCourseChange,
  swapTo = null,
}: FeaturedMealCardProps) {
  const grouped = categorizeMenuItems(row);
  const items = menuItemsArray(row);
  const isConfirmed = row.status === "Confirmed";
  const multi = menuUsesMultiCategory(row.course);
  const liveItems = cleanItems(grouped["Live Counter"]);
  const icon = mealCourseIcon(row.course);

  return (
    <article className="group w-full h-full min-h-0 relative">
      <div
        className={cn(
          "hero-meal-card hero-group-card rounded-[24px] lg:rounded-[28px] overflow-hidden flex flex-col h-full",
          "min-h-[240px]",
          swapTo && `grand-hero-swap grand-hero-swap--${swapTo}`,
        )}
      >
        <div className="px-6 pt-5 lg:px-8 lg:pt-6 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full",
                "text-[9px] font-bold tracking-[0.16em] uppercase border",
                isConfirmed
                  ? "bg-white/10 text-white border-white/15"
                  : "bg-white/5 text-white/75 border-white/10",
              )}
            >
              {isConfirmed ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : null}
              {isConfirmed ? "Confirmed" : "In discussion"}
            </span>
            <span className="text-[11px] text-white/40 tabular-nums">
              {items.length} {items.length === 1 ? "dish" : "dishes"}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4 min-w-0">
            <h3 className="font-headline-xl text-[28px] lg:text-[32px] text-white leading-none tracking-[-0.02em] min-w-0 truncate">
              {dayLabel} {row.course}
            </h3>
            <GrandMealSwitcher
              value={grandCourse}
              onChange={onGrandCourseChange}
              swapping={Boolean(swapTo)}
            />
          </div>
          <p className="mt-2 text-[12px] text-white/45 flex items-center gap-1.5">
            <Icon name={icon} className="text-[15px] text-white/35" />
            Grand buffet
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-h-0 px-6 lg:px-8 pb-3 text-left"
        >
          {multi ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-x-10 gap-y-6 h-full">
              <MenuColumn title="Appetizers" items={grouped.Appetizers || []} max={5} />
              <MenuColumn title="Main course" items={grouped["Main Course"] || []} max={7} />
              <MenuColumn title="Dessert" items={grouped.Dessert || []} max={3} />
              <MenuColumn title="Live" items={liveItems} max={5} />
            </div>
          ) : (
            <MenuColumn title="Menu" items={items} max={10} />
          )}
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="flex items-center justify-between px-6 lg:px-8 py-3.5 border-t border-white/10 bg-black/[0.12] shrink-0 text-left"
        >
          <span className="text-[10px] font-label-caps tracking-[0.18em] uppercase text-white/40">
            Full menu
          </span>
          <span className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/70">
            Edit
          </span>
        </button>
      </div>
    </article>
  );
}
