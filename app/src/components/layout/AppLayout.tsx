import { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { DevApiBanner } from "./DevApiBanner";
import { InstallHint } from "./InstallHint";
import { MobileBottomNav } from "./MobileBottomNav";
import { NewEventModal } from "../menu/NewEventModal";
import { WeddingScheduleModal } from "../wedding/WeddingScheduleModal";
import { PullToRefresh } from "./PullToRefresh";
import { useWeddingState } from "../../hooks/useWeddingState";
import { setThemeColor } from "../../pwa/viewport";
import { cn } from "../../design-system/cn";
import { SHEET_QUERY, useSheetHistory } from "../../navigation/eventHistory";

export function AppLayout() {
  const { newEventModalOpen, setNewEventModalOpen, scheduleModalOpen, setScheduleModalOpen, setScheduleFocusId } =
    useWeddingState();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [datesOpen, setDatesOpen] = useSheetHistory("dates");
  const activeSheet = searchParams.get(SHEET_QUERY);
  const nestedDates = Boolean(scheduleModalOpen && activeSheet && activeSheet !== "dates");
  const onPeopleRoute = location.pathname.startsWith("/people");
  const onHomeRoute = location.pathname === "/command-center";
  const onSceneRoute = location.pathname === "/people/guests" || location.pathname.startsWith("/people/guests/");
  const onProfileRoute = location.pathname === "/profile";
  const onEventRoute = location.pathname === "/event";
  const onBuzzRoute = location.pathname === "/buzz";
  const onBuddiesRoute = location.pathname === "/buddies";
  const onClayModuleRoute = onBuzzRoute || onBuddiesRoute || onProfileRoute || onEventRoute;
  const claySurface = true;
  const lockMobileViewport = onPeopleRoute || onHomeRoute || onClayModuleRoute;
  const immersiveMobile = onBuzzRoute;

  useEffect(() => {
    setThemeColor(onBuzzRoute ? "#16081f" : "#fff8f5");
  }, [onBuzzRoute]);

  // Open Dates into history when requested from Home (not when nested over Plot/Invites).
  useEffect(() => {
    if (!scheduleModalOpen || nestedDates || datesOpen) return;
    setDatesOpen(true);
  }, [scheduleModalOpen, nestedDates, datesOpen, setDatesOpen]);

  // Swipe-back closed the dates sheet — clear wedding-state flag.
  useEffect(() => {
    if (datesOpen || !scheduleModalOpen || nestedDates) return;
    setScheduleModalOpen(false);
    setScheduleFocusId(null);
  }, [datesOpen, scheduleModalOpen, nestedDates, setScheduleModalOpen, setScheduleFocusId]);

  return (
    <div className={cn(
      "app-shell flex h-dvh max-h-dvh overflow-hidden bg-surface",
      claySurface && !immersiveMobile && !onHomeRoute && !onProfileRoute && !onBuddiesRoute && !onSceneRoute && "max-lg:people-bg-warm",
      (onHomeRoute || onProfileRoute || onEventRoute || onBuddiesRoute || onSceneRoute) && "home-ivory",
      onBuzzRoute && "buzz-night-bg",
    )}>
      <DevApiBanner />
      <AppSidebar />
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-0 bg-surface overflow-hidden",
          claySurface && "max-lg:bg-transparent",
          /* Bottom nav clearance — safe area is handled inside the nav bar */
          immersiveMobile ? "max-lg:pb-0" : "max-lg:pb-[4.25rem]",
          "lg:pb-0",
        )}
      >
        <AppHeader />
        <PullToRefresh>
          <div
            className={cn(
              "w-full flex-1 min-h-0 mobile-page",
              "max-lg:max-w-none max-lg:mx-0",
              "lg:max-w-container-max lg:mx-auto lg:p-4",
              lockMobileViewport
                ? "max-lg:overflow-hidden max-lg:flex max-lg:flex-col max-lg:p-0 lg:overflow-y-auto"
                : "overflow-y-auto overscroll-contain max-lg:px-3 max-lg:pt-2 max-lg:pb-2 sm:p-4",
            )}
          >
            <Outlet />
          </div>
        </PullToRefresh>
      </main>
      <MobileBottomNav />
      <InstallHint />
      <NewEventModal
        open={newEventModalOpen}
        onClose={() => setNewEventModalOpen(false)}
      />
      <WeddingScheduleModal
        open={datesOpen || nestedDates}
        onClose={() => {
          if (datesOpen) setDatesOpen(false);
          setScheduleModalOpen(false);
          setScheduleFocusId(null);
        }}
      />
    </div>
  );
}
