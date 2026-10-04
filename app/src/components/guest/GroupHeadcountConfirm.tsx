import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parseCount, suggestGroupHeadcount } from "../../domain/guest";
import type { GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GroupHeadcountConfirmProps = {
  row: GuestRow;
  groupName: string;
  /** When adjusting an existing assignment, start from current groupCount. */
  initialPeople?: number;
  confirmLabel?: string;
  onConfirm: (people: number) => void;
  onCancel: () => void;
};

export function GroupHeadcountConfirm({
  row,
  groupName,
  initialPeople,
  confirmLabel,
  onConfirm,
  onCancel,
}: GroupHeadcountConfirmProps) {
  const total = Math.max(1, parseCount(row.count));
  const seed =
    initialPeople != null
      ? Math.min(total, Math.max(1, initialPeople))
      : suggestGroupHeadcount(row);
  const [people, setPeople] = useState(seed);
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const next =
      initialPeople != null
        ? Math.min(total, Math.max(1, initialPeople))
        : suggestGroupHeadcount(row);
    setPeople(next);
  }, [row, initialPeople, total]);

  useEffect(() => {
    const syncViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        setViewportBox({ top: 0, height: window.innerHeight });
        return;
      }
      setViewportBox({ top: viewport.offsetTop, height: viewport.height });
    };
    syncViewport();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    return () => {
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const overlayHeight = viewportBox.height || undefined;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[100] flex items-center justify-center px-4 bg-black/50 create-group-backdrop"
      style={{
        top: viewportBox.top || 0,
        height: overlayHeight,
        bottom: overlayHeight ? undefined : 0,
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal
      aria-labelledby="group-headcount-title"
      onClick={onCancel}
    >
      <div
        className={cn(
          "create-group-panel relative w-full max-w-[360px] overflow-hidden rounded-[26px]",
          "bg-[#fff8f5] border border-[rgba(128,0,32,0.12)]",
          "shadow-[0_28px_64px_-28px_rgba(87,0,19,0.45)]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(120%_90%_at_12%_0%,rgba(196,90,58,0.14),transparent_62%)]"
          aria-hidden
        />
        <div className="relative px-5 pt-5 pb-3">
          <p className="font-label-caps text-[9px] tracking-[0.16em] text-[#7a6f62]">
            {groupName}
          </p>
          <h2
            id="group-headcount-title"
            className="font-headline-md text-[#1a100c] text-[20px] mt-1 truncate"
          >
            {row.name || "Guest not set"}
          </h2>
          <p className="text-[12px] text-[#7a6f62] font-semibold mt-2 leading-snug">
            How many from this family join the group? Event invites stay as you set them.
          </p>
        </div>

        <div className="relative px-5 pb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={people <= 1}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
            className={cn(
              "h-12 w-12 rounded-full border border-[rgba(128,0,32,0.14)] bg-white flex items-center justify-center",
              "text-primary disabled:opacity-30 active:scale-95 transition-transform",
            )}
            aria-label="Fewer people"
          >
            <Icon name="remove" className="text-[20px]" />
          </button>
          <div className="text-center min-w-[96px]">
            <p className="font-headline-md text-[#1a100c] text-[34px] tabular-nums leading-none">
              {people}
            </p>
            <p className="text-[11px] text-[#7a6f62] font-semibold mt-1.5 tabular-nums">
              of {total}
            </p>
          </div>
          <button
            type="button"
            disabled={people >= total}
            onClick={() => setPeople((n) => Math.min(total, n + 1))}
            className={cn(
              "h-12 w-12 rounded-full border border-[rgba(128,0,32,0.14)] bg-white flex items-center justify-center",
              "text-primary disabled:opacity-30 active:scale-95 transition-transform",
            )}
            aria-label="More people"
          >
            <Icon name="add" className="text-[20px]" />
          </button>
        </div>

        <div className="relative px-5 pb-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-[rgba(128,0,32,0.14)] bg-white text-primary font-button text-[13px] active:scale-[0.99] transition-transform"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(people)}
            className="h-11 rounded-full bg-primary text-on-primary font-button text-[13px] shadow-[0_12px_24px_-14px_rgba(128,0,32,0.55)] active:scale-[0.99] transition-transform"
          >
            {confirmLabel || `Add ${people}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
