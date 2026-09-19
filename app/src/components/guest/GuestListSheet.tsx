import type { ReactNode } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { cn } from "../../design-system/cn";

type GuestListSheetProps = {
  open: boolean;
  onClose: () => void;
  guestCount: number;
  dayLabel?: string;
  toolbar: ReactNode;
  children: ReactNode;
};

export function GuestListSheet({
  open,
  onClose,
  guestCount,
  dayLabel,
  toolbar,
  children,
}: GuestListSheetProps) {
  const title = dayLabel ? `${dayLabel} guests` : "Guest list";

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      height="tall"
      zIndexClass="z-[70]"
      panelClassName="bg-[#fff8f5] guest-list-sheet-panel"
      bodyClassName="overflow-hidden"
    >
      <p className="shrink-0 px-4 -mt-1 mb-2 text-[12px] text-secondary tabular-nums">
        <span className="font-semibold text-primary">{guestCount}</span>
        {guestCount === 1 ? " family" : " families"}
        {dayLabel ? ` · ${dayLabel}` : " in this view"}
      </p>
      <div className="shrink-0 px-4 pb-2">{toolbar}</div>
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>
    </MobileSheet>
  );
}
