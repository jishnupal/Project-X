import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { useAccess } from "../../hooks/useAccess";
import { PRIMARY_NAV, type AppNavItem } from "../../domain/navigation";
import { navChildActive, navItemVisible } from "../../domain/navVisibility";
import { useMemo } from "react";

const MOBILE_EXTRA = [
  { id: "profile", to: "/profile", icon: "person", label: "Profile" },
];

export function MobileBottomNav() {
  const { canAccessModule, isGuest, canManage } = useAccess();
  const location = useLocation();

  const ctx = useMemo(
    () => ({ isGuest, canManage, canAccessModule }),
    [isGuest, canManage, canAccessModule],
  );

  const items = useMemo((): Array<{
    id: string;
    to: string;
    icon: string;
    label: string;
    navItem?: AppNavItem;
  }> => {
    const main = PRIMARY_NAV.filter((item) => navItemVisible(item, ctx)).map((item) => ({
      id: item.id,
      to: item.to,
      icon: item.icon,
      label: item.shortLabel || item.label,
      navItem: item,
    }));
    return [...main, ...MOBILE_EXTRA];
  }, [ctx]);

  if (!items.length) return null;

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className={cn(
        "lg:hidden fixed bottom-0 left-0 w-full z-50",
        "mobile-bottom-nav border-t border-outline-variant",
        "shadow-[0px_-4px_20px_rgba(128,0,32,0.06)]",
      )}
    >
      <div
        className="mobile-bottom-nav-grid grid px-0.5 pt-0.5 pb-0"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const active = item.navItem
            ? navChildActive(location.pathname, item.navItem)
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={cn(
                "mobile-bottom-nav-item flex flex-col items-center justify-start gap-0.5 min-w-0 px-0.5",
                active ? "is-active text-primary" : "text-secondary",
              )}
            >
              <span
                className={cn(
                  "mobile-nav-icon-wrap flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0",
                )}
              >
                <Icon name={item.icon} className="text-[21px]" filled={active} />
              </span>
              <span className="font-label-caps text-[10px] tracking-[0.01em] leading-none text-center w-full pb-0.5">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
