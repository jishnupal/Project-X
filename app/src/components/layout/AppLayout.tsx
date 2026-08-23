import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { InstallHint } from "./InstallHint";
import { MobileBottomNav } from "./MobileBottomNav";
import { NewEventModal } from "../menu/NewEventModal";
import { useWeddingState } from "../../hooks/useWeddingState";
import { cn } from "../../design-system/cn";

export function AppLayout() {
  const { toast, newEventModalOpen, setNewEventModalOpen } = useWeddingState();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-surface pb-20 lg:pb-0">
        <AppHeader />
        <div className="p-3 sm:p-4 md:p-8 max-w-container-max mx-auto w-full flex-1 mobile-page">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <InstallHint />
      <NewEventModal
        open={newEventModalOpen}
        onClose={() => setNewEventModalOpen(false)}
      />
      {toast ? (
        <div
          className={cn(
            "fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60]",
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
