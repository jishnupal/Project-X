import { functionIds, resolveDayName, resolveFunctionDateLabel } from "../../domain/functions";
import { guestCountForFunction, parseCount } from "../../domain/guest";
import type { GuestRow, WeddingState } from "../../domain/types";
import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";

/** @deprecated Prefer day id + setGuestDayCount; kept for ContactsPage patches. */
export type DayCountField = "sangeetCount" | "biyebariCount" | "receptionCount" | "borjatriCount";

const DAY_ICON: Record<number, string> = {
  1: "music_note",
  2: "favorite",
  3: "celebration",
  4: "event",
};

type GuestDayPlanProps = {
  state: WeddingState;
  total: number;
  counts: Pick<GuestRow, "stayCount" | "dayCounts" | "sangeetCount" | "biyebariCount" | "receptionCount" | "borjatriCount" | "count">;
  needsStay: boolean;
  onTotalChange: (next: number) => void;
  /** Day-keyed: Plot/Dates function id. */
  onDayChange: (dayId: number, next: number) => void;
  onStayToggle: (on: boolean) => void;
  onStayCountChange: (next: number) => void;
  accent?: "yellow" | "maroon";
};

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  accent: "yellow" | "maroon";
}) {
  const step = (delta: number) => onChange(Math.max(min, Math.min(max, value + delta)));
  const plus =
    accent === "yellow" ? "bg-[#feca43] text-black" : "bg-primary text-on-primary";

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-[#fff8f5] px-1">
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => step(-1)}
        className="grid h-9 w-9 place-items-center rounded-full text-black disabled:opacity-30"
      >
        <Icon name="remove" className="text-[18px]" />
      </button>
      <span className="min-w-8 text-center text-[18px] font-extrabold tabular-nums">{pad(value)}</span>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => step(1)}
        className={cn("grid h-9 w-9 place-items-center rounded-full disabled:opacity-30", plus)}
      >
        <Icon name="add" className="text-[18px]" />
      </button>
    </div>
  );
}

export function GuestDayPlan({
  state,
  total,
  counts,
  needsStay,
  onTotalChange,
  onDayChange,
  onStayToggle,
  onStayCountChange,
  accent = "yellow",
}: GuestDayPlanProps) {
  const people = Math.max(1, total);
  const probe = counts as GuestRow;
  const days = functionIds(state).map((day) => {
    const count = guestCountForFunction(probe, day);
    return {
      day,
      label: resolveDayName(state, day),
      date: resolveFunctionDateLabel(state, day),
      icon: DAY_ICON[day] || "event",
      count,
    };
  });
  const stay = parseCount(counts.stayCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[16px] font-extrabold leading-tight">People</p>
          <p className="mt-0.5 text-[13px] font-medium text-[#584141]">Family head count</p>
        </div>
        <Stepper label="people" value={people} min={1} max={99} onChange={onTotalChange} accent={accent} />
      </div>

      <div>
        <p className="px-1 pb-2 text-[13px] font-semibold text-[#584141]">Which days</p>
        {days.length === 0 ? (
          <p className="rounded-[22px] bg-white px-3.5 py-4 text-[13px] font-medium text-[#584141]">
            Add days on Dates first — then set who comes each day.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[22px] bg-white">
            {days.map((row) => {
              const coming = row.count > 0;
              return (
                <li key={row.day} className="border-t border-[#ece7e2] first:border-t-0">
                  <div className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff8f5]">
                      <Icon name={row.icon} className="text-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-extrabold leading-tight">{row.label}</p>
                      <p className="mt-0.5 text-[13px] font-medium text-[#584141]">
                        {row.date ? `${row.date} · ` : ""}
                        {coming ? `${row.count} coming` : "Not this day"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      {coming ? (
                        <Stepper
                          label={row.label}
                          value={row.count}
                          min={0}
                          max={people}
                          onChange={(next) => onDayChange(row.day, next)}
                          accent={accent}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDayChange(row.day, people)}
                          className={cn(
                            "h-11 shrink-0 rounded-full px-4 text-[14px] font-semibold",
                            accent === "yellow" ? "bg-[#feca43] text-black" : "bg-primary text-on-primary",
                          )}
                        >
                          Coming
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-[22px] bg-white px-3.5 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff8f5]">
            <Icon name="hotel" className="text-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-extrabold leading-tight">Stay</p>
            <p className="mt-0.5 text-[13px] font-medium text-[#584141]">
              {needsStay ? "Needs a room" : "No room"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={needsStay}
            aria-label="Needs a room"
            onClick={() => onStayToggle(!needsStay)}
            className={cn(
              "h-8 w-14 shrink-0 rounded-full p-1",
              needsStay ? (accent === "yellow" ? "bg-[#feca43]" : "bg-primary") : "bg-[#ece7e2]",
            )}
          >
            <span className={cn("block h-6 w-6 rounded-full bg-white", needsStay && "ml-auto")} />
          </button>
        </div>
        {needsStay ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#ece7e2] pt-3">
            <p className="text-[15px] font-semibold">Staying</p>
            <Stepper
              label="staying"
              value={Math.max(1, stay || people)}
              min={1}
              max={people}
              onChange={onStayCountChange}
              accent={accent}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
