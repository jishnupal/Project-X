import type { MenuCourse, MenuRow } from "../../domain/types";
import { isGrandMealCourse, mealCourseIcon, menuItemsArray } from "../../domain/menu";
import { miniCardStatusLabel } from "../../domain/menuDisplay";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type MiniMealCardProps = {
  row: MenuRow;
  onOpen: () => void;
  onMakeGrand?: () => void;
  swapping?: boolean;
};

export function MiniMealCard({ row, onOpen, onMakeGrand, swapping = false }: MiniMealCardProps) {
  const items = menuItemsArray(row);
  const isEmpty = items.length === 0;
  const icon = mealCourseIcon(row.course as MenuCourse);
  const isSnacks = row.course === "Evening Snacks";
  const isConfirmed = row.status === "Confirmed";
  const courseLabel = row.course === "Evening Snacks" ? "Evening Snacks" : row.course;
  const canPromote = Boolean(onMakeGrand) && isGrandMealCourse(row.course);

  return (
    <article
      className={cn(
        "mini-meal-card rounded-xl p-4 w-full text-on-surface",
        "lg:flex-1 lg:min-h-0 lg:flex lg:flex-col",
        canPromote && "mini-meal-card--grand-partner",
        swapping && "grand-mini-swap",
        isEmpty && isSnacks && "opacity-80",
      )}
    >
      <div className="relative z-[2] flex flex-col h-full">
        <div className="flex justify-between items-start gap-3">
          <button type="button" onClick={onOpen} className="min-w-0 text-left flex-1">
            <h4
              className={cn(
                "font-headline-md text-[17px] leading-[1.2] mb-1",
                isEmpty && isSnacks ? "text-secondary" : "text-primary",
              )}
            >
              {courseLabel}
            </h4>
            <p
              className={cn(
                "font-label-caps text-[10px] tracking-[0.14em] text-secondary/70",
                isEmpty && isSnacks && "italic",
              )}
            >
              {isEmpty ? "Menu not yet finalized" : miniCardStatusLabel(row)}
            </p>
          </button>
          {canPromote ? (
            <button
              type="button"
              onClick={onMakeGrand}
              aria-label={`Make ${row.course} the grand meal`}
              title="Make grand"
              className="w-6 h-6 rounded-full text-primary/55 hover:text-primary hover:bg-primary/8 flex items-center justify-center shrink-0 transition-colors"
            >
              <Icon name="swap_horiz" className="text-[14px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                isEmpty && isSnacks ? "bg-surface-container-highest" : "bg-primary-fixed/30",
              )}
            >
              <Icon
                name={icon}
                className={cn("text-[20px]", isEmpty && isSnacks ? "text-secondary" : "text-primary")}
              />
            </button>
          )}
        </div>

        <button type="button" onClick={onOpen} className="text-left flex-1 flex flex-col">
          <p className="mt-3 text-[12px] leading-[1.45] text-on-surface-variant line-clamp-2 min-h-[2.9em]">
            {isEmpty
              ? "Add dishes to lock this meal."
              : items.slice(0, 2).join(" · ")}
          </p>

          <div className="flex justify-between items-center mt-auto pt-3">
            {isEmpty && isSnacks ? (
              <span className="text-[10px] font-button text-primary font-bold flex items-center gap-1">
                Plan now
                <Icon name="add" className="text-[12px]" />
              </span>
            ) : canPromote ? (
              <span className="font-label-caps text-[10px] tracking-[0.16em] text-primary">
                Make grand
              </span>
            ) : (
              <span className="font-label-caps text-[10px] tracking-[0.16em] text-secondary">
                {isConfirmed ? "Confirmed" : "Discussed"}
              </span>
            )}
            <Icon
              name="chevron_right"
              className={cn(
                "text-[18px]",
                isEmpty && isSnacks ? "text-secondary opacity-40" : "text-primary opacity-40",
              )}
            />
          </div>
        </button>
      </div>
    </article>
  );
}

export function AiMenuGeneratorCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto bg-primary p-3 rounded-xl flex items-center justify-between shadow-lg hover:shadow-primary/20 transition-all cursor-pointer w-full shrink-0"
    >
      <div className="flex items-center gap-3">
        <Icon name="auto_awesome" className="text-tertiary-fixed text-[20px]" />
        <span className="font-label-caps text-[11px] text-white/80 tracking-widest">
          AI SMART MENU
        </span>
      </div>
      <Icon name="chevron_right" className="text-white text-[18px]" />
    </button>
  );
}
