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
  surface?: "hero" | "clay";
};

function cleanItems(items: string[] | undefined): string[] {
  return (items || []).map((item) => item.trim()).filter(Boolean);
}

function previewDishes(row: MenuRow, multi: boolean, max: number): string[] {
  if (!multi) return cleanItems(menuItemsArray(row)).slice(0, max);
  const grouped = categorizeMenuItems(row);
  const merged = [
    ...cleanItems(grouped.Appetizers),
    ...cleanItems(grouped["Main Course"]),
    ...cleanItems(grouped.Dessert),
    ...cleanItems(grouped["Live Counter"]),
  ];
  return merged.slice(0, max);
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
    <section className="min-w-0 flex flex-col gap-1">
      <p className="font-label-caps tracking-[0.16em] shrink-0 text-[9px] lg:text-[10px] text-white/45 mb-1.5 lg:mb-2">
        {title}
      </p>
      {visible.length ? (
        <ul className="min-w-0 space-y-1 lg:space-y-[6px]">
          {visible.map((item) => (
            <li
              key={item}
              title={item}
              className="min-w-0 truncate text-[12px] lg:text-[13px] leading-[1.4] text-white/[0.92] font-medium"
            >
              {item}
            </li>
          ))}
          {extra > 0 ? (
            <li className="font-label-caps tracking-[0.14em] text-white/40 text-[10px] pt-0.5">
              +{extra} more
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-white/35 text-[13px] leading-[1.35]">Not set</p>
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
  surface = "hero",
}: FeaturedMealCardProps) {
  const grouped = categorizeMenuItems(row);
  const items = menuItemsArray(row);
  const isConfirmed = row.status === "Confirmed";
  const multi = menuUsesMultiCategory(row.course);
  const liveItems = cleanItems(grouped["Live Counter"]);
  const icon = mealCourseIcon(row.course);
  const mobilePreview = previewDishes(row, multi, 3);
  const totalDishes = items.length;

  if (surface === "clay") {
    return (
      <article className="clay-featured-meal">
        <div className="flex items-center gap-2">
          <span className={cn("clay-featured-chip", isConfirmed && "is-ok")}>
            {isConfirmed ? <span className="d" aria-hidden /> : null}
            {isConfirmed ? "Confirmed" : "In discussion"}
          </span>
        </div>
        <button type="button" onClick={onOpen} className="mt-2 w-full text-left">
          <h3 className="m-0 text-[1.2rem] font-extrabold leading-tight tracking-[-0.02em] text-[#2c2419]">
            {dayLabel} {row.course}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold text-[#7a6f62]">
            <Icon name={icon} className="text-[15px]" />
            Grand buffet · {totalDishes} {totalDishes === 1 ? "dish" : "dishes"}
          </p>
          {mobilePreview.length ? (
            <ul className="mt-2.5 space-y-1.5 p-0">
              {mobilePreview.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[0.8rem] font-semibold leading-snug text-[#7a6f62]"
                >
                  <i className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[rgba(87,0,19,0.25)]" />
                  <span>{item}</span>
                </li>
              ))}
              {totalDishes > mobilePreview.length ? (
                <li className="pl-3 text-[0.68rem] font-semibold text-[#7a6f62]">
                  +{totalDishes - mobilePreview.length} more
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-2.5 text-[0.8rem] font-semibold text-[#7a6f62]">Tap to plan dishes</p>
          )}
          <div className="mt-2.5 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#ffb07a]">
            <span>Open full menu</span>
            <Icon name="north_east" className="text-[16px]" />
          </div>
        </button>
      </article>
    );
  }

  const cardClass = cn(
    "hero-meal-card hero-group-card rounded-[20px] lg:rounded-[28px] overflow-hidden flex flex-col h-full min-h-0",
    swapTo && `grand-hero-swap grand-hero-swap--${swapTo}`,
  );

  const switcher = (
    <div
      className="shrink-0"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <GrandMealSwitcher
        value={grandCourse}
        onChange={onGrandCourseChange}
        swapping={Boolean(swapTo)}
      />
    </div>
  );

  return (
    <article className="group w-full h-full min-h-0 relative">
      <div className={cardClass}>
        {/* Mobile — minimal */}
        <div className="relative z-[3] lg:hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2 min-w-0 shrink-0">
            <div className="min-w-0 flex-1 max-w-[58%]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 h-5 px-2 rounded-full",
                    "text-[8px] font-bold tracking-[0.14em] uppercase border",
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
                <span className="text-[10px] text-white/40 tabular-nums">
                  {items.length} {items.length === 1 ? "dish" : "dishes"}
                </span>
              </div>
              <h3 className="min-w-0 font-headline-md font-bold text-[17px] text-white leading-tight tracking-[-0.01em] line-clamp-2">
                {dayLabel} {row.course}
              </h3>
              <p className="mt-1 mb-4 text-[10px] text-white/40 flex items-center gap-1.5">
                <Icon name={icon} className="text-[14px] text-white/35 shrink-0" />
                Grand buffet
              </p>
            </div>
            {switcher}
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="relative z-[3] flex-1 min-h-0 flex flex-col px-4 pb-3 text-left"
          >
            <div className="flex flex-1 min-h-0 items-start pt-1">
              <div className="w-1/2 min-w-0 max-w-[50%] pr-2">
                {mobilePreview.length ? (
                  <ul className="space-y-1">
                    {mobilePreview.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-1.5 min-w-0 text-[10px] leading-[1.35] font-normal text-white/32"
                      >
                        <span
                          className="mt-[0.3rem] h-[3px] w-[3px] shrink-0 rounded-full bg-white/22"
                          aria-hidden
                        />
                        <span className="min-w-0 line-clamp-2">{item}</span>
                      </li>
                    ))}
                    {totalDishes > mobilePreview.length ? (
                      <li className="pt-0.5 pl-[9px] text-[9px] font-normal tabular-nums text-white/28">
                        +{totalDishes - mobilePreview.length} more
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-[10px] text-white/28 leading-snug">Tap to plan dishes</p>
                )}
              </div>
            </div>

            <div className="shrink-0 mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/35">
                View menu
              </span>
              <Icon name="north_east" className="text-[16px] text-white/45" />
            </div>
          </button>
        </div>

        {/* Desktop — full detail */}
        <div className="relative z-[3] hidden lg:flex flex-col flex-1 min-h-0">
          <div className="px-8 pt-6 pb-3 shrink-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full",
                  "text-[9px] font-bold tracking-[0.14em] uppercase border",
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
            <div className="flex items-baseline justify-between gap-3 min-w-0">
              <h3 className="font-headline-xl font-bold text-[32px] text-white leading-none tracking-[-0.02em] min-w-0 truncate">
                {dayLabel} {row.course}
              </h3>
              {switcher}
            </div>
            <p className="mt-2 text-[12px] text-white/45 flex items-center gap-1.5">
              <Icon name={icon} className="text-[15px] text-white/35" />
              Grand buffet
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="min-h-0 flex-1 overflow-hidden px-8 pb-3 text-left"
          >
            {multi ? (
              <div className="grid grid-cols-2 grid-rows-2 gap-x-10 gap-y-6 h-full">
                <MenuColumn title="Appetizers" items={grouped.Appetizers || []} max={4} />
                <MenuColumn title="Main course" items={grouped["Main Course"] || []} max={5} />
                <MenuColumn title="Dessert" items={grouped.Dessert || []} max={2} />
                <MenuColumn title="Live" items={liveItems} max={3} />
              </div>
            ) : (
              <MenuColumn title="Menu" items={items} max={6} />
            )}
          </button>

          <button
            type="button"
            onClick={onOpen}
            className="flex items-center justify-between px-8 py-3.5 border-t border-white/10 bg-black/[0.12] shrink-0 text-left"
          >
            <span className="text-[10px] font-label-caps tracking-[0.18em] uppercase text-white/40">
              Full menu
            </span>
            <span className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/70">
              Edit
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
