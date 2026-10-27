import { DEFAULT_BUZZ, DEFAULT_WEDDING_STATE, STORAGE_KEY } from "../defaults";
import { normalizeStayRooms } from "../rooms";
import { isRealEventDate, normalizeFunctions } from "../functions";
import { normalizeBuddyTasks } from "../buddies";
import { normalizeActivity } from "../activity";
import { normalizeDayPlans } from "../dayPlan";
import { normalizeGuestRow, reconcileGuestGroups } from "../guest";
import { normalizeMenu } from "../menu";
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
  const rawStart = String(event.startDate || "").trim();
  return {
    ...DEFAULT_WEDDING_STATE.event,
    ...event,
    startDate: isRealEventDate(rawStart) ? rawStart : "",
    scheduleConfirmed: Boolean(event.scheduleConfirmed) && isRealEventDate(rawStart),
  };
}

const MENU_SEED_VERSION = 2;
const RECEPTION_DINNER_SEED_KEY = "biyeflow.receptionDinnerSeed";
const RECEPTION_DINNER_SEED_VERSION = "2";
const GUEST_DEMO_SEED_KEY = "biyeflow.guestDemoSeed";
const GUEST_DEMO_SEED_VERSION = "1";

function emptyLocalState(): WeddingState {
  const fresh = structuredClone(DEFAULT_WEDDING_STATE);
  return {
    ...fresh,
    event: {
      ...fresh.event,
      name: "",
      guests: "",
      startDate: "",
      scheduleConfirmed: false,
    },
    functions: [],
    tasks: [],
    guests: [],
    guestGroups: [],
    menu: [],
    rooms: [],
    buzz: {
      welcomeTitle: "",
      welcomeMessage: "",
      invitationNote: "",
      venueName: "",
      venueAddress: "",
      venueMapUrl: "",
      passArtUrl: "",
      letterPhotoUrl: "",
    },
    modules: { stay: false, menu: false, asked: false },
    activity: [],
    dayPlans: {},
  };
}

function loadRawState(): WeddingState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("functionflow.v1");
    if (!raw) {
      const fresh = emptyLocalState();
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
    : [];
  const grouped = reconcileGuestGroups(parsed?.guestGroups, guests);
  const functions = normalizeFunctions(parsed?.functions, event);
  const hasDatedDay = functions.some((fn) => isRealEventDate(fn.date));
  const earliest =
    [...functions]
      .filter((fn) => isRealEventDate(fn.date))
      .sort((a, b) => a.date.localeCompare(b.date))[0]?.date || "";
  const startDate =
    (isRealEventDate(event.startDate) && functions.some((fn) => fn.date === event.startDate)
      ? event.startDate
      : "") || earliest || "";
  const recovered = applyReceptionDinnerSeed(
    recoverIntactWedding({
      event: {
        ...event,
        startDate,
        // Confirmed only when at least one real day exists.
        scheduleConfirmed: hasDatedDay,
      },
      functions,
      tasks: normalizeBuddyTasks(parsed?.tasks),
      research: Array.isArray(parsed?.research) ? parsed.research : DEFAULT_WEDDING_STATE.research,
      reminders: Array.isArray(parsed?.reminders) ? parsed.reminders : DEFAULT_WEDDING_STATE.reminders,
      guests: grouped.guests,
      guestGroups: grouped.guestGroups,
      menu: normalizeMenu(
        Array.isArray(parsed?.menu) ? (parsed.menu as MenuRow[]) : [],
        [],
      ),
      rooms: normalizeStayRooms(Array.isArray(parsed?.rooms) ? parsed.rooms : [], grouped.guests),
      theme: { ...DEFAULT_WEDDING_STATE.theme, ...(parsed?.theme || {}) },
      grandMealByDay: normalizeGrandMealByDay(parsed?.grandMealByDay),
      buzz: { ...DEFAULT_BUZZ, ...(parsed?.buzz || {}) },
      modules: {
        stay: Boolean(parsed?.modules?.stay),
        menu: Boolean(parsed?.modules?.menu),
        asked: Boolean(parsed?.modules?.asked) || Boolean(parsed?.modules?.stay) || Boolean(parsed?.modules?.menu),
      },
      activity: normalizeActivity(parsed?.activity),
      destination: parsed?.destination?.label
        ? {
            label: String(parsed.destination.label).trim(),
            mapsUrl: parsed.destination.mapsUrl
              ? String(parsed.destination.mapsUrl).trim()
              : undefined,
          }
        : undefined,
      dayPlans: normalizeDayPlans(parsed?.dayPlans),
    }),
  );
  return recovered;
}

/** Legacy demo menu filler — kept as identity so hydrate never rewrites host menus. */
export function recoverIntactWedding(state: WeddingState): WeddingState {
  return state;
}

/** Legacy reception dinner filler — identity; host Dates/Menu stay as saved. */
export function applyReceptionDinnerSeed(state: WeddingState): WeddingState {
  return state;
}

export function applyGuestDemoSeed(state: WeddingState): WeddingState {
  try {
    localStorage.setItem(GUEST_DEMO_SEED_KEY, GUEST_DEMO_SEED_VERSION);
  } catch {
    /* ignore */
  }
  return state;
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
