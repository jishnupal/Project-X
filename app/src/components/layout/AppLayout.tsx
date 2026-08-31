import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { DevApiBanner } from "./DevApiBanner";
import { InstallHint } from "./InstallHint";
import { MobileBottomNav } from "./MobileBottomNav";
import { NewEventModal } from "../menu/NewEventModal";
import { WeddingScheduleModal } from "../wedding/WeddingScheduleModal";
import { PullToRefresh } from "./PullToRefresh";
import { useWeddingState } from "../../hooks/useWeddingState";
import { cn } from "../../design-system/cn";

export function AppLayout() {
  const { toast, newEventModalOpen, setNewEventModalOpen, scheduleModalOpen, setScheduleModalOpen } =
    useWeddingState();
  const location = useLocation();
  const lockMobileViewport =
    location.pathname.startsWith("/people") || location.pathname === "/command-center";

  return (
    <div className="app-shell flex h-dvh max-h-dvh overflow-hidden bg-surface">
      <DevApiBanner />
      <AppSidebar />
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-0 bg-surface overflow-hidden",
          /* Bottom nav clearance — safe area is handled inside the nav bar */
          "max-lg:pb-[4.25rem] lg:pb-0",
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
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
      {toast ? (
        <div
          className={cn(
            "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 z-[60]",
            "bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-button shadow-lg",
          )}
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
