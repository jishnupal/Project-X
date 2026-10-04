import type { ScheduleDayPreview, WeddingScheduleHomeCopy } from "../../domain/functions";

type HomeLandingHeaderProps = {
  eventName: string;
  command: string;
  scheduleHome: WeddingScheduleHomeCopy;
  datesNeedSetup: boolean;
  onOpenDates: () => void;
  onOpenDetails: () => void;
};

function dayNum(day: string) {
  if (day === "—") return "—";
  const value = Number(day);
  return Number.isFinite(value) ? String(value) : day;
}

function PlotMark({ days }: { days: ScheduleDayPreview[] }) {
  const count = days.filter((day) => day.day !== "—" && day.name.trim()).length;
  if (!count) {
    return <span className="mt-auto text-[40px] font-semibold leading-none tracking-[-0.04em]">—</span>;
  }
  return (
    <span className="mt-auto block">
      <span className="block text-[11px] font-medium tracking-[0.14em]">
        {count === 1 ? "EVENT" : "EVENTS"}
      </span>
      <span className="mt-1 block text-[36px] font-semibold leading-none tracking-[-0.05em]">{count}</span>
    </span>
  );
}

function DateMark({ days, unset }: { days: ScheduleDayPreview[]; unset: boolean }) {
  const dated = days.filter((day) => day.day !== "—");
  const first = dated[0];
  const last = dated[dated.length - 1];
  if (unset || !first || !last) {
    return <span className="mt-auto text-[40px] font-semibold leading-none tracking-[-0.04em]">—</span>;
  }

  const same = first.day === last.day && first.month === last.month;

  return (
    <span className="mt-auto block">
      <span className="block text-[11px] font-medium tracking-[0.14em]">{first.month}</span>
      <span className="mt-1 flex items-end gap-1.5 text-[36px] font-semibold leading-none tracking-[-0.05em]">
        <span>{dayNum(first.day)}</span>
        {same ? null : (
          <>
            <span className="mb-[10px] h-px w-3 bg-black/35" aria-hidden />
            <span>{dayNum(last.day)}</span>
          </>
        )}
      </span>
    </span>
  );
}

export function HomeLandingHeader({
  eventName,
  command,
  scheduleHome,
  datesNeedSetup,
  onOpenDates,
  onOpenDetails,
}: HomeLandingHeaderProps) {
  const coupleName = eventName?.trim() || "Your event";

  return (
    <div className="px-2 pb-1 pt-5">
      <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-black">{coupleName}</h1>
      <p className="mt-1 text-[15px] font-medium text-[#584141]">{command}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenDates}
          aria-label="Dates"
          className="home-entry home-entry--dates"
        >
          <span className="home-entry__word">Dates</span>
          <DateMark days={scheduleHome.days} unset={datesNeedSetup} />
        </button>
        <button type="button" onClick={onOpenDetails} aria-label="The Plot" className="home-entry home-entry--details">
          <span className="home-entry__word">The Plot</span>
          <PlotMark days={scheduleHome.days} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 px-1">
        <p className="text-[13px] font-medium text-[#584141]">Set the days</p>
        <p className="text-[13px] font-medium text-[#584141]">See the itinerary</p>
      </div>
    </div>
  );
}
