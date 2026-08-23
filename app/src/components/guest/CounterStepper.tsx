import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type CounterStepperProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  compact?: boolean;
  variant?: "default" | "premium";
};

export function CounterStepper({
  label,
  value,
  min = 0,
  max = Infinity,
  onChange,
  compact = false,
  variant = "default",
}: CounterStepperProps) {
  const step = (delta: number) => {
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  if (variant === "premium") {
    return (
      <div className="space-y-2">
        <label className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest text-center block">
          {label}
        </label>
        <div className="flex items-center justify-between bg-surface-container-low/50 p-2 rounded-xl border border-outline-variant/30">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={value <= min}
            className="w-8 h-8 rounded-lg bg-white text-primary font-bold shadow-sm disabled:opacity-40"
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <span className="font-display font-black text-lg tabular-nums">{value}</span>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={value >= max}
            className="w-8 h-8 rounded-lg bg-primary text-white font-bold shadow-sm disabled:opacity-40"
            aria-label={`Increase ${label}`}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", compact && "gap-1.5")}>
      <span
        className={cn(
          "text-center text-on-surface-variant font-label-caps uppercase tracking-wide",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex items-center justify-between bg-surface border border-outline-variant rounded-lg",
          compact ? "px-2 py-1" : "px-3 py-1.5",
        )}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          <Icon name="remove" className="text-[16px]" />
        </button>
        <span className="font-bold text-sm tabular-nums min-w-[2ch] text-center">{value}</span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          <Icon name="add" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
