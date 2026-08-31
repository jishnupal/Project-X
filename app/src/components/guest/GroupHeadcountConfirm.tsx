import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { parseCount, suggestGroupHeadcount } from "../../domain/guest";
import type { GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GroupHeadcountConfirmProps = {
  row: GuestRow;
  groupName: string;
  /** When adjusting an existing assignment, start from current groupCount. */
  initialPeople?: number;
  confirmLabel?: string;
  onConfirm: (people: number) => void;
  onCancel: () => void;
};

export function GroupHeadcountConfirm({
  row,
  groupName,
  initialPeople,
  confirmLabel,
  onConfirm,
  onCancel,
}: GroupHeadcountConfirmProps) {
  const total = Math.max(1, parseCount(row.count));
  const seed =
    initialPeople != null
      ? Math.min(total, Math.max(1, initialPeople))
      : suggestGroupHeadcount(row);
  const [people, setPeople] = useState(seed);

  useEffect(() => {
    const next =
      initialPeople != null
        ? Math.min(total, Math.max(1, initialPeople))
        : suggestGroupHeadcount(row);
    setPeople(next);
  }, [row, initialPeople, total]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55"
      role="dialog"
      aria-modal
      aria-labelledby="group-headcount-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-t-[24px] sm:rounded-2xl bg-surface shadow-2xl border border-[rgba(128,0,32,0.16)] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3">
          <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">
            {groupName}
          </p>
          <h2
            id="group-headcount-title"
            className="font-headline-md text-primary text-[18px] mt-1 truncate"
          >
            {row.name || "Guest not set"}
          </h2>
          <p className="text-[12px] text-secondary mt-1.5 leading-snug">
            How many from this family join the group? Event invites stay as you set them.
          </p>
        </div>

        <div className="px-4 pb-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={people <= 1}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
            className={cn(
              "h-11 w-11 rounded-full border border-[rgba(128,0,32,0.18)] flex items-center justify-center",
              "text-primary disabled:opacity-30",
            )}
            aria-label="Fewer people"
          >
            <Icon name="remove" className="text-[20px]" />
          </button>
          <div className="text-center min-w-[88px]">
            <p className="font-headline-md text-primary text-[28px] tabular-nums leading-none">
              {people}
            </p>
            <p className="text-[11px] text-secondary mt-1 tabular-nums">of {total}</p>
          </div>
          <button
            type="button"
            disabled={people >= total}
            onClick={() => setPeople((n) => Math.min(total, n + 1))}
            className={cn(
              "h-11 w-11 rounded-full border border-[rgba(128,0,32,0.18)] flex items-center justify-center",
              "text-primary disabled:opacity-30",
            )}
            aria-label="More people"
          >
            <Icon name="add" className="text-[20px]" />
          </button>
        </div>

        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(people)}
            className="h-11 rounded-full bg-primary-container text-on-primary font-button text-[13px]"
          >
            {confirmLabel || `Add ${people}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
