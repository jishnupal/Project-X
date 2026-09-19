import type { EventInfo, MenuCourse, MenuRow, WeddingFunction, WeddingState } from "./types";
import { createId } from "./event";
import { MENU_COURSES, emptyMenuCategoryDraft, normalizeMenuRow } from "./menu";

/** Default seed date — replace via the wedding dates editor. */
export const PLACEHOLDER_START_DATE = "2027-03-07";

/** Always present. Cannot be removed. */
export const CORE_FUNCTION_IDS = [1, 2, 3] as const;

const LEGACY_DAY_NAMES: Record<number, string> = {
  1: "Sangeet",
  2: "Marriage",
  3: "Reception",
  4: "Event",
};

export function isCoreWeddingFunction(dayId: number): boolean {
  return CORE_FUNCTION_IDS.includes(Number(dayId) as (typeof CORE_FUNCTION_IDS)[number]);
}

export function functionOffset(day: number): number {
  return ({ 1: 0, 2: 2, 3: 4, 4: 2 } as Record<number, number>)[Number(day)] ?? 0;
}

export function defaultFunctionDate(event: EventInfo, dayId: number): string {
  const base = new Date(`${event.startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return event.startDate || "";
  base.setDate(base.getDate() + functionOffset(dayId));
  return base.toISOString().slice(0, 10);
}

export function buildDefaultFunctions(event: EventInfo): WeddingFunction[] {
  return [
    { id: 1, name: "Sangeet", date: defaultFunctionDate(event, 1), custom: false },
    { id: 2, name: "Marriage", date: defaultFunctionDate(event, 2), custom: false },
    { id: 3, name: "Reception", date: defaultFunctionDate(event, 3), custom: false },
  ];
}

export function normalizeFunctions(
  functions: WeddingFunction[] | undefined,
  event: EventInfo,
): WeddingFunction[] {
  const defaults = buildDefaultFunctions(event);
  if (!Array.isArray(functions) || !functions.length) {
    return defaults;
  }

  const byId = new Map(
    functions.map((fn) => {
      const id = Number(fn.id);
      return [
        id,
        {
          id,
          name: fn.name || LEGACY_DAY_NAMES[id] || "Event",
          date: fn.date || defaultFunctionDate(event, id),
          custom: Boolean(fn.custom),
        } satisfies WeddingFunction,
      ] as const;
    }),
  );

  const cores = defaults.map((core) => {
    const existing = byId.get(core.id);
    if (!existing) return core;
    return {
      ...existing,
      id: core.id,
      name: existing.name || core.name,
      custom: false,
    };
  });

  const extras = [...byId.values()]
    .filter((fn) => !isCoreWeddingFunction(fn.id))
    .map((fn) => ({ ...fn, custom: true }));

  return [...cores, ...extras].sort((a, b) => a.date.localeCompare(b.date));
}

export function resolveDayName(state: WeddingState, dayId: number): string {
  return (
    state.functions.find((fn) => fn.id === dayId)?.name ||
    LEGACY_DAY_NAMES[dayId] ||
    "Event"
  );
}

export function resolveFunctionDateLabel(state: WeddingState, dayId: number): string {
  const fn = state.functions.find((f) => f.id === dayId);
  if (!fn?.date) return "";
  const date = new Date(`${fn.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${date.getDate()}`;
}

export function functionIds(state: WeddingState): number[] {
  return [...state.functions].sort((a, b) => a.date.localeCompare(b.date)).map((f) => f.id);
}

export function addWeddingFunction(
  state: WeddingState,
  name: string,
  date: string,
): WeddingState {
  const trimmed = name.trim();
  if (!trimmed || !date) return state;

  const used = new Set(state.functions.map((f) => f.id));
  let nextId = Math.max(3, ...state.functions.map((f) => f.id)) + 1;
  while (used.has(nextId) || isCoreWeddingFunction(nextId)) nextId += 1;

  const newFunction: WeddingFunction = {
    id: nextId,
    name: trimmed,
    date,
    custom: true,
  };

  const newRows: MenuRow[] = MENU_COURSES.map((course) =>
    normalizeMenuRow({
      id: createId("mn"),
      day: nextId,
      course,
      items: "",
      notes: "",
      plateCount: "",
      rate: "",
      estimate: "",
      status: "Discuss",
      categories: emptyMenuCategoryDraft(),
    }),
  );

  return {
    ...state,
    functions: [...state.functions, newFunction].sort((a, b) => a.date.localeCompare(b.date)),
    menu: [...state.menu, ...newRows],
  };
}

export function canRemoveWeddingFunction(state: WeddingState, dayId: number): boolean {
  if (isCoreWeddingFunction(dayId)) return false;
  return state.functions.some((f) => f.id === dayId);
}

export function removeWeddingFunction(state: WeddingState, dayId: number): WeddingState {
  if (!canRemoveWeddingFunction(state, dayId)) return state;

  return {
    ...state,
    functions: state.functions.filter((f) => f.id !== dayId),
    menu: state.menu.filter((row) => Number(row.day) !== dayId),
  };
}

export function swapMenuCourses(
  state: WeddingState,
  day: number,
  fromCourse: MenuCourse,
  toCourse: MenuCourse,
): WeddingState {
  if (fromCourse === toCourse) return state;

  const menu = [...state.menu];
  const indexA = menu.findIndex((r) => Number(r.day) === day && r.course === fromCourse);
  const indexB = menu.findIndex((r) => Number(r.day) === day && r.course === toCourse);

  if (indexA < 0 || indexB < 0) return state;

  const rowA = { ...menu[indexA] };
  const rowB = { ...menu[indexB] };

  const swapPayload = (source: MenuRow, targetCourse: MenuCourse, targetId: string) => ({
    ...source,
    id: targetId,
    course: targetCourse,
    day,
  });

  menu[indexA] = swapPayload(rowB, fromCourse, rowA.id);
  menu[indexB] = swapPayload(rowA, toCourse, rowB.id);

  return { ...state, menu };
}

export function formatFunctionDateFull(iso: string): string {
  if (!iso?.trim()) return "Not set";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function weddingScheduleNeedsSetup(state: WeddingState): boolean {
  return !state.event.scheduleConfirmed;
}

function parseIsoDate(iso: string): Date | null {
  if (!iso?.trim()) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(date: Date, withYear = false): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const base = `${month} ${date.getDate()}`;
  if (!withYear) return base;
  return `${base}, ${date.getFullYear()}`;
}

function formatCelebrationSpan(first: Date, last: Date): string {
  const sameDay =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth() &&
    first.getDate() === last.getDate();
  if (sameDay) return formatShortDate(first, true);

  const sameMonth =
    first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameMonth) {
    const month = first.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
  }
  if (sameYear) {
    return `${formatShortDate(first)} – ${formatShortDate(last)}, ${first.getFullYear()}`;
  }
  return `${formatShortDate(first, true)} – ${formatShortDate(last, true)}`;
}

export type WeddingScheduleHomeCopy = {
  label: string;
  headline: string;
  detail: string;
  shortRange: string;
  eventsLine: string;
};

function formatHeroRange(first: Date, last: Date): string {
  const month = first.toLocaleDateString("en-US", { month: "short" });
  if (
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth() &&
    first.getDate() === last.getDate()
  ) {
    return `${first.getDate()} ${month}`;
  }
  if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${month}`;
  }
  const lastMonth = last.toLocaleDateString("en-US", { month: "short" });
  return `${first.getDate()} ${month} – ${last.getDate()} ${lastMonth}`;
}

/** Copy for Home hero — range + function names, or a clear setup prompt. */
export function formatWeddingScheduleHome(state: WeddingState): WeddingScheduleHomeCopy {
  const sorted = [...state.functions].sort((a, b) => a.date.localeCompare(b.date));
  const eventsLine = sorted.map((fn) => fn.name).filter(Boolean).join(" · ");

  if (weddingScheduleNeedsSetup(state)) {
    const names = sorted
      .slice(0, 3)
      .map((fn) => fn.name)
      .filter(Boolean)
      .join(" · ");
    return {
      label: "Dates & events",
      headline: "When is your wedding week?",
      detail: names ? `${names} — tap to set dates` : "Tap to set Sangeet, Marriage & Reception",
      shortRange: "Dates",
      eventsLine: names,
    };
  }

  if (!sorted.length) {
    return {
      label: "Dates & events",
      headline: "No functions yet",
      detail: "Tap to add your celebration dates",
      shortRange: "Dates",
      eventsLine: "",
    };
  }

  const first = parseIsoDate(sorted[0].date);
  const last = parseIsoDate(sorted[sorted.length - 1].date);
  const headline =
    first && last ? formatCelebrationSpan(first, last) : "Dates saved";
  const shortRange = first && last ? formatHeroRange(first, last) : "Dates";

  const dayCount = sorted.length;

  return {
    label: "Dates & events",
    headline,
    detail: `${dayCount} ${dayCount === 1 ? "day" : "days"} · ${eventsLine}`,
    shortRange,
    eventsLine,
  };
}

export function formatWeddingScheduleSummary(state: WeddingState): string {
  const ids = functionIds(state);
  if (!ids.length) return "Dates not set";
  return ids
    .map((id) => {
      const label = resolveFunctionDateLabel(state, id);
      return label ? `${resolveDayName(state, id)} ${label}` : resolveDayName(state, id);
    })
    .join(" · ");
}

export type FunctionScheduleDraft = Pick<WeddingFunction, "id" | "name" | "date" | "custom">;

export function buildFunctionScheduleDraft(state: WeddingState): FunctionScheduleDraft[] {
  return [...state.functions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((fn) => ({
      id: fn.id,
      name: fn.name,
      date: fn.date,
      custom: fn.custom,
    }));
}

export function proposeCoreDatesForStart(
  functions: FunctionScheduleDraft[],
  previousStart: string,
  nextStart: string,
): FunctionScheduleDraft[] {
  if (!nextStart.trim()) return functions;
  const prevEvent = { startDate: previousStart || PLACEHOLDER_START_DATE } as EventInfo;
  const nextEvent = { startDate: nextStart } as EventInfo;
  return functions.map((fn) => {
    if (fn.custom || !isCoreWeddingFunction(fn.id)) return fn;
    if (fn.date === defaultFunctionDate(prevEvent, fn.id)) {
      return { ...fn, date: defaultFunctionDate(nextEvent, fn.id) };
    }
    return fn;
  });
}

export function applyWeddingSchedule(
  state: WeddingState,
  startDate: string,
  functions: FunctionScheduleDraft[],
): WeddingState {
  const trimmedStart = startDate.trim();
  if (!trimmedStart) return state;

  const byId = new Map(functions.map((fn) => [fn.id, fn]));
  const nextFunctions = state.functions
    .map((fn) => {
      const draft = byId.get(fn.id);
      if (!draft?.date?.trim()) return fn;
      return {
        ...fn,
        name: draft.name.trim() || fn.name,
        date: draft.date,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const sangeetDate = nextFunctions.find((fn) => fn.id === 1)?.date?.trim() || trimmedStart;

  return {
    ...state,
    event: {
      ...state.event,
      startDate: sangeetDate,
      scheduleConfirmed: true,
    },
    functions: nextFunctions,
  };
}
