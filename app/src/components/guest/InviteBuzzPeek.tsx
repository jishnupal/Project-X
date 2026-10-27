import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../design-system/cn";

export type InviteBuzzPeekDay = {
  id: number;
  name: string;
  day: string;
  month: string;
  weekday: string;
  detail: string;
  beats?: Array<{ title: string; time?: string; place?: string }>;
};

export type InviteBuzzPeekContent = {
  eventName: string;
  guestName: string;
  venueName?: string;
  welcomeTitle?: string;
  scheduleHeadline?: string;
  scheduleDetail?: string;
  /** ISO date for countdown */
  countdownTarget?: string;
  days: InviteBuzzPeekDay[];
  playEnabled?: boolean;
};

type InviteBuzzPeekProps = {
  content: InviteBuzzPeekContent;
  onContinue: () => void;
  className?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const LEADERBOARD_TEASE = [
  { rank: 1, name: "Aanya", pts: 420 },
  { rank: 2, name: "Rohan", pts: 380 },
  { rank: 3, name: "You?", pts: "—" },
] as const;

function useCountdown(iso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [iso]);

  if (!iso?.trim()) return null;
  const target = new Date(`${iso.trim()}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

/**
 * Read-only Buzz sneak peek — separate event boxes, Dates, leaderboard tease.
 */
export function InviteBuzzPeek({ content, onContinue, className }: InviteBuzzPeekProps) {
  const reduce = useReducedMotion();
  const countdown = useCountdown(content.countdownTarget);
  const guest = content.guestName.trim() || "Guest";
  const title =
    content.welcomeTitle?.trim() ||
    content.scheduleHeadline?.trim() ||
    content.eventName.trim() ||
    "Your night";

  return (
    <div className={cn("invite-buzz-peek", className)} data-testid="invite-buzz-peek">
      <motion.p
        className="invite-buzz-peek__eyebrow"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        Buzz · sneak peek
      </motion.p>

      <motion.h2
        className="invite-buzz-peek__title"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.08, duration: 0.5, ease: EASE }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="invite-buzz-peek__for"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.16, duration: 0.4 }}
      >
        Portal for {guest}
        {content.venueName?.trim() ? ` · ${content.venueName.trim()}` : ""}
      </motion.p>

      {countdown ? (
        <motion.div
          className="invite-buzz-peek__countdown"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.22, duration: 0.5, ease: EASE }}
        >
          <span className="invite-buzz-peek__count-label">Dates</span>
          <div className="invite-buzz-peek__count-grid">
            {(
              [
                ["days", countdown.days],
                ["hrs", countdown.hours],
                ["min", countdown.mins],
                ["sec", countdown.secs],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="invite-buzz-peek__count-cell">
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {content.scheduleDetail ? (
            <p className="invite-buzz-peek__count-detail">{content.scheduleDetail}</p>
          ) : null}
        </motion.div>
      ) : null}

      <div className="invite-buzz-peek__modules">
        <motion.section
          className="invite-buzz-peek__plot"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.28, duration: 0.5, ease: EASE }}
        >
          <p className="invite-buzz-peek__module-label">The Plot · events</p>
          {content.days.length ? (
            <div className="invite-buzz-peek__days">
              {content.days.slice(0, 4).map((day, i) => (
                <motion.article
                  key={day.id}
                  className="invite-buzz-peek__day-box"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduce ? 0 : 0.34 + i * 0.07,
                    duration: 0.4,
                    ease: EASE,
                  }}
                >
                  <div className="invite-buzz-peek__day-date">
                    <span>{day.month}</span>
                    <strong>{day.day}</strong>
                    <em>{day.weekday}</em>
                  </div>
                  <div className="invite-buzz-peek__day-body">
                    <p className="invite-buzz-peek__day-name">{day.name}</p>
                    {day.beats?.length ? (
                      <ul className="invite-buzz-peek__beats">
                        {day.beats.slice(0, 3).map((beat) => (
                          <li key={`${day.id}-${beat.title}`}>
                            {beat.time ? <span>{beat.time}</span> : null}
                            {beat.title}
                            {beat.place ? <em> · {beat.place}</em> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="invite-buzz-peek__day-detail">{day.detail}</p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <p className="invite-buzz-peek__empty">
              Event days unlock here once the hosts lock The Plot.
            </p>
          )}
        </motion.section>

        <motion.section
          className="invite-buzz-peek__board"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.46, duration: 0.5, ease: EASE }}
        >
          <div className="invite-buzz-peek__board-head">
            <p className="invite-buzz-peek__module-label">Leaderboard</p>
            <span className="invite-buzz-peek__board-lock">App only</span>
          </div>
          <ol className="invite-buzz-peek__board-list">
            {LEADERBOARD_TEASE.map((row) => (
              <li
                key={row.rank}
                className={cn(
                  "invite-buzz-peek__board-row",
                  row.name === "You?" && "is-you",
                )}
              >
                <span className="invite-buzz-peek__board-rank">#{row.rank}</span>
                <span className="invite-buzz-peek__board-name">{row.name}</span>
                <span className="invite-buzz-peek__board-pts">{row.pts}</span>
              </li>
            ))}
          </ol>
          <p className="invite-buzz-peek__play-copy">
            {content.playEnabled
              ? "Trivia & live scores open after check-in — climb past these names."
              : "Host games and night scores land here after you accept."}
          </p>
        </motion.section>
      </div>

      <button
        type="button"
        className="guest-invite-continue"
        onClick={onContinue}
      >
        Continue to RSVP
      </button>
    </div>
  );
}
