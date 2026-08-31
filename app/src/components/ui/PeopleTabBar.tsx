import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";
import { cn } from "../../design-system/cn";

export type PeopleTabItem = {
  id: string;
  label: string;
  icon: string;
  to: string;
};

type PeopleTabBarProps = {
  items: PeopleTabItem[];
  className?: string;
  /** Header: desktop-style underline in AppHeader. Segmented: full-width mobile control. Inline: legacy. */
  variant?: "header" | "segmented" | "inline";
};

/** People sub-modules (Guests, Menu). */
export function PeopleTabBar({ items, className, variant = "inline" }: PeopleTabBarProps) {
  if (items.length < 2) return null;

  if (variant === "segmented") {
    return (
      <nav
        className={cn("w-full shrink-0", className)}
        aria-label="People sections"
        data-testid="people-tabs-mobile"
      >
        <div
          className="grid gap-0.5 p-0.5 rounded-[10px] bg-[rgba(128,0,32,0.07)]"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          role="tablist"
        >
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              role="tab"
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center gap-1 min-h-9 rounded-lg px-1",
                  "font-button text-[12px] transition-colors",
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-secondary active:bg-white/80",
                )
              }
            >
              <Icon name={item.icon} className="text-[15px]" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  const isHeader = variant === "header";

  return (
    <nav
      className={cn(
        "shrink-0",
        isHeader
          ? "min-w-0 flex-1"
          : "w-full border-b border-outline-variant bg-surface -mx-3 sm:-mx-4 lg:-mx-4 px-3 sm:px-4 lg:px-4",
        className,
      )}
      aria-label="People sections"
    >
      <div
        className={cn(
          "flex gap-0.5 sm:gap-1 overflow-x-auto scroll-hide",
          isHeader ? "min-w-0" : "max-w-container-max mx-auto",
        )}
        role="tablist"
      >
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            role="tab"
            className={({ isActive }) =>
              cn(
                "relative inline-flex items-center gap-1 sm:gap-1.5 shrink-0",
                isHeader
                  ? "min-h-8 px-2 sm:px-3 py-1 text-[11px] sm:text-[13px]"
                  : "min-h-11 px-4 py-2.5 text-[13px]",
                "font-button whitespace-nowrap border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary hover:text-primary",
              )
            }
          >
            <Icon name={item.icon} className={cn(isHeader ? "text-[17px] sm:text-[18px]" : "text-[18px]")} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
