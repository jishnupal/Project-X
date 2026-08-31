import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { SyncStatusChip } from "./SyncStatusChip";
import { ProfileAvatarBadge } from "../access/ProfileAvatarPicker";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { PEOPLE_TABS } from "../../domain/navigation";
import { PeopleTabBar } from "../ui/PeopleTabBar";

/**
 * Mobile chrome (iOS PWA):
 * - Surface paints under the Dynamic Island (edge-to-edge)
 * - Only interactive content is inset by env(safe-area-inset-top)
 * - One dense row — no blank band, no clipped icons
 */
export function AppHeader() {
  const location = useLocation();
  const { profile, deviceCount, isGuest, canAccessModule } = useAccess();
  const { setNewEventModalOpen } = useWeddingState();

  const onPeopleRoute = location.pathname.startsWith("/people");
  const peopleTabs = PEOPLE_TABS.filter((tab) => canAccessModule(tab.module, "view"));
  const showPeopleSegments = onPeopleRoute && peopleTabs.length >= 2;

  const utilities = (
    <div className="flex items-center gap-0.5 shrink-0 self-center">
      <SyncStatusChip deviceCount={deviceCount} compact />
      <NavLink
        to="/buzz"
        aria-label="Notifications"
        data-testid="header-notifications"
        className={({ isActive }) =>
          cn(
            "relative flex h-9 w-9 items-center justify-center rounded-full shrink-0 text-secondary",
            "lg:hover:text-primary lg:hover:bg-surface-container-low lg:transition-colors",
            isActive && "text-primary bg-primary-container/40",
          )
        }
      >
        <Icon name="notifications" className="text-[20px] max-lg:text-[18px]" />
      </NavLink>
      <NavLink
        to="/profile"
        aria-label="Profile"
        data-testid="header-profile"
        className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
      >
        {profile ? (
          <ProfileAvatarBadge avatarId={profile.avatarId} size={28} />
        ) : (
          <span className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <Icon name="person" className="text-[15px]" />
          </span>
        )}
      </NavLink>
    </div>
  );

  return (
    <header
      data-testid="app-header"
      className={cn(
        "app-header-mobile w-full shrink-0 z-40 bg-surface",
        "max-lg:sticky max-lg:top-0 max-lg:border-b max-lg:border-outline-variant/70",
        "max-lg:pt-[env(safe-area-inset-top,0px)]",
        "lg:border-b lg:border-outline-variant",
      )}
    >
      {/* Desktop */}
      <div className="hidden lg:flex items-center w-full gap-3 px-margin-desktop pt-2.5 pb-2.5">
        {showPeopleSegments ? (
          <PeopleTabBar items={peopleTabs} variant="header" />
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <NavLink
              to={isGuest ? "/buzz" : "/command-center"}
              className="font-headline-md text-lg font-bold text-primary truncate"
            >
              BiyeFlow
            </NavLink>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <SyncStatusChip deviceCount={deviceCount} />
          <NavLink
            to="/buzz"
            aria-label="Notifications"
            data-testid="header-notifications"
            className={({ isActive }) =>
              cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                "text-secondary hover:text-primary hover:bg-surface-container-low transition-colors",
                isActive && "text-primary bg-primary-container/40",
              )
            }
          >
            <Icon name="notifications" className="text-[20px]" />
          </NavLink>
          <NavLink
            to="/profile"
            aria-label="Profile"
            data-testid="header-profile"
            className="rounded-full overflow-hidden shrink-0"
          >
            {profile ? (
              <ProfileAvatarBadge avatarId={profile.avatarId} size={32} />
            ) : (
              <span className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                <Icon name="person" className="text-[18px]" />
              </span>
            )}
          </NavLink>
        </div>
      </div>

      {/* Mobile: cream fills under Dynamic Island; content below safe top */}
      <div className="lg:hidden w-full bg-surface">
        <div className="flex items-center gap-2 px-2.5 min-h-10 py-0.5">
          {showPeopleSegments ? (
            <div className="min-w-0 flex-1">
              <PeopleTabBar items={peopleTabs} variant="segmented" />
            </div>
          ) : (
            <>
              <NavLink
                to={isGuest ? "/buzz" : "/command-center"}
                className="font-headline-md text-[16px] font-bold text-primary truncate tracking-[-0.01em] mr-auto"
              >
                BiyeFlow
              </NavLink>
              {!isGuest ? (
                <button
                  type="button"
                  onClick={() => setNewEventModalOpen(true)}
                  className="flex h-8 items-center gap-0.5 px-2.5 rounded-full bg-primary-container text-on-primary font-button text-[10px]"
                >
                  <Icon name="add" className="text-[16px]" />
                  Event
                </button>
              ) : null}
            </>
          )}
          {utilities}
        </div>
      </div>
    </header>
  );
}
