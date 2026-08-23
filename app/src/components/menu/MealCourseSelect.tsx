import type { MenuCourse } from "../../domain/types";
import { MENU_COURSES } from "../../domain/menu";
import { cn } from "../../design-system/cn";

type MealCourseSelectProps = {
  value: MenuCourse;
  onChange: (course: MenuCourse) => void;
  className?: string;
  compact?: boolean;
};

export function MealCourseSelect({
  value,
  onChange,
  className,
  compact = false,
}: MealCourseSelectProps) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as MenuCourse)}
      className={cn(
        "border border-outline-variant rounded-lg bg-white text-on-surface font-button",
        compact ? "text-[10px] px-2 py-1" : "text-xs px-2 py-1.5",
        className,
      )}
      aria-label="Meal type"
    >
      {MENU_COURSES.map((course) => (
        <option key={course} value={course}>
          {course === "Evening Snacks" ? "Snacks" : course}
        </option>
      ))}
    </select>
  );
}
