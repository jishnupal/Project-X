import type { EventInfo, MenuCourse, MenuRow, WeddingFunction, WeddingState } from "./types";
import { createId } from "./event";
import { MENU_COURSES, emptyMenuCategoryDraft, normalizeMenuRow } from "./menu";

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
