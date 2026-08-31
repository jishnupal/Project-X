import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])")
        ?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/40 menu-sheet-backdrop md:p-4"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          "menu-sheet-panel w-full flex flex-col min-h-0 overflow-hidden",
          "bg-[#fff8f5] shadow-[0_-18px_48px_-16px_rgba(87,0,19,0.32)]",
          "max-md:max-w-[480px] max-md:h-[min(88dvh,720px)] max-md:max-h-[88dvh]",
          "max-md:rounded-t-[24px] max-md:border max-md:border-[rgba(128,0,32,0.14)] max-md:border-b-0",
          "max-md:pb-[env(safe-area-inset-bottom)]",
          "md:rounded-2xl md:max-w-4xl md:w-full md:max-h-[min(88dvh,640px)] md:border md:border-outline-variant md:shadow-2xl md:bg-surface",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="md:hidden shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[rgba(128,0,32,0.18)]" />
        </div>

        <div className="px-4 py-2.5 md:px-5 md:py-3 border-b border-[rgba(128,0,32,0.08)] md:border-outline-variant flex justify-between items-center gap-3 shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h3 id={titleId} className="font-headline-md text-primary text-[17px] md:text-lg truncate">
              {dayLabel} · {row.course}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleStatus}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                status === "Confirmed"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-white text-secondary border-[rgba(128,0,32,0.14)]",
              )}
            >
              {status === "Confirmed" ? "Confirmed" : "Discuss"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-[rgba(128,0,32,0.14)] bg-white text-primary flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Close"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 md:px-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full max-w-full">
            {categoriesToShow.map((category) => (
              <section key={category} className="min-w-0 max-w-full overflow-hidden">
                <h4 className="font-label-caps text-[10px] text-primary mb-1.5 uppercase tracking-wide">
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
              className="mt-4 text-xs text-primary font-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
            >
              + Live Counter
            </button>
          )}

          <label className="block text-[11px] text-secondary mt-4 max-w-full">
            Caterer notes
            <textarea
              className="mt-1.5 w-full max-w-full border border-[rgba(128,0,32,0.12)] rounded-xl px-3 py-2.5 text-sm min-h-[64px] bg-white resize-none box-border outline-none focus:border-primary/35"
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
    </div>,
    document.body,
  );
}
