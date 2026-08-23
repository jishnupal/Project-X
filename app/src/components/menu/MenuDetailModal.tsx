import { useEffect, useState } from "react";
import type { MenuCategories, MenuRow, WeddingState } from "../../domain/types";
import {
  MENU_CORE_CATEGORIES,
  categorizeMenuItems,
  normalizeMenuCategories,
  normalizeMenuRow,
} from "../../domain/menu";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { InlineMenuList } from "./InlineMenuList";

type MenuDetailModalProps = {
  open: boolean;
  row: MenuRow | null;
  state: WeddingState;
  dayLabel: string;
  onClose: () => void;
  onSave: (updated: MenuRow, quiet?: boolean) => void;
};

export function MenuDetailModal({
  open,
  row,
  dayLabel,
  onClose,
  onSave,
}: MenuDetailModalProps) {
  const [draft, setDraft] = useState<MenuCategories>({
    Appetizers: [],
    "Main Course": [],
    Dessert: [],
    "Live Counter": [],
  });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Discuss" | "Confirmed">("Discuss");
  const [showLiveCounter, setShowLiveCounter] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    const categories = categorizeMenuItems(row);
    setDraft(categories);
    setNotes(row.notes);
    setStatus(row.status);
    setShowLiveCounter((categories["Live Counter"] || []).some((i) => i.trim()));
  }, [open, row?.id]);

  const persist = (
    nextDraft: MenuCategories,
    nextNotes = notes,
    nextStatus = status,
    quiet = true,
  ) => {
    if (!row) return;
    const normalized = normalizeMenuCategories(nextDraft, row);
    const updated = normalizeMenuRow({
      ...row,
      categories: normalized,
      notes: nextNotes,
      status: nextStatus,
    });
    onSave(updated, quiet);
  };

  if (!open || !row) return null;

  const categoriesToShow = [
    ...MENU_CORE_CATEGORIES,
    ...(showLiveCounter ? (["Live Counter"] as const) : []),
  ];

  const toggleStatus = () => {
    const next = status === "Confirmed" ? "Discuss" : "Confirmed";
    setStatus(next);
    persist(draft, notes, next, false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/40 md:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="menu-modal-title"
    >
      <div
        className={cn(
          "bg-surface w-full flex flex-col shadow-2xl min-h-0",
          "h-[100dvh] max-h-[100dvh] md:h-auto md:max-h-[min(88dvh,640px)]",
          "md:rounded-2xl md:max-w-4xl md:w-full overflow-hidden",
        )}
      >
        <div className="px-4 py-3 md:px-5 border-b border-outline-variant flex justify-between items-center gap-3 shrink-0">
          <div className="min-w-0">
            <h3 id="menu-modal-title" className="font-headline-md text-primary text-lg truncate">
              {dayLabel} · {row.course}
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Enter = new row · Backspace on empty = remove
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleStatus}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-colors",
                status === "Confirmed"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-surface-container-low text-secondary border-outline-variant hover:border-primary/30",
              )}
            >
              {status === "Confirmed" ? "Confirmed" : "Discuss"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary hover:text-primary p-1"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 md:px-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {categoriesToShow.map((category) => (
              <section key={category} className="min-w-0">
                <h4 className="font-label-caps text-[10px] text-primary mb-1 uppercase tracking-wide">
                  {category}
                </h4>
                <InlineMenuList
                  items={draft[category] || []}
                  onChange={(next) => {
                    const nextDraft = { ...draft, [category]: next };
                    setDraft(nextDraft);
                    persist(nextDraft);
                  }}
                  variant="mini"
                  inputSize="xs"
                />
              </section>
            ))}
          </div>

          {!showLiveCounter && (
            <button
              type="button"
              onClick={() => {
                setShowLiveCounter(true);
                const nextDraft = {
                  ...draft,
                  "Live Counter": draft["Live Counter"]?.length ? draft["Live Counter"] : [],
                };
                setDraft(nextDraft);
                persist(nextDraft);
              }}
              className="mt-3 text-xs text-primary font-button"
            >
              + Live Counter
            </button>
          )}

          <label className="block text-[11px] text-secondary mt-3">
            Caterer notes
            <textarea
              className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 text-sm min-h-[56px] bg-white resize-none"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                persist(draft, e.target.value);
              }}
              placeholder="Service timing, counter plan..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
