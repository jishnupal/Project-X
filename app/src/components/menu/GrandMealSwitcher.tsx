import type { GrandMealCourse } from "../../domain/types";
import { toggleGrandMealCourse } from "../../domain/menu";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GrandMealSwitcherProps = {
  value: GrandMealCourse;
  onChange: (course: GrandMealCourse) => void;
  swapping?: boolean;
  tone?: "hero" | "ink";
};

export function GrandMealSwitcher({
  value,
  onChange,
  swapping = false,
  tone = "hero",
}: GrandMealSwitcherProps) {
  const other = toggleGrandMealCourse(value);
  const ink = tone === "ink";

  const optionClass = (active: boolean) =>
    cn(
      "h-6 min-w-[2.75rem] px-2 rounded-full font-button text-[9px] tracking-[0.1em] uppercase leading-none",
      "transition-colors duration-200",
      ink
        ? "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a1a]/35"
        : "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
      ink
        ? active
          ? "bg-white text-[#2c2419] shadow-sm"
          : "text-[#7a6f62] hover:text-[#2c2419] active:scale-[0.98]"
        : active
          ? "bg-white/14 text-white/92"
          : "text-white/38 hover:text-white/62 active:scale-[0.98]",
    );

  return (
    <div
      role="group"
      aria-label="Switch grand meal between Lunch and Dinner"
      className={cn(
        "grand-meal-switcher inline-flex items-center gap-0.5 p-0.5 rounded-full shrink-0 select-none",
        ink
          ? "bg-[rgba(87,0,19,0.06)] border border-[rgba(87,0,19,0.1)]"
          : "bg-white/[0.06] border border-white/10",
      )}
    >
      <button
        type="button"
        aria-pressed={value === "Lunch"}
        onClick={() => {
          if (value !== "Lunch") onChange("Lunch");
        }}
        className={optionClass(value === "Lunch")}
      >
        Lunch
      </button>
      <button
        type="button"
        aria-label={`Swap to ${other}`}
        title={`Swap to ${other}`}
        onClick={() => onChange(other)}
        className={cn(
          "grand-meal-swap h-6 w-6 rounded-full flex items-center justify-center shrink-0",
          "transition-colors duration-200 active:scale-95",
          ink
            ? "text-[#7a6f62] hover:text-[#2c2419] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a1a]/35"
            : "text-white/42 hover:text-white/78 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
          swapping && "grand-meal-swap--spinning",
        )}
      >
        <Icon name="swap_horiz" className="text-[14px]" />
      </button>
      <button
        type="button"
        aria-pressed={value === "Dinner"}
        onClick={() => {
          if (value !== "Dinner") onChange("Dinner");
        }}
        className={optionClass(value === "Dinner")}
      >
        Dinner
      </button>
    </div>
  );
}
