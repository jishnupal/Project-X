import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GuestMetricCardsProps = {
  stayTotal: number;
  headTotal: number;
  inviteSentTotal: number;
  familyCount: number;
  /** Compact 2×2 stage tiles for mobile People */
  variant?: "default" | "stage";
  /** Opens room mapping when Need stay is tapped (stage variant) */
  onStayClick?: () => void;
  className?: string;
};

export function GuestMetricCards({
  stayTotal,
  headTotal,
  inviteSentTotal,
  familyCount,
  variant = "default",
  onStayClick,
  className,
}: GuestMetricCardsProps) {
  const invitePct =
    familyCount > 0 ? Math.min(100, Math.round((inviteSentTotal / familyCount) * 100)) : 0;

  if (variant === "stage") {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-3.5 min-h-[5.5rem] flex flex-col justify-between shadow-[0_12px_28px_-12px_rgba(128,0,32,0.45)]">
          <div className="absolute inset-0 glossy-overlay opacity-25 pointer-events-none" />
          <div className="absolute -bottom-8 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-[9px] font-bold uppercase tracking-[0.16em] text-white/65">
            Guests
          </p>
          <p className="relative font-display text-[2rem] font-black leading-none tabular-nums">
            {headTotal}
          </p>
          <p className="relative text-[10px] text-[#f3d58a] font-semibold flex items-center gap-1">
            <Icon name="groups" className="text-[13px]" />
            Headcount
          </p>
        </div>

        {onStayClick ? (
          <button
            type="button"
            onClick={onStayClick}
            className="relative overflow-hidden rounded-2xl bg-white border border-[rgba(128,0,32,0.12)] p-3.5 min-h-[5.5rem] flex flex-col justify-between text-left shadow-[0_10px_28px_-14px_rgba(128,0,32,0.18)] active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-6 -mt-6" />
            <p className="relative text-[9px] font-bold uppercase tracking-[0.16em] text-secondary">
              Need stay
            </p>
            <p className="relative font-display text-[2rem] font-black leading-none text-primary tabular-nums">
              {stayTotal}
            </p>
            <p className="relative text-[10px] text-primary font-semibold flex items-center gap-1">
              <Icon name="hotel" className="text-[13px]" />
              Room mapping
            </p>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-white border border-[rgba(128,0,32,0.12)] p-3.5 min-h-[5.5rem] flex flex-col justify-between shadow-[0_10px_28px_-14px_rgba(128,0,32,0.18)]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-6 -mt-6" />
            <p className="relative text-[9px] font-bold uppercase tracking-[0.16em] text-secondary">
              Need stay
            </p>
            <p className="relative font-display text-[2rem] font-black leading-none text-primary tabular-nums">
              {stayTotal}
            </p>
            <p className="relative text-[10px] text-primary font-semibold flex items-center gap-1">
              <Icon name="hotel" className="text-[13px]" />
              Room mapping
            </p>
          </div>
        )}

        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-white border border-[rgba(128,0,32,0.12)] p-3.5 flex items-center gap-3 shadow-[0_10px_28px_-14px_rgba(128,0,32,0.18)]">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-secondary mb-1">
              Invites sent
            </p>
            <p className="font-display text-[1.65rem] font-black leading-none text-primary tabular-nums">
              {inviteSentTotal}
              <span className="text-base text-secondary/50 font-bold"> / {familyCount || 0}</span>
            </p>
          </div>
          <div className="w-24 shrink-0">
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${invitePct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-secondary text-right tabular-nums">{invitePct}%</p>
          </div>
        </div>
      </div>
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
