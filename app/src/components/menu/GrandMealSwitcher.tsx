import type { GrandMealCourse } from "../../domain/types";
import { toggleGrandMealCourse } from "../../domain/menu";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GrandMealSwitcherProps = {
  value: GrandMealCourse;
  onChange: (course: GrandMealCourse) => void;
  swapping?: boolean;
};

export function GrandMealSwitcher({
  value,
  onChange,
  swapping = false,
}: GrandMealSwitcherProps) {
  const other = toggleGrandMealCourse(value);

  return (
    <div
      role="group"
      aria-label="Grand meal"
      className="grand-meal-switcher inline-flex items-center gap-px shrink-0 select-none"
    >
      <button
        type="button"
        aria-pressed={value === "Lunch"}
        onClick={() => {
          if (value !== "Lunch") onChange("Lunch");
        }}
        className={cn(
          "h-5 px-1 text-[8px] font-semibold tracking-[0.2em] uppercase leading-none",
          "transition-colors duration-200",
          value === "Lunch" ? "text-white/90" : "text-white/28 hover:text-white/55",
        )}
      >
        Lunch
      </button>
      <button
        type="button"
        aria-label={`Make ${other} the grand meal`}
        title={`Make ${other} grand`}
        onClick={() => onChange(other)}
        className={cn(
          "grand-meal-swap w-5 h-5 rounded-full flex items-center justify-center",
          "text-white/40 hover:text-white hover:bg-white/10",
          "transition-colors duration-200",
          swapping && "grand-meal-swap--spinning",
        )}
      >
        <Icon name="swap_horiz" className="text-[13px]" />
      </button>
      <button
        type="button"
        aria-pressed={value === "Dinner"}
        onClick={() => {
          if (value !== "Dinner") onChange("Dinner");
        }}
        className={cn(
          "h-5 px-1 text-[8px] font-semibold tracking-[0.2em] uppercase leading-none",
          "transition-colors duration-200",
          value === "Dinner" ? "text-white/90" : "text-white/28 hover:text-white/55",
        )}
      >
        Dinner
      </button>
    </div>
  );
}
