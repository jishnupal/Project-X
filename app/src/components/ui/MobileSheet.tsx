import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/cn";
import { Icon } from "./Icon";

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
  className?: string;
  panelClassName?: string;
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
  className,
  panelClassName,
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
          <div className="shrink-0 px-4 pb-2 flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="font-headline-md text-primary text-[20px] leading-tight truncate"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-[rgba(128,0,32,0.14)] bg-white text-primary flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Close"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>
        ) : null}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
