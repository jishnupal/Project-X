import { useEffect, useState } from "react";
import type { MenuRow, WeddingState } from "../../domain/types";
import { menuEffectivePlateCount, menuRowCost } from "../../domain/menu";
import { formatRupee } from "../../domain/money";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type CommercialDialPopupProps = {
  open: boolean;
  row: MenuRow | null;
  state: WeddingState;
  onClose: () => void;
  onSave: (updated: MenuRow) => void;
};

export function CommercialDialPopup({
  open,
  row,
  state,
  onClose,
  onSave,
}: CommercialDialPopupProps) {
  const [plateCount, setPlateCount] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (!open || !row) return;
    setPlateCount(row.plateCount);
    setRate(row.rate);
  }, [open, row?.id]);

  if (!open || !row) return null;

  const autoPlates = menuEffectivePlateCount(state, row);
  const workingRow: MenuRow = { ...row, plateCount, rate, estimate: "" };
  const estimate = menuRowCost(state, workingRow);

  const persist = (nextPlates: string, nextRate: string) => {
    onSave({
      ...row,
      plateCount: nextPlates,
      rate: nextRate,
      estimate: "",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-surface rounded-2xl w-full max-w-xs shadow-2xl border border-outline-variant",
          "p-5 space-y-4",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <h3 className="font-headline-md text-primary text-lg">{row.course}</h3>
            <p className="text-xs text-on-surface-variant">Headcount & per-plate rate</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-primary p-1"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <label className="block text-xs text-secondary">
          Headcount
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="mt-1 w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-white"
            value={plateCount}
            onChange={(e) => {
              setPlateCount(e.target.value);
              persist(e.target.value, rate);
            }}
            placeholder={`Auto ${autoPlates}`}
          />
        </label>

        <label className="block text-xs text-secondary">
          Per plate rate
          <input
            inputMode="decimal"
            className="mt-1 w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-white"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              persist(plateCount, e.target.value);
            }}
            placeholder="₹"
          />
        </label>

        <p className="text-center text-sm text-on-surface-variant pt-1 border-t border-outline-variant">
          Estimate{" "}
          <span className="font-bold text-primary">{formatRupee(estimate)}</span>
        </p>
      </div>
    </div>
  );
}
