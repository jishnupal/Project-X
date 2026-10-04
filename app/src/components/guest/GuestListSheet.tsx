import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/cn";
import { parseCount } from "../../domain/guest";
import type { GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { useExpandableSheet } from "../ui/useExpandableSheet";

type GuestListSheetProps = {
  open: boolean;
  onClose: () => void;
  guests: GuestRow[];
  dayLabel?: string;
  title?: string;
  toolbar: ReactNode;
  children: ReactNode;
};

/** Same expandable cream sheet as groups — guest rows stay a list. */
export function GuestListSheet({
  open,
  onClose,
  guests,
  dayLabel,
  title = "Guest list",
  toolbar,
  children,
}: GuestListSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sheet = useExpandableSheet({
    open,
    onClose,
    midRatio: 0.9,
    expandedRatio: 0.98,
    initialSnap: "expanded",
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, [href], input, [tabindex]:not([tabindex='-1'])")
        ?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const people = guests.reduce((sum, row) => sum + parseCount(row.count), 0);
  const overlayHeight = sheet.viewportBox.height || undefined;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[75] flex items-end justify-center group-sheet-backdrop"
      style={{
        top: sheet.viewportBox.top || 0,
        height: overlayHeight,
        bottom: overlayHeight ? undefined : 0,
        backgroundColor: `rgba(0,0,0,${sheet.backdropOpacity.toFixed(3)})`,
      }}
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          "group-sheet-panel relative w-full max-w-[420px] overflow-hidden flex flex-col",
          "rounded-t-[28px]",
          "bg-[#fff8f5] shadow-[0_-22px_56px_-18px_rgba(87,0,19,0.4)]",
          "border border-[rgba(128,0,32,0.12)] border-b-0",
          "pb-[env(safe-area-inset-bottom)]",
          !sheet.dragging && "expandable-sheet-panel",
        )}
        style={{
          height: sheet.height || undefined,
          maxHeight: "100%",
          transition: sheet.dragging
            ? "none"
            : "height 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(120%_90%_at_8%_0%,rgba(196,90,58,0.16),transparent_65%)]"
          aria-hidden
        />

        <div
          className="relative shrink-0 flex justify-center items-center min-h-11 touch-none cursor-grab active:cursor-grabbing select-none"
          {...sheet.handleBind}
          role="button"
          tabIndex={0}
          aria-expanded={sheet.expanded}
          aria-label={sheet.expanded ? "Shrink sheet" : "Expand sheet"}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              sheet.toggleExpanded();
            }
          }}
        >
          <span
            className={cn(
              "rounded-full bg-[rgba(128,0,32,0.22)] transition-[width,height,background-color] duration-200",
              sheet.dragging ? "h-1.5 w-14 bg-[rgba(128,0,32,0.35)]" : "h-1 w-9",
            )}
            aria-hidden
          />
        </div>

        <header
          className="relative shrink-0 px-4 pb-3 flex items-start gap-2.5 border-b border-[rgba(128,0,32,0.08)] touch-none"
          {...sheet.chromeBind}
        >
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(event) => event.stopPropagation()}
            className="h-10 w-10 rounded-full border border-[rgba(128,0,32,0.12)] bg-white text-primary flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-[#7a6f62]">
              {dayLabel || "All events"}
            </p>
            <h2
              id={titleId}
              className="font-headline-md text-[#1a100c] text-[22px] leading-none truncate mt-1"
            >
              {title}
            </h2>
            <p className="text-[12px] text-[#7a6f62] font-semibold tabular-nums mt-1.5">
              {guests.length} {guests.length === 1 ? "family" : "families"} · {people} people
            </p>
          </div>
        </header>

        <div
          className="relative shrink-0 px-3.5 pt-3 pb-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {toolbar}
        </div>

        <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pb-3">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
