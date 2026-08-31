import { useEffect, useState } from "react";
import { addWeddingFunction } from "../../domain/functions";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { MAX_MOBILE_EVENTS } from "../ui/MobileEventButtons";

type NewEventModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (dayId: number) => void;
};

function formatPreviewDate(value: string): string {
  if (!value) return "Date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${date.getDate()}`;
}

export function NewEventModal({ open, onClose, onCreated }: NewEventModalProps) {
  const { state, setState, showToast, onFunctionCreated } = useWeddingState();
  const [name, setName] = useState("");
  const [date, setDate] = useState(state.event.startDate || "");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDate(state.event.startDate || "");
  }, [open, state.event.startDate]);

  if (!open) return null;

  const previewName = name.trim() || "New event";
  const previewDate = formatPreviewDate(date);
  const atCap = state.functions.length >= MAX_MOBILE_EVENTS;

  const handleCreate = () => {
    if (atCap) {
      showToast(`Maximum ${MAX_MOBILE_EVENTS} events`);
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Enter an event name");
      return;
    }
    if (!date) {
      showToast("Pick an event date");
      return;
    }

    const next = addWeddingFunction(state, trimmed, date);
    const created = next.functions[next.functions.length - 1];
    setState(next);
    showToast(`${trimmed} added`);
    setName("");
    onFunctionCreated(created.id);
    onCreated?.(created.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="new-event-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[rgba(204,167,48,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hero-meal-card hero-group-card rounded-none px-5 pt-5 pb-4">
          <div className="relative z-[3] flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-label-caps text-[9px] tracking-[0.18em] text-[#f3d58a]/80">
                Wedding functions
              </p>
              <h3 id="new-event-title" className="font-headline-xl text-white text-[24px] leading-none mt-1">
                New Event
              </h3>
              <p className="text-[12px] text-white/55 mt-2">
                This joins Sangeet, Marriage & Reception in the event row.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-black/20 text-white/80 hover:text-white flex items-center justify-center"
              aria-label="Close"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>

          <div className="relative z-[3] mt-4">
            <p className="font-label-caps text-[8px] tracking-[0.16em] text-white/45 mb-2">
              Preview in the row
            </p>
            <div className="day-pill-selected inline-flex flex-col items-start rounded-xl px-4 py-2 min-w-[132px] text-white">
              <span className="relative z-[1] font-label-caps text-[10px] text-[#f3d58a] truncate max-w-[180px]">
                {previewName}
              </span>
              <span className="relative z-[1] font-body-md font-bold text-sm">{previewDate}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#faf6f0] px-5 py-4 space-y-3 border-t border-[rgba(128,0,32,0.08)]">
          <label className="block">
            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Event name</span>
            <input
              className="mt-1.5 w-full h-11 border border-[rgba(128,0,32,0.18)] rounded-xl px-3 text-sm bg-white outline-none focus:border-[#cca730]"
              placeholder="Mehendi, Aiburo Bhaat…"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Event date</span>
            <input
              type="date"
              className="mt-1.5 w-full h-11 border border-[rgba(128,0,32,0.18)] rounded-xl px-3 text-sm bg-white outline-none focus:border-[#cca730]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <div className="bg-[#faf6f0] px-5 pb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-[12px] font-label-caps tracking-[0.12em] text-secondary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={atCap}
            className="h-11 px-6 rounded-xl bg-primary text-on-primary font-headline-md text-[15px] shadow-[0_12px_24px_-10px_rgba(128,0,32,0.55)] hover:brightness-110 disabled:opacity-50"
          >
            {atCap ? `Max ${MAX_MOBILE_EVENTS}` : "Add to events"}
          </button>
        </div>
      </div>
    </div>
  );
}
