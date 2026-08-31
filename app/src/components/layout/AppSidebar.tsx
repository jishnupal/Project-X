import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { PRIMARY_NAV } from "../../domain/navigation";
import { navChildActive, navItemVisible } from "../../domain/navVisibility";

export function AppSidebar() {
  const { setNewEventModalOpen } = useWeddingState();
  const { canAccessModule, isGuest, canManage } = useAccess();
  const location = useLocation();

  const ctx = useMemo(
    () => ({ isGuest, canManage, canAccessModule }),
    [isGuest, canManage, canAccessModule],
  );

  const items = useMemo(
    () => PRIMARY_NAV.filter((item) => navItemVisible(item, ctx)),
    [ctx],
  );

  if (!items.length) return null;

  return (
    <aside className="hidden lg:flex flex-col h-dvh sticky top-0 bg-surface-container-low border-r border-outline-variant w-56 xl:w-60 px-4 py-4 space-y-3 shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold text-lg">
          B
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-primary leading-none">BiyeFlow</h1>
          <p className="font-label-caps text-[10px] text-secondary tracking-widest uppercase">
            Premium Wedding OS
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = navChildActive(location.pathname, item);
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-secondary hover:bg-surface-container-high",
              )}
            >
              <Icon name={item.icon} />
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </NavLink>
          );
        })}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-2",
              isActive
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high",
            )
          }
        >
          <Icon name="person" />
          <span className="font-label-caps text-label-caps">Profile</span>
        </NavLink>
      </nav>

      {!isGuest ? (
        <button
          type="button"
          onClick={() => setNewEventModalOpen(true)}
          className="day-pill-idle relative z-[1] w-full min-h-[48px] py-2.5 px-3 rounded-xl flex items-center gap-3 hover:brightness-110 transition-[filter] border border-[rgba(243,213,138,0.45)]"
        >
          <Icon name="add" className="relative z-[1] text-[20px] text-[#f3d58a] shrink-0" />
          <span className="relative z-[1] text-white font-label-caps text-label-caps">New Event</span>
        </button>
      ) : null}
    </aside>
  );
}
