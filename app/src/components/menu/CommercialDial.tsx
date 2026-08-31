import type { MenuCourse, MenuRow } from "../../domain/types";
import { mealCourseIcon } from "../../domain/menu";
import { dialCourseLabel, getDialPercentage } from "../../domain/menuDisplay";
import { formatRupee, formatRupeeShort, parseMoney } from "../../domain/money";
import { useDialAnimation } from "../../hooks/useDialAnimation";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type CommercialDialProps = {
  row: MenuRow;
  plates: number;
  estimate: number;
  onClick: () => void;
  compact?: boolean;
};

export function CommercialDial({ row, plates, estimate, onClick, compact = false }: CommercialDialProps) {
  const percentage = getDialPercentage(row, plates);
  const circleRef = useDialAnimation(percentage);
  const rate = parseMoney(row.rate);
  const isEmpty = plates === 0 && rate === 0;
  const strokeClass = isEmpty ? "stroke-secondary" : "stroke-primary";
  const iconClass = isEmpty ? "text-secondary" : "text-primary";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full flex-col items-center gap-1.5 rounded-xl border border-outline-variant bg-surface p-2 text-center",
          "hover:border-primary transition-colors",
          isEmpty && "opacity-70",
        )}
      >
        <div className="relative h-9 w-9 shrink-0">
          <svg className="h-full w-full dial-ring" viewBox="0 0 36 36">
            <circle
              className="stroke-surface-container-highest"
              cx="18"
              cy="18"
              fill="none"
              r="16"
              strokeWidth="3"
            />
            <circle
              ref={circleRef}
              className={strokeClass}
              cx="18"
              cy="18"
              fill="none"
              r="16"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              name={mealCourseIcon(row.course as MenuCourse)}
              className={cn(iconClass, "text-[14px]")}
            />
          </div>
        </div>
        <div className="min-w-0 w-full">
          <p className="font-label-caps text-[8px] tracking-[0.06em] text-secondary truncate">
            {dialCourseLabel(row.course as MenuCourse)}
          </p>
          <p
            className={cn(
              "mt-0.5 inline-flex items-center gap-1 text-[7px] font-bold uppercase tracking-[0.12em] truncate max-w-full",
              row.status === "Confirmed" ? "text-emerald-600" : "text-secondary/65",
            )}
          >
            {row.status === "Confirmed" ? (
              <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            ) : null}
            {row.status === "Confirmed" ? "Confirmed" : "In discussion"}
          </p>
          <p className="font-body-md text-[11px] font-bold leading-tight truncate mt-0.5">
            {rate > 0 ? formatRupee(rate) : "Rate TBD"}
          </p>
          <p className="text-[8px] text-on-surface-variant truncate">
            {plates > 0 ? `${plates} plates` : "Headcount TBD"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 group cursor-pointer text-left rounded-xl p-2 -m-2",
        "hover:bg-surface-container-low transition-colors",
        isEmpty && "opacity-70 hover:opacity-100",
      )}
    >
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-full h-full dial-ring" viewBox="0 0 36 36">
          <circle
            className="stroke-surface-container-highest"
            cx="18"
            cy="18"
            fill="none"
            r="16"
            strokeWidth="3"
          />
          <circle
            ref={circleRef}
            className={strokeClass}
            cx="18"
            cy="18"
            fill="none"
            r="16"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            name={mealCourseIcon(row.course as MenuCourse)}
            className={cn(iconClass, "text-[16px]")}
          />
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-label-caps text-[10px] text-secondary">
          {dialCourseLabel(row.course as MenuCourse)}
        </p>
        <p className="font-body-md font-bold text-sm leading-tight truncate">
          {rate > 0 ? formatRupee(rate) : "Rate TBD"}
          {rate > 0 && (
            <span className="text-[10px] font-normal text-secondary"> /plate</span>
          )}
        </p>
        <p className="text-[10px] text-on-surface-variant truncate">
          {plates > 0 ? `${plates} plates` : "Headcount TBD"}
          {estimate > 0 ? ` · ${formatRupeeShort(estimate).replace("Est: ", "")}` : ""}
        </p>
      </div>
    </button>
  );
}
