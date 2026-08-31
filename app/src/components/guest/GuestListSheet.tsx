import type { ReactNode } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { cn } from "../../design-system/cn";

type GuestListSheetProps = {
  open: boolean;
  onClose: () => void;
  guestCount: number;
  toolbar: ReactNode;
  children: ReactNode;
};

export function GuestListSheet({
  open,
  onClose,
  guestCount,
  toolbar,
  children,
}: GuestListSheetProps) {
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Guest list"
      height="tall"
      zIndexClass="z-[70]"
      panelClassName="bg-[#fff8f5]"
    >
      <p className="shrink-0 px-4 -mt-1 mb-2 text-[12px] text-secondary tabular-nums">
        <span className="font-semibold text-primary">{guestCount}</span>
        {guestCount === 1 ? " guest" : " guests"} in this view
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
