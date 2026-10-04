import { DEFAULT_BUZZ } from "./defaults";
import { menuItemsArray } from "./menu";
import { buildSetupTasks, setupProgress } from "./onboardingProgress";
import { roomMetrics } from "./rooms";
import { buddyTaskProgress } from "./buddies";
import type { WeddingState } from "./types";

function menuPending(menu: WeddingState["menu"]): number {
  const rows = menu || [];
  if (rows.length === 0) return 1;
  return rows.filter((row) => menuItemsArray(row).length === 0 || row.status !== "Confirmed").length;
}

function dayHeadcount(row: WeddingState["guests"][number]): number {
  return [row.receptionCount, row.sangeetCount, row.biyebariCount, row.borjatriCount].reduce(
    (sum, value) => sum + (Number.parseInt(String(value || "0"), 10) || 0),
    0,
  );
}

/** Pending work on each Home module card. Zero means no badge. */
export function homeCardPending(state: WeddingState): {
  invitations: number;
  contacts: number;
  days: number;
  stay: number;
  menu: number;
  buzz: number;
  buddies: number;
} {
  const guests = state.guests || [];
  const buzz = { ...DEFAULT_BUZZ, ...state.buzz };
  const buzzMissing = [buzz.welcomeTitle, buzz.welcomeMessage, buzz.venueName].filter((value) => !value?.trim()).length;
  const stayWaiting = roomMetrics(state);
  return {
    invitations: guests.filter((row) => !row.invitationSent).length,
    contacts: guests.length === 0 ? 1 : 0,
    days: guests.length === 0 ? 1 : guests.filter((row) => dayHeadcount(row) === 0).length,
    stay: stayWaiting.totalGuestsNeedingStay === 0 ? 0 : stayWaiting.unassignedGuests,
    menu: menuPending(state.menu),
    buzz: buzzMissing,
    buddies: buddyTaskProgress(state.tasks || []).open,
  };
}

export { buildSetupTasks, setupProgress };
