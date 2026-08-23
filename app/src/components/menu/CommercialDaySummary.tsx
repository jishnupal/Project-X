import { formatRupee } from "../../domain/money";

type CommercialDaySummaryProps = {
  plates: number;
  estimate: number;
  configured: number;
  totalSlots: number;
};

export function CommercialDaySummary({
  plates,
  estimate,
  configured,
  totalSlots,
}: CommercialDaySummaryProps) {
  return (
    <div className="px-6 md:px-8 py-3 bg-surface-container border-t border-surface-container-highest flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest">
        Day catering total
      </span>
      <div className="flex flex-wrap items-center gap-4 md:gap-8">
        <span className="text-on-surface-variant">
          Meals planned:{" "}
          <strong className="text-on-surface">
            {configured}/{totalSlots}
          </strong>
        </span>
        <span className="text-on-surface-variant">
          Plates: <strong className="text-on-surface">{plates > 0 ? plates : "TBD"}</strong>
        </span>
        <span className="text-on-surface-variant">
          Estimate:{" "}
          <strong className="text-primary">{estimate > 0 ? formatRupee(estimate) : "TBD"}</strong>
        </span>
      </div>
    </div>
  );
}
