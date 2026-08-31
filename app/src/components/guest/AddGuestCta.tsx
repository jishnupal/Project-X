import { HeroCtaButton } from "../ui/HeroCtaButton";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type AddGuestCtaProps = {
  onClick: () => void;
  className?: string;
  placement?: "desktop" | "mobile";
};

/** Compact floating CTA — docked bottom-right on mobile so it never sits on the tab bar. */
export function AddGuestCta({ onClick, className, placement = "desktop" }: AddGuestCtaProps) {
  if (placement === "mobile") {
    return (
      <button
        type="button"
        data-testid="add-guest-cta-mobile"
        onClick={onClick}
        aria-label="Add Guest"
        className={cn(
          "h-12 pl-3.5 pr-4 rounded-full bg-primary text-on-primary",
          "inline-flex items-center gap-1.5 font-button text-[13px]",
          "shadow-[0_10px_24px_-8px_rgba(128,0,32,0.55)]",
          "active:scale-[0.98] transition-transform",
          className,
        )}
      >
        <Icon name="person_add" className="text-[18px]" />
        Add
      </button>
    );
  }

  return (
    <div className={cn("flex justify-center w-full pointer-events-auto", className)}>
      <div
        data-testid="add-guest-dock-desktop"
        className={cn(
          "add-guest-dock inline-flex rounded-full p-[3px]",
          "bg-white/45 backdrop-blur-md",
          "border border-white/55",
          "shadow-[0_10px_28px_-10px_rgba(128,0,32,0.35)]",
        )}
      >
        <HeroCtaButton
          label="Add Guest"
          icon="person_add"
          onClick={onClick}
          data-testid="add-guest-cta-desktop"
        />
      </div>
    </div>
  );
}
