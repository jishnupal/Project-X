import { Icon } from "../ui/Icon";

type BalanceCheckModalProps = {
  open: boolean;
  issues: string[];
  onClose: () => void;
};

export function BalanceCheckModal({ open, issues, onClose }: BalanceCheckModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="balance-modal-title"
    >
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 id="balance-modal-title" className="font-headline-md text-primary">
            Balance Check
          </h3>
          <button type="button" onClick={onClose} className="text-secondary">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {issues.length ? (
            issues.map((issue) => (
              <div
                key={issue}
                className="p-3 rounded-lg bg-error-container/30 text-on-error-container text-sm"
              >
                {issue}
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant text-sm">
              Current feast buckets have starter, beverage, vegetarian, and sweet signals visible.
            </p>
          )}
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-button text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
