import { cn } from "../../design-system/cn";
import { Icon } from "./Icon";

type HeroCtaButtonProps = {
  label: string;
  icon?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  fullWidth?: boolean;
  compact?: boolean;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-pressed"?: boolean;
};

/** Maroon hero pill/bar — matches group tile styling. */
export function HeroCtaButton({
  label,
  icon = "add",
  onClick,
  type = "button",
  fullWidth = false,
  compact = false,
  active = false,
  disabled = false,
  className,
  "data-testid": testId,
  "aria-pressed": ariaPressed,
}: HeroCtaButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={ariaPressed}
      className={cn(
        "hero-meal-card hero-group-card hero-cta-button relative overflow-hidden inline-flex items-center justify-center gap-2",
        "font-label-caps tracking-[0.12em] text-white",
        "border border-[rgba(255,215,140,0.28)]",
        "hover:brightness-110 active:scale-[0.98] transition-[transform,filter]",
        "disabled:opacity-40 disabled:pointer-events-none",
        fullWidth ? "w-full rounded-2xl h-12 px-5 text-[11px]" : "rounded-full",
        !fullWidth && compact && "h-11 px-3.5 text-[10px] gap-1.5",
        !fullWidth && !compact && "h-12 min-w-[168px] px-6 text-[11px]",
        active && "brightness-110 ring-1 ring-[rgba(243,213,138,0.55)]",
        className,
      )}
    >
      <Icon name={icon} className={cn("relative z-[1]", compact ? "text-[18px]" : "text-[18px]")} />
      <span className="relative z-[1]">{label}</span>
    </button>
  );
}
