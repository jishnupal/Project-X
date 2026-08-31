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
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal
      aria-labelledby="confirm-danger-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-t-[24px] sm:rounded-2xl bg-surface shadow-2xl border border-[rgba(128,0,32,0.16)] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pt-5 pb-3 flex gap-3">
          <span className="h-11 w-11 rounded-full bg-[#f3e0e4] text-primary flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-danger-title"
              className="font-headline-md text-primary text-[18px] leading-tight"
            >
              {title}
            </h2>
            <p className="text-[13px] text-secondary mt-1.5 leading-snug">{message}</p>
          </div>
        </div>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-full bg-primary text-on-primary font-button text-[13px]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
