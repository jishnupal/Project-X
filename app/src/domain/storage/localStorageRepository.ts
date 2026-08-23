import { DEFAULT_WEDDING_STATE, STORAGE_KEY } from "../defaults";
import { normalizeFunctions } from "../functions";
import { normalizeGuestRow, reconcileGuestGroups, syncEventGuestCount } from "../guest";
import { menuItemsArray, normalizeMenu, normalizeMenuRow } from "../menu";
import type { EventInfo, GrandMealCourse, MenuRow, WeddingState } from "../types";
import type { WeddingRepository } from "./types";

function normalizeGrandMealByDay(
  value: WeddingState["grandMealByDay"] | undefined,
): Record<string, GrandMealCourse> {
  if (!value || typeof value !== "object") return {};
  const next: Record<string, GrandMealCourse> = {};
  for (const [day, course] of Object.entries(value)) {
    if (course === "Lunch" || course === "Dinner") next[String(day)] = course;
  }
  return next;
}

function normalizeEvent(event: Partial<EventInfo> = {}): EventInfo {
  return {
    ...DEFAULT_WEDDING_STATE.event,
    ...event,
    startDate: event.startDate || DEFAULT_WEDDING_STATE.event.startDate,
  };
}

const MENU_SEED_VERSION = 2;
const RECEPTION_DINNER_SEED_KEY = "biyeflow.receptionDinnerSeed";
const RECEPTION_DINNER_SEED_VERSION = "2";
const GUEST_DEMO_SEED_KEY = "biyeflow.guestDemoSeed";
const GUEST_DEMO_SEED_VERSION = "1";

function loadRawState(): WeddingState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("functionflow.v1");
    if (!raw) {
      const fresh = structuredClone(DEFAULT_WEDDING_STATE);
      localStorage.setItem("biyeflow.menuSeed", String(MENU_SEED_VERSION));
      localStorage.setItem(RECEPTION_DINNER_SEED_KEY, RECEPTION_DINNER_SEED_VERSION);
      localStorage.setItem(GUEST_DEMO_SEED_KEY, GUEST_DEMO_SEED_VERSION);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const state = applyGuestDemoSeed(
      applyReceptionDinnerSeed(
        recoverIntactWedding(hydrateWeddingState(JSON.parse(raw) as Partial<WeddingState>)),
      ),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch {
    return structuredClone(DEFAULT_WEDDING_STATE);
  }
}

export function hydrateWeddingState(parsed: Partial<WeddingState> | null | undefined): WeddingState {
  const event = normalizeEvent(parsed?.event);
  const guests = Array.isArray(parsed?.guests)
    ? parsed.guests.map(normalizeGuestRow)
    : DEFAULT_WEDDING_STATE.guests;
  const grouped = reconcileGuestGroups(parsed?.guestGroups, guests);
  return applyReceptionDinnerSeed(
    recoverIntactWedding({
      event,
      functions: normalizeFunctions(parsed?.functions, event),
      tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : DEFAULT_WEDDING_STATE.tasks,
      research: Array.isArray(parsed?.research) ? parsed.research : DEFAULT_WEDDING_STATE.research,
      reminders: Array.isArray(parsed?.reminders) ? parsed.reminders : DEFAULT_WEDDING_STATE.reminders,
      guests: grouped.guests,
      guestGroups: grouped.guestGroups,
      menu: normalizeMenu(parsed?.menu as MenuRow[] | undefined, DEFAULT_WEDDING_STATE.menu),
      theme: { ...DEFAULT_WEDDING_STATE.theme, ...(parsed?.theme || {}) },
      grandMealByDay: normalizeGrandMealByDay(parsed?.grandMealByDay),
    }),
  );
}

export function recoverIntactWedding(state: WeddingState): WeddingState {
  const lunch = state.menu.find((row) => Number(row.day) === 2 && row.course === "Lunch");
  const lunchItems = lunch ? menuItemsArray(lunch) : [];
  if (lunchItems.length > 0) return state;

  const demoMenu = normalizeMenu(undefined, DEFAULT_WEDDING_STATE.menu);
  const extraDays = state.menu.filter((row) => ![1, 2, 3].includes(Number(row.day)));
  return {
    ...state,
    menu: [...demoMenu, ...extraDays],
    guests: state.guests.length ? state.guests : structuredClone(DEFAULT_WEDDING_STATE.guests),
    functions: state.functions.length
      ? state.functions
      : structuredClone(DEFAULT_WEDDING_STATE.functions),
  };
}

export function applyReceptionDinnerSeed(state: WeddingState): WeddingState {
  const demo = DEFAULT_WEDDING_STATE.menu.find(
    (row) => Number(row.day) === 3 && row.course === "Dinner",
  );
  if (!demo) return state;

  const current = state.menu.find((row) => Number(row.day) === 3 && row.course === "Dinner");
  const alreadyApplied = Boolean(
    current && menuItemsArray(current).some((item) => /nolen gurer/i.test(item)),
  );
  if (alreadyApplied) {
    try {
      localStorage.setItem(RECEPTION_DINNER_SEED_KEY, RECEPTION_DINNER_SEED_VERSION);
    } catch {
      /* ignore */
    }
    return state;
  }

  const nextMenu = state.menu.map((row) => {
    if (Number(row.day) !== 3 || row.course !== "Dinner") return row;
    return {
      ...normalizeMenuRow(demo),
      id: row.id,
      plateCount: row.plateCount || demo.plateCount,
      rate: row.rate || demo.rate,
      estimate: row.estimate || demo.estimate,
    };
  });
  const hasDinner = nextMenu.some((row) => Number(row.day) === 3 && row.course === "Dinner");
  try {
    localStorage.setItem(RECEPTION_DINNER_SEED_KEY, RECEPTION_DINNER_SEED_VERSION);
  } catch {
    /* ignore */
  }
  return {
    ...state,
    menu: hasDinner ? nextMenu : [...nextMenu, normalizeMenuRow(demo)],
  };
}

export function applyGuestDemoSeed(state: WeddingState): WeddingState {
  try {
    if (localStorage.getItem(GUEST_DEMO_SEED_KEY) === GUEST_DEMO_SEED_VERSION) return state;
  } catch {
    /* ignore */
  }
  const guests = structuredClone(DEFAULT_WEDDING_STATE.guests);
  try {
    localStorage.setItem(GUEST_DEMO_SEED_KEY, GUEST_DEMO_SEED_VERSION);
  } catch {
    /* ignore */
  }
  return {
    ...state,
    guests,
    guestGroups: [],
    event: { ...state.event, guests: syncEventGuestCount(guests) },
  };
}

export const localStorageRepository: WeddingRepository = {
  load() {
    return loadRawState();
  },
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  exportBackup() {
    const state = loadRawState();
    return new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
  },
  async importBackup(file) {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<WeddingState>;
    const state = hydrateWeddingState(parsed);
    localStorageRepository.save(state);
    return state;
  },
};
