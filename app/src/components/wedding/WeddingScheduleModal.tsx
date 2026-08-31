import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  applyWeddingSchedule,
  buildFunctionScheduleDraft,
  formatFunctionDateFull,
  proposeCoreDatesForStart,
  resolveDayName,
  type FunctionScheduleDraft,
} from "../../domain/functions";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type WeddingScheduleModalProps = {
  open: boolean;
  onClose: () => void;
};

export function WeddingScheduleModal({ open, onClose }: WeddingScheduleModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { state, saveState, showToast } = useWeddingState();
  const { canEdit } = useAccess();

  const [startDate, setStartDate] = useState(state.event.startDate || "");
  const [functions, setFunctions] = useState<FunctionScheduleDraft[]>(() =>
    buildFunctionScheduleDraft(state),
  );
  const previousStartRef = useRef(state.event.startDate || "");

  useEffect(() => {
    if (!open) return;
    const draft = buildFunctionScheduleDraft(state);
    setStartDate(state.event.startDate || "");
    setFunctions(draft);
    previousStartRef.current = state.event.startDate || "";
  }, [open, state]);

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
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleStartChange = (value: string) => {
    setStartDate(value);
    setFunctions((current) =>
      proposeCoreDatesForStart(current, previousStartRef.current, value),
    );
    previousStartRef.current = value;
  };

  const handleFunctionDateChange = (id: number, date: string) => {
    setFunctions((current) => current.map((fn) => (fn.id === id ? { ...fn, date } : fn)));
    if (id === 1) {
      setStartDate(date);
      previousStartRef.current = date;
    }
  };

  const handleSave = () => {
    if (!canEdit) {
      showToast("You don't have permission to edit dates");
      return;
    }
    if (!startDate.trim()) {
      showToast("Pick when celebrations begin");
      return;
    }
    const missing = functions.find((fn) => !fn.date?.trim());
    if (missing) {
      showToast(`Set a date for ${missing.name}`);
      return;
    }
    const next = applyWeddingSchedule(state, startDate, functions);
    saveState(next);
    showToast("Wedding dates saved");
    onClose();
  };

  return createPortal(
    <div
      className="menu-sheet-backdrop fixed inset-0 z-[85] flex items-end justify-center bg-black/40 md:items-center md:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className={cn(
          "menu-sheet-panel w-full max-w-md overflow-hidden rounded-t-[24px] md:rounded-2xl",
          "border border-[rgba(204,167,48,0.28)] shadow-2xl",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hero-meal-card hero-group-card rounded-none px-5 pt-5 pb-4">
          <div className="relative z-[3] flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-label-caps text-[9px] tracking-[0.18em] text-[#f3d58a]/80">
                Wedding schedule
              </p>
              <h2 id={titleId} className="mt-1 font-headline-md text-[22px] leading-tight text-white">
                Set your dates
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-white/55">
                Pick when celebrations begin, then adjust each function.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 hover:text-white"
              aria-label="Close"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(58dvh,520px)] overflow-y-auto overscroll-contain bg-[#faf6f0] px-5 py-4 space-y-4 border-t border-[rgba(128,0,32,0.08)]">
          <label className="block">
            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
              Celebrations begin (Sangeet day)
            </span>
            <input
              type="date"
              disabled={!canEdit}
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[rgba(128,0,32,0.18)] bg-white px-3 text-sm text-primary outline-none focus:border-[#cca730] disabled:opacity-60"
            />
          </label>

          <div className="space-y-2">
            <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Functions</p>
            {functions.map((fn) => (
              <div
                key={fn.id}
                className="rounded-xl border border-[rgba(128,0,32,0.1)] bg-white p-3 shadow-[0_6px_18px_-14px_rgba(128,0,32,0.12)]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-headline-md text-[15px] text-primary leading-tight">
                      {fn.name || resolveDayName(state, fn.id)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-secondary">
                      {formatFunctionDateFull(fn.date)}
                    </p>
                  </div>
                  {fn.custom ? (
                    <span className="shrink-0 rounded-full bg-[rgba(128,0,32,0.06)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-secondary">
                      Custom
                    </span>
                  ) : null}
                </div>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={fn.date}
                  onChange={(e) => handleFunctionDateChange(fn.id, e.target.value)}
                  className="h-10 w-full rounded-lg border border-[rgba(128,0,32,0.14)] bg-[#fff8f5] px-3 text-sm text-primary outline-none focus:border-[#cca730] disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[rgba(128,0,32,0.08)] bg-[#faf6f0] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-[12px] font-label-caps tracking-[0.12em] text-secondary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit}
            className="h-11 px-6 rounded-xl bg-primary text-on-primary font-headline-md text-[15px] shadow-[0_12px_24px_-10px_rgba(128,0,32,0.55)] hover:brightness-110 disabled:opacity-45"
          >
            Save dates
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
