import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWeddingState } from "../../hooks/useWeddingState";
import { cn } from "../../design-system/cn";
import { SyncPopover } from "./SyncPopover";

export function SyncStatusChip({
  deviceCount = 0,
  compact = false,
}: {
  deviceCount?: number;
  compact?: boolean;
}) {
  const {
    syncCode,
    syncLive,
    syncBusy,
    lastAccountCode,
    reconnectWedding,
    syncModalOpen,
    setSyncModalOpen,
  } = useWeddingState();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  const remembered = Boolean(lastAccountCode);
  const live = Boolean(syncCode) && syncLive && navigator.onLine !== false;

  useEffect(() => {
    if (!syncModalOpen) {
      setCoords(null);
      return;
    }
    const place = () => {
      const node = anchorRef.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      setCoords({
        top: box.bottom + 10,
        right: Math.max(12, window.innerWidth - box.right),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [syncModalOpen]);

  const onActivate = () => {
    if (live) {
      setSyncModalOpen(!syncModalOpen);
      return;
    }
    if (remembered) {
      void reconnectWedding();
      return;
    }
    setSyncModalOpen(!syncModalOpen);
  };

  return (
    <div ref={anchorRef} className="relative">
      {live ? (
        <button
          type="button"
          onClick={onActivate}
          aria-expanded={syncModalOpen}
          aria-label={`${deviceCount || 1} devices connected`}
          title="Connected devices"
          className={cn(
            "flex items-center rounded-full",
            "border border-[rgba(26,127,74,0.25)] bg-[rgba(26,127,74,0.08)]",
            compact ? "gap-1 h-9 w-9 justify-center px-0" : "gap-1.5 h-8 pl-2.5 pr-3",
          )}
        >
          <span className="sync-live-dot" />
          {compact ? (
            <span className="font-label-caps text-[9px] tabular-nums text-[#1a5f4a]">
              {Math.max(1, deviceCount)}
            </span>
          ) : (
            <span className="font-label-caps text-[9px] tracking-[0.12em] uppercase text-[#1a5f4a] tabular-nums">
              {Math.max(1, deviceCount)} device{Math.max(1, deviceCount) === 1 ? "" : "s"}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onActivate}
          aria-expanded={syncModalOpen}
          aria-label={remembered ? "Log in" : "Connect devices"}
          className={cn(
            "sync-tray",
            "flex items-center rounded-full",
            "border border-outline-variant/80 bg-surface-container-high",
            "text-secondary grayscale-[0.55] opacity-80",
            "hover:opacity-100 hover:grayscale-0",
            compact ? "gap-1 h-9 w-9 justify-center px-0" : "gap-2 h-8 pl-3 pr-2.5",
          )}
        >
          <span className="sync-tray-dot" />
          {compact ? null : (
            <span className="font-label-caps text-[9px] tracking-[0.16em] uppercase leading-none">
              {remembered ? (syncBusy ? "Logging in" : "Log in") : "Connect"}
            </span>
          )}
        </button>
      )}

      {syncModalOpen && coords
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close"
                className="fixed inset-0 z-[80] cursor-default bg-transparent"
                onClick={() => setSyncModalOpen(false)}
              />
              <div
                className="fixed z-[81]"
                style={{ top: coords.top, right: coords.right }}
              >
                <SyncPopover onClose={() => setSyncModalOpen(false)} />
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
