import { useEffect, useId, useRef, useState } from "react";
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
import { MobileSheet } from "../ui/MobileSheet";
import { cn } from "../../design-system/cn";

type WeddingScheduleModalProps = {
  open: boolean;
  onClose: () => void;
};

function functionGlyph(id: number): string {
  if (id === 1) return "music_note";
  if (id === 2) return "favorite";
  if (id === 3) return "celebration";
  return "event";
}

function DateField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const inputId = useId();
  return (
    <label htmlFor={inputId} className="wedding-dates-field">
      <span className="sr-only">{label}</span>
      <input
        id={inputId}
        type="date"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="wedding-dates-field__input"
      />
      <span className="wedding-dates-field__face" aria-hidden>
        <Icon name="calendar_month" className="text-[18px] text-[#c45a2a]" />
        <span>{formatFunctionDateFull(value)}</span>
        <Icon name="expand_more" className="ml-auto text-[18px] text-[#7a6f62]" />
      </span>
    </label>
  );
}

export function WeddingScheduleModal({ open, onClose }: WeddingScheduleModalProps) {
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

  const first = functions[0];
  const last = functions[functions.length - 1];
  const rangeLabel =
    first?.date && last?.date
      ? `${formatFunctionDateFull(first.date)} → ${formatFunctionDateFull(last.date)}`
      : "Pick the week of celebrations";

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Wedding dates"
      height="tall"
      zIndexClass="z-[85]"
      panelClassName="bg-[#fff8f5] wedding-dates-sheet"
      bodyClassName="overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="wedding-dates-hero shrink-0 mx-4 mb-3">
          <p className="font-label-caps text-[9px] tracking-[0.14em] text-[#9a5a38]">
            Week of celebrations
          </p>
          <p className="mt-1 font-headline-md text-[1.35rem] leading-tight text-[#2c2419]">
            Set your dates
          </p>
          <p className="mt-1.5 text-[12px] font-semibold leading-snug text-[#7a6f62]">
            {rangeLabel}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-3">
          <section className="wedding-dates-start">
            <p className="font-label-caps text-[9px] tracking-[0.14em] text-[#9a5a38] mb-2">
              Celebrations begin
            </p>
            <p className="text-[13px] font-extrabold text-[#2c2419] mb-2">
              {first?.name || "Sangeet"} sets the week
            </p>
            <DateField
              label="Celebrations begin"
              value={startDate}
              disabled={!canEdit}
              onChange={handleStartChange}
            />
          </section>

          <p className="font-label-caps text-[9px] tracking-[0.14em] text-[#9a5a38] mt-5 mb-2">
            Functions
          </p>
          <ol className="wedding-dates-timeline">
            {functions.map((fn, index) => (
              <li key={fn.id} className="wedding-dates-step">
                <span className="wedding-dates-step__rail" aria-hidden>
                  <span className="wedding-dates-step__dot">
                    <Icon name={functionGlyph(fn.id)} className="text-[14px]" />
                  </span>
                  {index < functions.length - 1 ? <i /> : null}
                </span>
                <div className="wedding-dates-step__card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-headline-md text-[16px] leading-tight text-[#2c2419]">
                        {fn.name || resolveDayName(state, fn.id)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#7a6f62]">
                        Day {index + 1}
                        {fn.id === 1 ? " · week starts here" : ""}
                      </p>
                    </div>
                    {fn.custom ? (
                      <span className="shrink-0 rounded-full bg-[rgba(196,90,42,0.1)] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[#9a5a38]">
                        Custom
                      </span>
                    ) : null}
                  </div>
                  <DateField
                    label={`${fn.name || "Function"} date`}
                    value={fn.date}
                    disabled={!canEdit}
                    onChange={(next) => handleFunctionDateChange(fn.id, next)}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="shrink-0 flex items-center gap-3 border-t border-[rgba(87,0,19,0.08)] bg-[#fff8f5] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full text-[13px] font-extrabold text-[#7a6f62] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit}
            className={cn(
              "h-11 flex-[1.4] rounded-full bg-[#1a100c] text-white text-[13px] font-extrabold",
              "shadow-[0_10px_22px_-10px_rgba(26,16,12,0.55)] active:scale-[0.98]",
              "disabled:opacity-45",
            )}
          >
            Save dates
          </button>
        </div>
      </div>
    </MobileSheet>
  );
}
