import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GuestMetricCardsProps = {
  stayTotal: number;
  headTotal: number;
  inviteSentTotal: number;
  familyCount: number;
  /** Soft hero strip for mobile People (reference layout) */
  variant?: "default" | "stage";
  /** Opens room mapping when Need stay is tapped (desktop / unused on stage) */
  onStayClick?: () => void;
  /** Opens the headcount actions beside the Scene character */
  onOpen?: () => void;
  className?: string;
};

export function GuestMetricCards({
  stayTotal,
  headTotal,
  inviteSentTotal,
  familyCount,
  variant = "default",
  onOpen,
  className,
}: GuestMetricCardsProps) {
  const invitePct =
    familyCount > 0 ? Math.min(100, Math.round((inviteSentTotal / familyCount) * 100)) : 0;

  if (variant === "stage") {
    const families = familyCount || 0;
    return (
      <header className={cn("scene-keeper", className)}>
        <button
          type="button"
          className="scene-keeper__card"
          onClick={onOpen}
          aria-label={`Headcount, ${headTotal} ${headTotal === 1 ? "person" : "people"}, ${families} ${families === 1 ? "family" : "families"}`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-[#584141]">Headcount</span>
            <Icon name="north_east" className="text-[16px] text-black/45" />
          </span>
          <span className="mt-2.5 block text-[52px] font-extrabold leading-none tracking-[-0.045em] text-black tabular-nums">
            {headTotal}
          </span>
          <span className="mt-2.5 block text-[15px] font-semibold leading-snug text-[#584141]">
            {headTotal === 1 ? "1 person" : `${headTotal} people`}
            <span className="text-black/25"> · </span>
            {families === 1 ? "1 family" : `${families} families`}
          </span>
        </button>
        <div className="scene-keeper__figure">
          <div className="scene-keeper__sway">
            <img src="/home/scene-keeper.png" alt="" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8", className)}>
      <div className="relative group h-36 md:h-44 rounded-3xl bg-white border border-outline-variant/30 premium-card-shadow overflow-hidden p-5 md:p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 blur-2xl" />
        <div>
          <p className="text-on-surface-variant font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-1">
            Need Stay
          </p>
          <h3 className="font-display text-4xl md:text-5xl font-black text-primary leading-none">
            {stayTotal}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-primary font-bold text-[11px] md:text-[12px]">
          <Icon name="hotel" className="text-[16px]" />
          <span>Accommodation pending</span>
        </div>
      </div>

      <div className="relative group h-36 md:h-44 rounded-3xl bg-primary text-white premium-card-shadow overflow-hidden p-5 md:p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
        <div className="absolute inset-0 glossy-overlay opacity-30 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-white/60 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-1">
            Total Confirmed
          </p>
          <h3 className="font-display text-5xl md:text-6xl font-black text-white leading-none text-glow">
            {headTotal}
          </h3>
        </div>
        <div className="relative flex items-center gap-1 text-secondary-container font-bold text-[11px] md:text-[12px]">
          <Icon name="stars" className="text-[16px]" filled />
          <span className="uppercase">Guest headcount</span>
        </div>
      </div>

      <div className="relative group h-36 md:h-44 rounded-3xl bg-white border border-outline-variant/30 premium-card-shadow overflow-hidden p-5 md:p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-10 -mt-10 blur-2xl" />
        <div>
          <p className="text-on-surface-variant font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-1">
            Invites Sent
          </p>
          <h3 className="font-display text-4xl md:text-5xl font-black text-primary leading-none">
            {inviteSentTotal}{" "}
            <span className="text-xl md:text-2xl text-on-surface-variant/40 font-bold">
              / {familyCount || 0}
            </span>
          </h3>
        </div>
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${invitePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
