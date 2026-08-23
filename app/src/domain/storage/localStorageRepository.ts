import { DEFAULT_WEDDING_STATE, STORAGE_KEY } from "../defaults";
import { normalizeFunctions } from "../functions";
import { normalizeGuestRow } from "../guest";
import { normalizeMenu } from "../menu";
import type { EventInfo, MenuRow, WeddingState } from "../types";
import type { WeddingRepository } from "./types";

function normalizeEvent(event: Partial<EventInfo> = {}): EventInfo {
  return {
    ...DEFAULT_WEDDING_STATE.event,
    ...event,
    startDate: event.startDate || DEFAULT_WEDDING_STATE.event.startDate,
  };
}

const MENU_SEED_VERSION = 2;

function loadRawState(): WeddingState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("functionflow.v1");
    if (!raw) {
      localStorage.setItem("biyeflow.menuSeed", String(MENU_SEED_VERSION));
      return {
        ...structuredClone(DEFAULT_WEDDING_STATE),
        menu: normalizeMenu(undefined, DEFAULT_WEDDING_STATE.menu),
        functions: DEFAULT_WEDDING_STATE.functions,
      };
    }
    const saved = JSON.parse(raw) as Partial<WeddingState>;
    const event = normalizeEvent(saved.event);
    const state: WeddingState = {
      event,
      functions: normalizeFunctions(saved.functions, event),
      tasks: Array.isArray(saved.tasks) ? saved.tasks : DEFAULT_WEDDING_STATE.tasks,
      research: Array.isArray(saved.research) ? saved.research : DEFAULT_WEDDING_STATE.research,
      reminders: Array.isArray(saved.reminders) ? saved.reminders : DEFAULT_WEDDING_STATE.reminders,
      guests: Array.isArray(saved.guests)
        ? saved.guests.map(normalizeGuestRow)
        : DEFAULT_WEDDING_STATE.guests,
      menu: normalizeMenu(saved.menu as MenuRow[] | undefined, DEFAULT_WEDDING_STATE.menu),
      theme: { ...DEFAULT_WEDDING_STATE.theme, ...(saved.theme || {}) },
    };

    const menuSeed = Number(localStorage.getItem("biyeflow.menuSeed") || 0);
    if (menuSeed < MENU_SEED_VERSION) {
      state.menu = normalizeMenu(undefined, DEFAULT_WEDDING_STATE.menu);
      localStorage.setItem("biyeflow.menuSeed", String(MENU_SEED_VERSION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    return state;
  } catch {
    return structuredClone(DEFAULT_WEDDING_STATE);
  }
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
    const event = normalizeEvent(parsed.event);
    const state: WeddingState = {
      event,
      functions: normalizeFunctions(parsed.functions, event),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      research: Array.isArray(parsed.research) ? parsed.research : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      guests: Array.isArray(parsed.guests) ? parsed.guests.map(normalizeGuestRow) : [],
      menu: normalizeMenu(parsed.menu as MenuRow[] | undefined, DEFAULT_WEDDING_STATE.menu),
      theme: { ...DEFAULT_WEDDING_STATE.theme, ...(parsed.theme || {}) },
    };
    localStorageRepository.save(state);
    return state;
  },
};
