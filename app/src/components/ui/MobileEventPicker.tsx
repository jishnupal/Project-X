import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cn } from "../../design-system/cn";

export type MobileEventOption = {
  id: string;
  name: string;
  dateLabel: string;
  canDelete?: boolean;
};

type MobileEventPickerProps = {
  options: MobileEventOption[];
  value: string;
  /** Empty string = All events (optional). Pass null to require a selection. */
  allowAll?: boolean;
  allLabel?: string;
  onChange: (id: string) => void;
  onAddEvent?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
};

/** Mobile-only event selector — one row + sheet. No horizontal pill scroll. */
export function MobileEventPicker({
  options,
  value,
  allowAll = true,
  allLabel = "All events",
  onChange,
  onAddEvent,
  onDelete,
  className,
}: MobileEventPickerProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const label = !value && allowAll ? allLabel : selected?.name || "Select event";
  const sub = !value && allowAll ? "Every function" : selected?.dateLabel || "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-testid="mobile-event-picker"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center gap-2 min-h-10 rounded-xl px-2.5",
          "border border-[rgba(128,0,32,0.14)] bg-white text-left",
          "active:scale-[0.99] transition-transform",
          className,
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary shrink-0">
          <Icon name="event" className="text-[15px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-button text-primary text-[13px] leading-tight truncate">
            {label}
          </span>
          {sub ? (
            <span className="block text-[10px] text-secondary tabular-nums truncate">{sub}</span>
          ) : null}
        </span>
        <Icon name="expand_more" className="text-[18px] text-secondary shrink-0" />
      </button>

      {open
        ? createPortal(
            <div className="lg:hidden fixed inset-0 z-[80]" role="presentation">
              <button
                type="button"
                aria-label="Close"
                className="absolute inset-0 bg-black/35"
                onClick={() => setOpen(false)}
              />
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface",
                  "border-t border-[rgba(128,0,32,0.12)]",
                  "pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgba(128,0,32,0.25)]",
                )}
              >
                <div className="flex justify-center pt-2.5 pb-1">
                  <span className="h-1 w-10 rounded-full bg-[rgba(128,0,32,0.18)]" />
                </div>
                <div className="px-4 pb-2 flex items-center justify-between gap-2">
                  <h2 id={titleId} className="font-headline-md text-primary text-[18px]">
                    Event
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-secondary"
                    aria-label="Close event picker"
                  >
                    <Icon name="close" className="text-[20px]" />
                  </button>
                </div>
                <ul className="px-3 pb-2 max-h-[min(52dvh,360px)] overflow-y-auto space-y-1">
                  {allowAll ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onChange("");
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left min-h-12",
                          !value ? "bg-[rgba(128,0,32,0.08)] text-primary" : "text-on-surface",
                        )}
                      >
                        <Icon name="apps" className="text-[20px]" />
                        <span className="flex-1 font-button text-[14px]">{allLabel}</span>
                        {!value ? <Icon name="check" className="text-[18px] text-primary" /> : null}
                      </button>
                    </li>
                  ) : null}
                  {options.map((opt) => {
                    const active = value === opt.id;
                    return (
                      <li key={opt.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onChange(opt.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex-1 flex items-center gap-3 rounded-xl px-3 py-3 text-left min-h-12",
                            active ? "bg-[rgba(128,0,32,0.08)] text-primary" : "text-on-surface",
                          )}
                        >
                          <Icon name="celebration" className="text-[20px]" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-button text-[14px] truncate">{opt.name}</span>
                            <span className="block text-[11px] text-secondary tabular-nums mt-0.5">
                              {opt.dateLabel || "—"}
                            </span>
                          </span>
                          {active ? <Icon name="check" className="text-[18px] text-primary" /> : null}
                        </button>
                        {opt.canDelete && onDelete ? (
                          <button
                            type="button"
                            aria-label={`Remove ${opt.name}`}
                            onClick={() => onDelete(opt.id)}
                            className="h-10 w-10 rounded-full flex items-center justify-center text-error shrink-0"
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {onAddEvent ? (
                  <div className="px-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onAddEvent();
                      }}
                      className="w-full h-11 rounded-full bg-primary text-on-primary font-button text-[13px] flex items-center justify-center gap-1.5"
                    >
                      <Icon name="add" className="text-[18px]" />
                      New event
                    </button>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
