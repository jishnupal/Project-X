import { useState } from "react";
import { addWeddingFunction } from "../../domain/functions";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";

type NewEventModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (dayId: number) => void;
};

export function NewEventModal({ open, onClose, onCreated }: NewEventModalProps) {
  const { state, setState, showToast, onFunctionCreated } = useWeddingState();
  const [name, setName] = useState("");
  const [date, setDate] = useState(state.event.startDate || "");

  if (!open) return null;

  const handleCreate = () => {
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="new-event-title"
    >
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 id="new-event-title" className="font-headline-md text-primary">
            New Event
          </h3>
          <button type="button" onClick={onClose} className="text-secondary">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Add rituals like Mehendi, Aiburo Bhaat, Bou Bhaat, or any custom function. A new date
            tab and menu board will be created.
          </p>
          <label className="block text-xs text-secondary">
            Event name
            <input
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white"
              placeholder="e.g. Mehendi, Aiburo Bhaat"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-xs text-secondary">
            Event date
            <input
              type="date"
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-outline-variant font-button text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-button text-sm"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
