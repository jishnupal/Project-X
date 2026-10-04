import { useWeddingState } from "../../hooks/useWeddingState";
import { cn } from "../../design-system/cn";

/** Quiet sync status — live indicator only (no shareable join code). */
export function SyncStatusChip({
  compact = false,
}: {
  deviceCount?: number;
  compact?: boolean;
}) {
  const { syncCode, syncLive, syncBusy, lastAccountCode, reconnectWedding } = useWeddingState();

  const remembered = Boolean(lastAccountCode);
  const live = Boolean(syncCode) && syncLive && navigator.onLine !== false;

  if (live) {
    return (
      <div
        aria-label="Live"
        title="Live"
        className={cn(
          "flex items-center rounded-full pointer-events-none",
          "border border-[rgba(26,127,74,0.22)] bg-[rgba(26,127,74,0.08)]",
          compact ? "h-9 w-9 justify-center" : "gap-1.5 h-8 pl-2.5 pr-3",
        )}
      >
        <span className="sync-live-dot" />
        {compact ? null : (
          <span className="font-label-caps text-[9px] tracking-[0.14em] uppercase text-[#1a5f4a]">
            Live
          </span>
        )}
      </div>
    );
  }

  if (!remembered) return null;

  return (
    <button
      type="button"
      onClick={() => void reconnectWedding()}
      aria-label={syncBusy ? "Reconnecting" : "Reconnect"}
      className={cn(
        "sync-tray",
        "flex items-center rounded-full",
        "border border-outline-variant/80 bg-surface-container-high",
        "text-secondary grayscale-[0.55] opacity-80",
        "hover:opacity-100 hover:grayscale-0",
        compact ? "h-9 w-9 justify-center" : "gap-2 h-8 pl-3 pr-2.5",
      )}
    >
      <span className="sync-tray-dot" />
      {compact ? null : (
        <span className="font-label-caps text-[9px] tracking-[0.16em] uppercase leading-none">
          {syncBusy ? "…" : "Reconnect"}
        </span>
      )}
    </button>
  );
}
