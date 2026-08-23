import { NavLink } from "react-router-dom";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

const SIDEBAR_ITEMS = [
  { to: "/coming-soon", icon: "calendar_today", label: "Event Overview", id: "overview" },
  { to: "/menu", icon: "restaurant", label: "Catering", id: "catering" },
  { to: "/coming-soon", icon: "format_paint", label: "Decor", id: "decor" },
  { to: "/guests", icon: "group", label: "Guest List", id: "guests" },
  { to: "/coming-soon", icon: "schedule", label: "Timeline", id: "timeline" },
];

export function AppSidebar() {
  const { setNewEventModalOpen } = useWeddingState();

  return (
    <aside className="hidden lg:flex flex-col h-dvh sticky top-0 bg-surface-container-low border-r border-outline-variant w-56 xl:w-60 px-4 py-4 space-y-3 shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold text-lg">
          B
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-primary leading-none">
            BiyeFlow
          </h1>
          <p className="font-label-caps text-[10px] text-secondary tracking-widest uppercase">
            Premium Wedding OS
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-secondary hover:bg-surface-container-high",
              )
            }
          >
            <Icon name={item.icon} />
            <span className="font-label-caps text-label-caps">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setNewEventModalOpen(true)}
        className="day-pill-idle relative z-[1] w-full min-h-[48px] py-2.5 px-3 rounded-xl flex items-center gap-3 hover:brightness-110 transition-[filter] border border-[rgba(243,213,138,0.45)]"
      >
        <Icon name="add" className="relative z-[1] text-[20px] text-[#f3d58a] shrink-0" />
        <span className="relative z-[1] text-white font-label-caps text-label-caps">
          New Event
        </span>
      </button>
    </aside>
  );
}
