import { useEffect, useMemo, useState } from "react";
import { isRealEventDate, type FunctionScheduleDraft } from "../../domain/functions";
import { Icon } from "../ui/Icon";

const ART = [
  "/plot/day-1.svg",
  "/plot/day-2.svg",
  "/plot/day-3.svg",
  "/plot/day-4.svg",
  "/plot/day-5.svg",
  "/plot/day-6.svg",
];

function itineraryFeel(index: number, total: number): string {
  if (total <= 1) return "The whole trip in one day.";
  if (index === 0) return "Day one. The plan starts here.";
  if (index === total - 1) return "Last day. Bring it home.";
  if (total === 3 && index === 1) return "The middle stretch.";
  return `Day ${index + 1} of ${total}.`;
}

type WeekFeelProps = {
  functions: FunctionScheduleDraft[];
  nameOf: (fn: FunctionScheduleDraft) => string;
  onOpen?: (id: number) => void;
  selectedId?: number | null;
};

function pad(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function nightsBetween(first: string, last: string): number {
  const a = new Date(`${first}T00:00:00`).getTime();
  const b = new Date(`${last}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000);
}

function useCountdown(iso: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!iso) return;
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [iso]);

  return useMemo(() => {
    if (!iso) return { days: 0, hours: 0, minutes: 0, live: false };
    const target = new Date(`${iso}T18:00:00`).getTime();
    if (Number.isNaN(target)) return { days: 0, hours: 0, minutes: 0, live: false };
    const ms = Math.max(0, target - now);
    return {
      days: Math.floor(ms / 86_400_000),
      hours: Math.floor((ms % 86_400_000) / 3_600_000),
      minutes: Math.floor((ms % 3_600_000) / 60_000),
      live: ms > 0,
    };
  }, [iso, now]);
}

export function BigDayPreview({ functions, nameOf }: Omit<WeekFeelProps, "onOpen">) {
  const dated = functions.filter((fn) => isRealEventDate(fn.date));
  const first = dated[0];
  const last = dated[dated.length - 1];
  const clock = useCountdown(first?.date || "");
  const nights = first && last ? nightsBetween(first.date, last.date) : 0;
  const firstName = first ? nameOf(first) : "your first day";

  if (!dated.length) return null;

  return (
    <div className="big-day-preview">
      <section className="big-day-ready" aria-label="Countdown to the first big day">
        <span className="big-day-ready__star" aria-hidden>
          ✦
        </span>
        <p className="big-day-ready__ask">Are you ready?</p>
        <p className="big-day-ready__sub">
          {clock.live ? `Until ${firstName}` : `${firstName} is here`}
        </p>
        <div className="big-day-ready__clock">
          {[
            [clock.days, "Days"],
            [clock.hours, "Hours"],
            [clock.minutes, "Minutes"],
          ].map(([value, label]) => (
            <div key={String(label)} className="big-day-flip">
              <b>{pad(Number(value))}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="big-day-ready__meta">
          {dated.length} {dated.length === 1 ? "event" : "events"}
          {nights > 0 ? ` · ${nights} ${nights === 1 ? "night" : "nights"}` : ""}
        </p>
      </section>
    </div>
  );
}

export function WeekFeel({ functions, nameOf, onOpen, selectedId = null }: WeekFeelProps) {
  const days = functions
    .filter((fn) => isRealEventDate(fn.date) && fn.name?.trim())
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!days.length) return null;

  return (
    <div className="big-day-preview">
      {days.map((fn, index) => {
        const name = nameOf(fn);
        const art = ART[index % ART.length];
        const feel = itineraryFeel(index, days.length);
        const date = isRealEventDate(fn.date) ? new Date(`${fn.date}T00:00:00`) : null;
        const badge = date
          ? date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
          : "DAY";
        const when = date
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Date open";
        const selected = selectedId != null && fn.id === selectedId;
        return (
          <button
            key={fn.id}
            type="button"
            className={`big-day-story${selected ? " is-selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onOpen?.(fn.id)}
          >
            <span className="big-day-story__art" aria-hidden>
              {art ? <img src={art} alt="" /> : null}
            </span>
            <span className="big-day-story__burst" aria-hidden>
              {badge}
            </span>
            <span className="big-day-story__body">
              <span className="big-day-story__name">
                {name}
                <span className="big-day-story__when"> · {when}</span>
              </span>
              <span className="big-day-story__feel">{feel}</span>
            </span>
            <span className="big-day-story__go" aria-hidden>
              <Icon name="play_arrow" className="text-[22px]" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
