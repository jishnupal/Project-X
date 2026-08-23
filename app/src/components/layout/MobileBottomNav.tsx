import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

const MOBILE_NAV = [
  { to: "/coming-soon", icon: "home", label: "Home", pill: false },
  { to: "/menu", icon: "restaurant_menu", label: "Menu", pill: true },
  { to: "/guests", icon: "group", label: "Guests", pill: false },
  { to: "/coming-soon", icon: "menu", label: "More", pill: false },
];

export function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 bg-surface shadow-[0px_-4px_20px_rgba(128,0,32,0.06)] border-t border-outline-variant">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center",
              item.pill
                ? isActive
                  ? "bg-primary-container text-on-primary-container rounded-full px-6 py-2"
                  : "text-secondary px-3 py-1"
                : "text-secondary py-1 px-3",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} />
              <span
                className={cn(
                  "font-label-caps text-[10px]",
                  item.pill && isActive ? "mt-0.5" : "mt-1",
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
