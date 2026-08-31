import { NavLink } from "react-router-dom";
import { cn } from "../../design-system/cn";

export type SegmentedToggleItem = {
  id: string;
  label: string;
  to: string;
};

type SegmentedToggleProps = {
  items: SegmentedToggleItem[];
  className?: string;
  "aria-label"?: string;
};

/** App-level pill toggle for section switching (e.g. Guests / Menu). */
export function SegmentedToggle({ items, className, "aria-label": ariaLabel }: SegmentedToggleProps) {
  if (items.length < 2) return null;

  return (
    <div
      className={cn(
        "inline-flex gap-1 p-1 rounded-full bg-[rgba(128,0,32,0.06)] max-w-full overflow-x-auto",
        className,
      )}
      role="tablist"
      aria-label={ariaLabel || "Section"}
    >
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          role="tab"
          className={({ isActive }) =>
            cn(
              "px-4 py-2 rounded-full font-button text-[12px] whitespace-nowrap transition-colors",
              isActive ? "bg-primary text-on-primary shadow-sm" : "text-secondary hover:text-primary",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
