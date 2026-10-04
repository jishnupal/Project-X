import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../ui/Icon";

type ConfirmDangerDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDangerDialog({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Keep",
  onConfirm,
  onCancel,
}: ConfirmDangerDialogProps) {
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 });

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
      className="fixed inset-x-0 z-[100] flex items-center justify-center px-4 bg-black/45 create-group-backdrop"
      style={{
        top: viewportBox.top || 0,
        height: overlayHeight,
        bottom: overlayHeight ? undefined : 0,
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
      role="dialog"
      aria-modal
      aria-labelledby="confirm-danger-title"
      onClick={onCancel}
    >
      <div
        className="create-group-panel relative w-full max-w-[360px] overflow-hidden rounded-[26px] bg-[#faf6f0] shadow-[0_24px_48px_-24px_rgba(28,20,16,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-5 pt-5 pb-3 flex gap-3">
          <span className="h-11 w-11 rounded-2xl bg-[#ffe14d] text-[#1a100c] flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-danger-title"
              className="font-extrabold tracking-[-0.02em] text-[#1a100c] text-[18px] leading-tight"
            >
              {title}
            </h2>
            <p className="text-[13px] text-[#7a6f62] font-semibold mt-1.5 leading-snug">{message}</p>
          </div>
        </div>
        <div className="relative px-5 pb-5 grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full bg-white text-[#1a100c] font-extrabold text-[13px] tracking-[-0.01em] shadow-[inset_0_0_0_1px_rgba(26,16,12,0.08)] active:scale-[0.99] transition-transform"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-full bg-[#1a100c] text-white font-extrabold text-[13px] tracking-[-0.01em] active:scale-[0.99] transition-transform"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
