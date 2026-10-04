import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { SyncStatusChip } from "./SyncStatusChip";
import { NotificationsBell } from "./NotificationsSheet";
import { HostSignOut } from "../access/HostSignOut";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { PEOPLE_TABS } from "../../domain/navigation";
import { PeopleTabBar } from "../ui/PeopleTabBar";
import { clearAccessSession } from "../../domain/access/sessionLocal";

function EventsBack({ light = false, grow = false }: { light?: boolean; grow?: boolean }) {
  return (
    <button
      type="button"
      data-testid="events-back"
      onClick={() => {
        clearAccessSession();
        window.location.assign("/dashboard");
      }}
      className={cn(
        "inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-2 text-[15px] font-semibold tracking-[-0.02em] active:scale-[0.98]",
        grow && "mr-auto",
        light ? "text-white" : "text-black",
      )}
    >
      <Icon name="arrow_back" className="text-[20px]" />
      Events
    </button>
  );
}

function BrandMark({ light = false, to }: { light?: boolean; to: string }) {
  return (
    <NavLink
      to={to}
      aria-label="BiyeFlow home"
      className={cn(
        "font-[Manrope,sans-serif] leading-none",
        light ? "text-white" : "text-black",
      )}
    >
      <p className="text-[18px] font-black tracking-[-0.06em]">B</p>
      <p className="mt-0.5 text-[9px] font-bold tracking-[0.22em]">BIYEFLOW</p>
    </NavLink>
  );
}

/**
 * Mobile chrome (iOS PWA):
 * - Surface paints under the Dynamic Island (edge-to-edge)
 * - Only interactive content is inset by env(safe-area-inset-top)
 * - One dense row — no blank band, no clipped icons
 */
export function AppHeader() {
  const location = useLocation();
  const { deviceCount, isGuest, isAdmin, canAccessModule } = useAccess();
  const { setNewEventModalOpen } = useWeddingState();

  const onPeopleRoute = location.pathname.startsWith("/people");
  const onBuzzRoute = location.pathname === "/buzz";
  const onHomeRoute = location.pathname === "/command-center";
  const immersiveMobile = onBuzzRoute;
  const clayChrome = true;
  const peopleTabs = PEOPLE_TABS.filter((tab) => canAccessModule(tab.module, "view"));
  const showPeopleSegments = onPeopleRoute && peopleTabs.length >= 2;
  const brandTo = isGuest ? "/buzz" : "/command-center";
  /** Leave-event control only on Home — elsewhere it steals chrome and dumps hosts back to the picker. */
  const showEventsBack = isAdmin && onHomeRoute;

  const utilities = (
    <div
      className={cn(
        "flex items-center gap-0.5 shrink-0 self-center max-lg:p-[3px] max-lg:rounded-full max-lg:backdrop-blur-xl max-lg:border",
        onBuzzRoute
          ? "max-lg:bg-[rgba(10,8,22,0.62)] max-lg:border-[rgba(90,220,255,0.22)]"
          : "max-lg:bg-white/70 max-lg:border-[rgba(87,0,19,0.1)]",
      )}
    >
      <SyncStatusChip deviceCount={deviceCount} compact />
      <NotificationsBell compact />
      <HostSignOut />
    </div>
  );

  return (
    <header
      data-testid="app-header"
      className={cn(
        "app-header-mobile w-full shrink-0 z-40 bg-surface",
        "max-lg:sticky max-lg:top-0",
        immersiveMobile && "max-lg:!absolute max-lg:inset-x-0 max-lg:top-0",
        clayChrome ? "max-lg:bg-transparent max-lg:border-0" : "max-lg:border-b max-lg:border-outline-variant/70",
        "max-lg:pt-[env(safe-area-inset-top,0px)]",
        "lg:border-b lg:border-outline-variant",
      )}
    >
      {/* Desktop */}
      <div className="hidden lg:flex items-center w-full gap-3 px-margin-desktop pt-2.5 pb-2.5">
        {showEventsBack ? <EventsBack /> : <BrandMark to={brandTo} />}
        {showPeopleSegments ? (
          <div className="min-w-0 flex-1">
            <PeopleTabBar items={peopleTabs} variant="header" />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <SyncStatusChip deviceCount={deviceCount} />
          <NotificationsBell />
          <HostSignOut />
        </div>
      </div>

      {/* Mobile: cream fills under Dynamic Island; content below safe top */}
      <div className={cn("lg:hidden w-full", clayChrome ? "bg-transparent" : "bg-surface")}>
        <div className="flex items-center gap-2 px-2.5 min-h-10 py-0.5">
          {showEventsBack ? (
            <EventsBack light={onBuzzRoute} grow />
          ) : (
            <BrandMark light={onBuzzRoute} to={brandTo} />
          )}
          {showPeopleSegments ? (
            <div className="min-w-0 flex-1">
              <PeopleTabBar items={peopleTabs} variant="segmented" />
            </div>
          ) : (
            <span className="mr-auto" />
          )}
          {!showPeopleSegments && !isGuest && !clayChrome ? (
            <button
              type="button"
              onClick={() => setNewEventModalOpen(true)}
              className="flex h-8 items-center gap-0.5 px-2.5 rounded-full bg-primary-container text-on-primary font-button text-[10px]"
            >
              <Icon name="add" className="text-[16px]" />
              Event
            </button>
          ) : null}
          {utilities}
        </div>
      </div>
    </header>
  );
}
