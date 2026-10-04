import type { EventInfo, MenuCourse, MenuRow, WeddingFunction, WeddingState } from "./types";
import { createId } from "./event";
import { MENU_COURSES, emptyMenuCategoryDraft, normalizeMenuRow } from "./menu";

/** @deprecated Legacy label only — not used to block calendar picks. */
export const PLACEHOLDER_START_DATE = "2027-03-07";

/** @deprecated Kept for older saves that used fixed day ids 1–3. New events have no defaults. */
export const CORE_FUNCTION_IDS = [1, 2, 3] as const;

export function isCoreWeddingFunction(_dayId: number): boolean {
  return false;
}

/** Any non-empty calendar day the host picks is real — including 7 March. */
export function isRealEventDate(iso: string | undefined | null): boolean {
  const value = String(iso || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

/** @deprecated Offset defaults are no longer applied. */
export function functionOffset(_day: number): number {
  return 0;
}

export function defaultFunctionDate(event: EventInfo, _dayId: number): string {
  return isRealEventDate(event.startDate) ? String(event.startDate).trim() : "";
}

/** Demo seed only — new / empty events stay at `functions: []`. */
export function buildDefaultFunctions(_event: EventInfo): WeddingFunction[] {
  return [];
}

function sortByDate(a: { date: string }, b: { date: string }): number {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date.localeCompare(b.date);
}

function nextFunctionId(existing: { id: number }[]): number {
  const used = new Set(existing.map((fn) => Number(fn.id)));
  let nextId = 1;
  while (used.has(nextId)) nextId += 1;
  return nextId;
}

export function normalizeFunctions(
  functions: WeddingFunction[] | undefined,
  _event: EventInfo,
): WeddingFunction[] {
  if (!Array.isArray(functions) || functions.length === 0) return [];

  return functions
    .map((fn) => {
      const id = Number(fn.id);
      const rawDate = String(fn.date || "").trim();
      const date = isRealEventDate(rawDate) ? rawDate : "";
      const name = String(fn.name || "").trim() || "Event";
      return {
        id,
        name,
        date,
        custom: true,
      } satisfies WeddingFunction;
    })
    // Persist every host-dated day. Blank rows (including old undated stubs) drop.
    .filter((fn) => isRealEventDate(fn.date) && fn.name.trim())
    .sort(sortByDate);
}

/** Days that belong on The Plot — only Dates with a real calendar day. */
export function datedWeddingFunctions(state: WeddingState): WeddingFunction[] {
  return [...(state.functions || [])]
    .filter((fn) => isRealEventDate(fn.date) && String(fn.name || "").trim())
    .sort(sortByDate);
}

export function resolveDayName(state: WeddingState, dayId: number): string {
  return state.functions.find((fn) => fn.id === dayId)?.name || "Event";
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
  return datedWeddingFunctions(state).map((f) => f.id);
}

export function addWeddingFunction(
  state: WeddingState,
  name: string,
  date: string,
): WeddingState {
  const trimmed = name.trim();
  if (!trimmed || !isRealEventDate(date)) return state;

  const nextId = nextFunctionId(state.functions);

  const newFunction: WeddingFunction = {
    id: nextId,
    name: trimmed,
    date: date.trim(),
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
    functions: [...state.functions, newFunction].sort(sortByDate),
    menu: [...state.menu, ...newRows],
  };
}

export function canRemoveWeddingFunction(state: WeddingState, dayId: number): boolean {
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
  if (!state.event.scheduleConfirmed) return true;
  if (!isRealEventDate(state.event.startDate)) return true;
  return !state.functions.some((fn) => isRealEventDate(fn.date));
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

export type ScheduleDayPreview = {
  id: number;
  name: string;
  day: string;
  month: string;
  weekday: string;
  detail: string;
};

export function functionDateParts(iso: string) {
  if (!iso?.trim()) {
    return { day: "—", weekday: "SET", month: "DATE", detail: "Pick a day" };
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { day: "—", weekday: "SET", month: "DATE", detail: "Pick a day" };
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    detail: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
  };
}

export type WeddingScheduleHomeCopy = {
  label: string;
  headline: string;
  detail: string;
  shortRange: string;
  eventsLine: string;
  days: ScheduleDayPreview[];
};

function scheduleDays(state: WeddingState): ScheduleDayPreview[] {
  return datedWeddingFunctions(state).map((fn) => ({
    id: fn.id,
    name: fn.name || "Event",
    ...functionDateParts(fn.date),
  }));
}

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
  const sorted = datedWeddingFunctions(state);
  const eventsLine = sorted.map((fn) => fn.name).filter(Boolean).join(" · ");
  const days = scheduleDays(state);

  if (weddingScheduleNeedsSetup(state) || !sorted.length) {
    return {
      label: "Dates & events",
      headline: "When are your event days?",
      detail: "Tap to add your event days",
      shortRange: "Dates",
      eventsLine: "",
      days,
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
    days,
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
    .map((fn) => ({
      id: fn.id,
      name: fn.name,
      date: isRealEventDate(fn.date) ? fn.date : "",
      custom: true,
    }))
    .sort(sortByDate);
}

export function applyWeddingSchedule(
  state: WeddingState,
  _startDate: string,
  functions: FunctionScheduleDraft[],
): WeddingState {
  const dated = functions.filter((fn) => isRealEventDate(fn.date) && fn.name.trim());
  const previousIds = new Set(state.functions.map((fn) => fn.id));

  if (!dated.length) {
    return {
      ...state,
      event: {
        ...state.event,
        startDate: "",
        scheduleConfirmed: false,
      },
      functions: [],
      menu: state.menu.filter((row) => !previousIds.has(Number(row.day))),
    };
  }

  const trimmedStart = [...dated].sort(sortByDate)[0]?.date?.trim() || "";
  if (!trimmedStart) return state;

  const existingIds = previousIds;
  const existingById = new Map(state.functions.map((fn) => [fn.id, fn]));

  const nextFunctions = dated
    .map((fn) => {
      const existing = existingById.get(fn.id);
      return {
        id: fn.id,
        name: fn.name.trim() || existing?.name || "Event",
        date: fn.date.trim(),
        custom: true,
      } satisfies WeddingFunction;
    })
    .sort(sortByDate);

  const nextIds = new Set(nextFunctions.map((fn) => fn.id));
  const created = nextFunctions.filter((fn) => !existingIds.has(fn.id));
  const newRows: MenuRow[] = created.flatMap((fn) =>
    MENU_COURSES.map((course) =>
      normalizeMenuRow({
        id: createId("mn"),
        day: fn.id,
        course,
        items: "",
        notes: "",
        plateCount: "",
        rate: "",
        estimate: "",
        status: "Discuss",
        categories: emptyMenuCategoryDraft(),
      }),
    ),
  );

  return {
    ...state,
    event: {
      ...state.event,
      startDate: trimmedStart,
      scheduleConfirmed: true,
    },
    functions: nextFunctions,
    menu: [
      ...state.menu.filter((row) => nextIds.has(Number(row.day))),
      ...newRows,
    ],
  };
}
