import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../design-system/cn";

/** Dense tech readout — ~5s, one line at a time (replaces previous) */
const READ_LINES = [
  "Reading barcode…",
  "Pass ID locked",
  "Guest match found",
  "Invite signature OK",
  "Seat row verified",
  "Host event linked",
  "Syncing The Plot…",
  "Day cards loading",
  "Itinerary beats mapped",
  "Dates countdown armed",
  "Venue pin resolved",
  "Buzz modules waking",
  "Games channel ready",
  "Night feed primed",
  "Portal windows open",
  "Clearance granted",
] as const;

/** Total readout window (matches GuestInviteLanding SCAN_MS) */
export const SCAN_READOUT_MS = 5000;
const LINE_MS = Math.floor(SCAN_READOUT_MS / READ_LINES.length);

type InviteScanRitualProps = {
  active: boolean;
  className?: string;
};

/**
 * Single replacing line under the pass — fixed height so the pass stays put.
 */
export function InviteScanRitual({ active, className }: InviteScanRitualProps) {
  const reduce = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setLineIndex(0);
      return undefined;
    }
    if (reduce) {
      setLineIndex(READ_LINES.length - 1);
      return undefined;
    }
    setLineIndex(0);
    const id = window.setInterval(() => {
      setLineIndex((i) => Math.min(i + 1, READ_LINES.length - 1));
    }, LINE_MS);
    return () => window.clearInterval(id);
  }, [active, reduce]);

  if (!active) return null;

  const current = READ_LINES[lineIndex] ?? READ_LINES[0];

  return (
    <div className={cn("invite-scan-ritual", className)} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={current}
          className="invite-scan-ritual__line"
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
        >
          {current}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
