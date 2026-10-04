import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { SceneIcon } from "../ui/SceneIcon";
import { cn } from "../../design-system/cn";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { homeCardPending } from "../../domain/commandCenterSummary";
import { PRIMARY_NAV, type AppNavItem } from "../../domain/navigation";
import { navChildActive, navItemVisible } from "../../domain/navVisibility";
import { useNavigateInsideEvent } from "../../navigation/eventHistory";

const MOBILE_EXTRA = [
  { id: "event", to: "/event", icon: "tune", label: "Event" },
];

export function MobileBottomNav() {
  const { canAccessModule, isGuest, isBuddy, canManage } = useAccess();
  const { state } = useWeddingState();
  const location = useLocation();
  const go = useNavigateInsideEvent();
  const pending = homeCardPending(state);

  const ctx = useMemo(
    () => ({ isGuest, isBuddy, canManage, canAccessModule }),
    [isGuest, isBuddy, canManage, canAccessModule],
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
      label: ctx.isBuddy && item.id === "buddies" ? "Tasks" : item.shortLabel || item.label,
      navItem: item,
    }));
    return [...main, ...MOBILE_EXTRA];
  }, [ctx]);

  if (!items.length) return null;

  const onBuzz = location.pathname === "/buzz";

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className={cn(
        "lg:hidden fixed z-50",
        "left-3.5 right-3.5 bottom-[max(14px,env(safe-area-inset-bottom))]",
        "h-16 rounded-[28px]",
        onBuzz
          ? "bg-[rgba(10,8,22,0.78)] border border-[rgba(90,220,255,0.22)] shadow-[0_24px_60px_rgba(8,4,20,0.5)]"
          : "bg-[rgba(255,252,248,0.82)] border border-[rgba(87,0,19,0.1)] shadow-[0_24px_60px_rgba(60,40,20,0.12)]",
        "backdrop-blur-[28px] saturate-150",
      )}
    >
      <div
        className="h-full grid px-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const active = item.navItem
            ? navChildActive(location.pathname, item.navItem)
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          const isBuzz = item.id === "buzz";
          const navBadge =
            item.id === "schedule" ? pending.days : item.id === "buddies" ? pending.buddies : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.to)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 px-0.5 min-h-11",
                onBuzz
                  ? active
                    ? "text-white"
                    : "text-[#9aa3c7]"
                  : active
                    ? "text-[#2c2419]"
                    : "text-[#7a6f62]",
              )}
            >
              <span
                className="relative flex h-8 w-8 items-center justify-center rounded-full shrink-0"
              >
                {isBuzz ? (
                  <span
                    className="absolute inset-0 rounded-full opacity-55 bg-[linear-gradient(135deg,#2ec8ff,#ff3d9a,#ff5a1f)]"
                    aria-hidden
                  />
                ) : null}
                {item.id === "schedule" ? (
                  <SceneIcon className={cn("relative h-6 w-6", isBuzz && "text-white")} />
                ) : (
                  <Icon
                    name={item.icon}
                    className={cn("text-[21px] relative", isBuzz && "text-white")}
                    filled={active || isBuzz}
                  />
                )}
                {navBadge > 0 ? (
                  <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#1e1b18] px-1 text-[9px] font-bold leading-none text-white">
                    {navBadge > 99 ? "99+" : navBadge}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold leading-none text-center w-full",
                  isBuzz && (onBuzz ? "text-[#7ee8ff] font-extrabold" : "text-[#ffb07a] font-extrabold"),
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
