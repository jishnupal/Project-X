import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type StatusPillProps = {
  variant: "stay-on" | "stay-off" | "invite-sent" | "invite-pending";
  children: React.ReactNode;
  className?: string;
};

export function StatusPill({ variant, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter whitespace-nowrap",
        variant === "stay-on" &&
          "bg-primary/5 text-primary border border-primary/10",
        variant === "stay-off" &&
          "bg-surface-container text-on-surface-variant border border-outline-variant/40",
        variant === "invite-sent" &&
          "text-green-700 bg-green-50 border border-green-100",
        variant === "invite-pending" &&
          "border-2 border-primary text-primary bg-transparent tracking-widest",
        className,
      )}
    >
      {variant === "invite-sent" ? (
        <Icon name="check_circle" className="text-[16px]" filled />
      ) : null}
      {children}
    </span>
  );
}
