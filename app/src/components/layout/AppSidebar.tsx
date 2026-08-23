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
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant w-64 p-6 space-y-4 shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold text-xl">
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
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
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
        className="w-full bg-primary text-on-primary py-3 rounded-full font-button text-button flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Icon name="add" className="text-[20px]" />
        New Event
      </button>
    </aside>
  );
}
