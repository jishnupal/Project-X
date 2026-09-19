import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/cn";

export type MobileSheetHeight = "content" | "tall" | "full";

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Portal stacking — guest list 70, nested edit uses 80 elsewhere */
  zIndexClass?: string;
  height?: MobileSheetHeight;
  showHandle?: boolean;
  /** Close control: X (default) or back chevron */
  headerAction?: "close" | "back";
  className?: string;
  panelClassName?: string;
  bodyClassName?: string;
  labelledBy?: string;
};

const HEIGHT_CLASS: Record<MobileSheetHeight, string> = {
  content: "max-h-[min(88dvh,640px)]",
  tall: "h-[min(92dvh,900px)] max-h-[92dvh]",
  full: "h-[100dvh] max-h-[100dvh]",
};

export function MobileSheet({
  open,
  onClose,
  title,
  children,
  zIndexClass = "z-[70]",
  height = "tall",
  showHandle = true,
  headerAction = "close",
  className,
  panelClassName,
  bodyClassName,
  labelledBy,
}: MobileSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const labelId = labelledBy || (title ? titleId : undefined);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-end justify-center p-0 bg-black/45 add-guest-backdrop",
        zIndexClass,
        className,
      )}
      role="dialog"
      aria-modal
      aria-labelledby={labelId}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          "add-guest-sheet w-full max-w-[560px] flex flex-col overflow-hidden",
          "rounded-t-[28px] bg-[#faf6f0] shadow-2xl border border-[rgba(204,167,48,0.28)] border-b-0",
          "pb-[env(safe-area-inset-bottom)]",
          HEIGHT_CLASS[height],
          panelClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {showHandle ? (
          <div className="shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-[rgba(128,0,32,0.18)]" />
          </div>
        ) : null}
        {title ? (
          <div className="shrink-0 px-3 pb-2.5 flex items-center gap-2 border-b border-[rgba(26,16,12,0.06)]">
            {headerAction === "back" ? (
              <button
                type="button"
                onClick={onClose}
                className="h-10 pl-2.5 pr-3.5 rounded-full bg-[#1a100c] text-white flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a100c]/40"
                aria-label="Back"
              >
                <span className="text-[18px] leading-none font-bold" aria-hidden>
                  ←
                </span>
                <span className="text-[13px] font-extrabold tracking-[-0.01em]">Back</span>
              </button>
            ) : null}
            <h2
              id={titleId}
              className="flex-1 min-w-0 text-[17px] font-extrabold tracking-[-0.02em] text-[#1a100c] leading-tight truncate"
            >
              {title}
            </h2>
            {headerAction === "close" ? (
              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-[#1a100c] text-white flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a100c]/40"
                aria-label="Close"
              >
                <span className="text-[18px] font-bold leading-none" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
