import { useDialAnimation } from "../../hooks/useDialAnimation";
import { Icon } from "../ui/Icon";

type GuestStatDialProps = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  percent: number;
  compact?: boolean;
};

export function GuestStatDial({
  label,
  value,
  hint,
  icon,
  percent,
  compact = false,
}: GuestStatDialProps) {
  const circleRef = useDialAnimation(percent);

  if (compact) {
    return (
      <div className="flex w-[132px] flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface p-3 text-center shrink-0">
        <div className="relative h-12 w-12">
          <svg className="h-full w-full dial-ring" viewBox="0 0 36 36">
            <circle className="stroke-surface-container-highest" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
            <circle
              ref={circleRef}
              className="stroke-primary"
              cx="18"
              cy="18"
              fill="none"
              r="16"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name={icon} className="text-primary text-[14px]" />
          </div>
        </div>
        <div className="min-w-0 w-full">
          <p className="font-label-caps text-[9px] text-secondary truncate">{label}</p>
          <p className="font-body-md text-xs font-bold leading-tight tabular-nums">{value}</p>
          <p className="text-[9px] text-on-surface-variant truncate">{hint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-full h-full dial-ring" viewBox="0 0 36 36">
          <circle className="stroke-surface-container-highest" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
          <circle
            ref={circleRef}
            className="stroke-primary"
            cx="18"
            cy="18"
            fill="none"
            r="16"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name={icon} className="text-primary text-[16px]" />
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-label-caps text-[10px] text-secondary">{label}</p>
        <p className="font-body-md font-bold text-sm leading-tight tabular-nums">{value}</p>
        <p className="text-[10px] text-on-surface-variant truncate">{hint}</p>
      </div>
    </div>
  );
}
