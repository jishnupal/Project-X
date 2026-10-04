import { useMemo } from "react";
import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export type CalendarMark = {
  iso: string;
  label: string;
};

type EventDayCalendarProps = {
  month: Date;
  selected: string;
  marks: CalendarMark[];
  onMonthChange: (next: Date) => void;
  onSelect: (iso: string) => void;
};

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function EventDayCalendar({
  month,
  selected,
  marks,
  onMonthChange,
  onSelect,
}: EventDayCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const markMap = useMemo(() => {
    const next = new Map<string, string[]>();
    for (const mark of marks) {
      const list = next.get(mark.iso) || [];
      list.push(mark.label);
      next.set(mark.iso, list);
    }
    return next;
  }, [marks]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const items: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < firstWeekday; i += 1) items.push({ iso: null, day: null });
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push({ iso: toIso(year, monthIndex, day), day });
    }
    while (items.length % 7 !== 0) items.push({ iso: null, day: null });
    return items;
  }, [year, monthIndex]);

  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="big-day-cal">
      <div className="big-day-cal__nav">
        <button
          type="button"
          className="big-day-cal__shift"
          aria-label="Previous month"
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
        >
          <Icon name="chevron_left" className="text-[22px]" />
        </button>
        <p className="big-day-cal__month">{monthLabel(month)}</p>
        <button
          type="button"
          className="big-day-cal__shift"
          aria-label="Next month"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
        >
          <Icon name="chevron_right" className="text-[22px]" />
        </button>
      </div>

      <div className="big-day-cal__week" aria-hidden>
        {WEEKDAYS.map((day, i) => (
          <span key={`${day}-${i}`}>{day}</span>
        ))}
      </div>

      <div className="big-day-cal__grid" role="grid" aria-label={monthLabel(month)}>
        {cells.map((cell, i) => {
          if (!cell.iso || !cell.day) {
            return <span key={`empty-${i}`} className="big-day-cal__cell is-empty" />;
          }
          const marked = markMap.get(cell.iso) || [];
          const isSelected = cell.iso === selected;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${cell.day}${marked.length ? `, ${marked.join(", ")}` : ""}`}
              className={cn(
                "big-day-cal__cell",
                isSelected && "is-selected",
                isToday && "is-today",
                marked.length > 0 && "is-marked",
              )}
              onClick={() => onSelect(cell.iso!)}
            >
              <span>{cell.day}</span>
              {marked.length > 0 ? <i /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
