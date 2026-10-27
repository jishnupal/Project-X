import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../design-system/cn";

type InviteVibeStageProps = {
  guestName: string;
  eventName?: string;
  className?: string;
  /** Soft fade while banner is rolling away */
  exiting?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;
/** Slow cloth ease — announcement banner flex */
export const CLOTH_EASE = [0.45, 0.05, 0.2, 1] as const;

/** YOU → ARE quickly, then INVITED neon flicker 5s */
export const VIBE_YOU_MS = 700;
export const VIBE_ARE_MS = 800;
export const VIBE_INVITED_MS = 5000;
export const VIBE_TOTAL_MS = VIBE_YOU_MS + VIBE_ARE_MS + VIBE_INVITED_MS;
/** Swipe unlocks once INVITED has landed (~0.5s into its beat) */
export const VIBE_SWIPE_READY_MS = VIBE_YOU_MS + VIBE_ARE_MS + 500;

const NEON_GLOW = [
  "0 0 10px rgba(255,79,216,0.35), 0 0 28px rgba(181,107,255,0.25)",
  "0 0 4px rgba(255,79,216,0.15), 0 0 8px rgba(181,107,255,0.1)",
  "0 0 22px rgba(255,79,216,0.95), 0 0 56px rgba(92,225,255,0.55)",
  "0 0 6px rgba(255,79,216,0.2), 0 0 14px rgba(181,107,255,0.15)",
  "0 0 28px rgba(255,79,216,1), 0 0 64px rgba(181,107,255,0.7)",
  "0 0 3px rgba(255,79,216,0.1)",
  "0 0 18px rgba(255,79,216,0.8), 0 0 42px rgba(92,225,255,0.4)",
  "0 0 8px rgba(255,79,216,0.25)",
  "0 0 32px rgba(255,79,216,1), 0 0 70px rgba(181,107,255,0.65)",
  "0 0 16px rgba(255,79,216,0.7), 0 0 40px rgba(181,107,255,0.45)",
] as const;

/**
 * Midnight party landing copy — YOU / ARE / INVITED neon flicker.
 * Lives on the cloth announcement banner.
 */
export function InviteVibeStage({
  guestName,
  eventName,
  className,
  exiting = false,
}: InviteVibeStageProps) {
  const reduce = useReducedMotion();
  const guest = guestName.trim() || "Guest";
  const event = (eventName || "").trim();
  const areAt = reduce ? 0 : VIBE_YOU_MS / 1000;
  const invitedAt = reduce ? 0 : (VIBE_YOU_MS + VIBE_ARE_MS) / 1000;
  const eventAt = reduce ? 0 : invitedAt + VIBE_INVITED_MS / 1000;

  return (
    <motion.div
      className={cn("invite-vibe", exiting && "is-exiting", className)}
      aria-live="polite"
      data-testid="invite-vibe-stage"
      initial={false}
      animate={
        exiting
          ? { opacity: 0.25, filter: "blur(4px)" }
          : { opacity: 1, filter: "blur(0px)" }
      }
      transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
    >
      <p className="invite-vibe__for">{guest}</p>

      <h1 className="invite-vibe__announce">
        <motion.span
          className="invite-vibe__word invite-vibe__word--you"
          initial={reduce ? false : { opacity: 0, y: 36, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
        >
          YOU
        </motion.span>

        <motion.span
          className="invite-vibe__word invite-vibe__word--are"
          initial={reduce ? false : { opacity: 0, y: 36, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: areAt,
            duration: reduce ? 0 : 0.65,
            ease: EASE,
          }}
        >
          ARE
        </motion.span>

        <motion.span
          className="invite-vibe__word invite-vibe__word--invited"
          initial={
            reduce
              ? false
              : { opacity: 0, scale: 0.92, filter: "blur(12px)" }
          }
          animate={
            reduce
              ? {
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  textShadow: NEON_GLOW[4],
                }
              : {
                  opacity: [0, 1, 1, 0.25, 1, 0.45, 1, 0.15, 1, 0.7, 1, 0.35, 1],
                  scale: [0.92, 1.04, 1, 1, 1.02, 1, 1.03, 1, 1, 1, 1.02, 1, 1],
                  filter: [
                    "blur(12px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(1px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(2px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(0px)",
                    "blur(0px)",
                  ],
                  textShadow: [...NEON_GLOW, NEON_GLOW[4], NEON_GLOW[2], NEON_GLOW[4]],
                }
          }
          transition={{
            delay: invitedAt,
            duration: reduce ? 0 : VIBE_INVITED_MS / 1000,
            ease: "linear",
            times: reduce
              ? undefined
              : [0, 0.08, 0.14, 0.22, 0.3, 0.4, 0.48, 0.55, 0.65, 0.75, 0.85, 0.93, 1],
          }}
        >
          INVITED
        </motion.span>
      </h1>

      {event ? (
        <motion.p
          className="invite-vibe__event"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: eventAt, duration: reduce ? 0 : 0.55, ease: EASE }}
        >
          {event}
        </motion.p>
      ) : null}

      <motion.div
        className="invite-vibe__pulse"
        aria-hidden
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={
          reduce
            ? { opacity: 0.45, scale: 1 }
            : {
                opacity: [0, 0.75, 0.3, 0.65, 0.25, 0.55, 0.35],
                scale: [0.6, 1.12, 1.2, 1.28, 1.32, 1.36, 1.4],
              }
        }
        transition={{
          delay: invitedAt,
          duration: reduce ? 0 : VIBE_INVITED_MS / 1000,
          ease: "easeOut",
        }}
      />
    </motion.div>
  );
}

/** Soft fabric folds / hem for the announcement cloth */
export function InviteBannerCloth({ slowIn = true }: { slowIn?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="invite-banner__cloth" aria-hidden>
      <motion.span
        className="invite-banner__fold invite-banner__fold--a"
        initial={reduce || !slowIn ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 0.55, x: 0 }}
        transition={{ duration: reduce ? 0 : 1.4, ease: CLOTH_EASE }}
      />
      <motion.span
        className="invite-banner__fold invite-banner__fold--b"
        initial={reduce || !slowIn ? false : { opacity: 0, x: 28 }}
        animate={{ opacity: 0.4, x: 0 }}
        transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0 : 1.55, ease: CLOTH_EASE }}
      />
      <motion.span
        className="invite-banner__fold invite-banner__fold--c"
        initial={reduce || !slowIn ? false : { opacity: 0, y: 18 }}
        animate={
          reduce
            ? { opacity: 0.35, y: 0 }
            : { opacity: [0.25, 0.45, 0.3], y: [0, -6, 0] }
        }
        transition={
          reduce
            ? { duration: 0 }
            : { delay: 0.4, duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <div className="invite-banner__hem" />
    </div>
  );
}
