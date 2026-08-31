import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import type { WeddingScheduleHomeCopy } from "../../domain/functions";

type HomeLandingHeaderProps = {
  eventName: string;
  syncCode: string | null;
  syncLive: boolean;
  attentionCount: number;
  scheduleHome: WeddingScheduleHomeCopy;
  datesNeedSetup: boolean;
  canEdit: boolean;
  onEditDates: () => void;
};

function MetaChip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "sync" | "attention";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-[0.04em]",
        tone === "neutral" && "bg-[rgba(128,0,32,0.06)] text-secondary",
        tone === "live" && "bg-emerald-500/10 text-emerald-700",
        tone === "sync" && "bg-[rgba(204,167,48,0.14)] text-[#7a5f0a]",
        tone === "attention" && "bg-[rgba(204,167,48,0.16)] text-[#8a6f12]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function HomeLandingHeader({
  eventName,
  syncCode,
  syncLive,
  attentionCount,
  scheduleHome,
  datesNeedSetup,
  canEdit,
  onEditDates,
}: HomeLandingHeaderProps) {
  const showStatus = syncCode || attentionCount > 0;

  return (
    <header className="relative shrink-0 overflow-hidden border-b border-[rgba(128,0,32,0.08)] bg-gradient-to-br from-[#fff8f0] via-white to-[#fff8f5] px-4 py-3.5 lg:px-5 lg:py-5">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[rgba(204,167,48,0.12)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/3 h-20 w-20 rounded-full bg-[rgba(128,0,32,0.06)] blur-2xl"
        aria-hidden
      />

      <div className="relative space-y-3">
        <div>
          <p className="font-label-caps text-[8px] tracking-[0.18em] text-[#a67c00] lg:text-[9px]">
            Home
          </p>
          <h1 className="mt-0.5 line-clamp-2 font-headline-md text-[20px] leading-tight tracking-[-0.01em] text-primary lg:text-[26px]">
            {eventName || "Your wedding"}
          </h1>
          {showStatus ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {syncCode ? (
                <MetaChip tone={syncLive ? "live" : "sync"}>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      syncLive ? "bg-emerald-500" : "bg-[#cca730]",
                    )}
                    aria-hidden
                  />
                  {syncLive ? "Live" : "Syncing"}
                </MetaChip>
              ) : null}
              {attentionCount > 0 ? (
                <MetaChip tone="attention">{attentionCount} to review</MetaChip>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onEditDates}
          disabled={!canEdit}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
            datesNeedSetup
              ? "border-[rgba(204,167,48,0.35)] bg-[rgba(204,167,48,0.08)] hover:bg-[rgba(204,167,48,0.12)]"
              : "border-[rgba(128,0,32,0.1)] bg-white/70 hover:bg-white/90",
            !canEdit && "opacity-70",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/90 text-primary shadow-[0_2px_8px_-4px_rgba(128,0,32,0.15)]">
            <Icon name="calendar_month" className="text-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-label-caps text-[8px] tracking-[0.12em] text-secondary">
              {scheduleHome.label}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate font-headline-md text-[13px] leading-tight",
                datesNeedSetup ? "text-[#8a6f12]" : "text-primary",
              )}
            >
              {scheduleHome.headline}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-secondary">
              {scheduleHome.detail}
            </span>
          </span>
          {canEdit ? (
            <Icon name="chevron_right" className="shrink-0 text-[18px] text-primary/35" />
          ) : null}
        </button>
      </div>
    </header>
  );
}
