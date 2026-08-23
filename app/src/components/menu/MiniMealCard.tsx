import type { MenuCourse, MenuRow } from "../../domain/types";
import { mealCourseIcon, menuItemsArray } from "../../domain/menu";
import { miniCardStatusLabel } from "../../domain/menuDisplay";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type MiniMealCardProps = {
  row: MenuRow;
  onOpen: () => void;
};

export function MiniMealCard({ row, onOpen }: MiniMealCardProps) {
  const items = menuItemsArray(row);
  const isEmpty = items.length === 0;
  const icon = mealCourseIcon(row.course as MenuCourse);
  const isSnacks = row.course === "Evening Snacks";
  const isConfirmed = row.status === "Confirmed";
  const courseLabel = row.course === "Evening Snacks" ? "Evening Snacks" : row.course;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "mini-meal-card rounded-xl p-5 w-full text-left text-on-surface",
        "hover:-translate-y-1 transition-all cursor-pointer group shimmer-effect",
        isEmpty && isSnacks && "opacity-80 hover:opacity-100",
      )}
    >
      <div className="relative z-[2]">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h4
              className={cn(
                "font-headline-md text-lg mb-0.5",
                isEmpty && isSnacks ? "text-secondary" : "text-primary",
              )}
            >
              {courseLabel}
            </h4>
            <p
              className={cn(
                "font-label-caps text-[10px] text-secondary/70",
                isEmpty && isSnacks && "italic",
              )}
            >
              {isEmpty ? "Menu not yet finalized" : miniCardStatusLabel(row)}
            </p>
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isEmpty && isSnacks
                ? "bg-surface-container-highest"
                : "bg-primary-fixed/30",
            )}
          >
            <Icon
              name={icon}
              className={cn(isEmpty && isSnacks ? "text-secondary" : "text-primary")}
            />
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          {isEmpty && isSnacks ? (
            <span className="text-[10px] font-button text-primary font-bold flex items-center gap-1">
              PLAN NOW
              <Icon name="add" className="text-[12px]" />
            </span>
          ) : (
            <span className="font-label-caps text-[11px] text-secondary tracking-widest">
              {isConfirmed ? "Confirmed" : "Discussed"}
            </span>
          )}
          <Icon
            name="chevron_right"
            className={cn(
              "transition-opacity",
              isEmpty && isSnacks
                ? "text-secondary opacity-40"
                : "text-primary opacity-0 group-hover:opacity-100",
            )}
          />
        </div>
      </div>
    </button>
  );
}

export function AiMenuGeneratorCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 bg-primary p-4 rounded-xl flex items-center justify-between shadow-lg hover:shadow-primary/20 transition-all cursor-pointer w-full"
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
