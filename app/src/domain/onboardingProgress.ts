import type { AccessSnapshot } from "./access/types";
import type { WeddingState } from "./types";
import { DEFAULT_BUZZ } from "./defaults";
import { weddingScheduleNeedsSetup } from "./functions";

export type SetupTask = {
  id: string;
  label: string;
  hint: string;
  to: string;
  done: boolean;
};

export function buildSetupTasks(
  state: WeddingState,
  snapshot: AccessSnapshot | null,
  canManage: boolean,
): SetupTask[] {
  const buzz = { ...DEFAULT_BUZZ, ...state.buzz };
  const buzzReady =
    Boolean(buzz.welcomeTitle?.trim()) &&
    Boolean(buzz.welcomeMessage?.trim()) &&
    Boolean(buzz.venueName?.trim());

  const tasks: SetupTask[] = [
    {
      id: "dates",
      label: "Set wedding dates",
      hint: "Your celebration week",
      to: "/command-center",
      done: !weddingScheduleNeedsSetup(state),
    },
    {
      id: "buzz",
      label: "Set up BUZZ for guests",
      hint: "Welcome message, invitation note, venue",
      to: "/buzz",
      done: buzzReady,
    },
    {
      id: "guests",
      label: "Add your first families",
      hint: "Guest list & headcount",
      to: "/people/guests",
      done: (state.guests?.length || 0) > 0,
    },
    {
      id: "menu",
      label: "Plan the menu",
      hint: "Courses for each function",
      to: "/people/menu",
      done: (state.menu?.length || 0) > 0,
    },
  ];

  if (canManage) {
    tasks.push({
      id: "buddies",
      label: "Invite Buddies (optional)",
      hint: "Helpers with module access",
      to: "/buddies",
      done: (snapshot?.profiles || []).some((p) => p.role === "buddy"),
    });
    tasks.push({
      id: "guest-link",
      label: "Share guest invite link",
      hint: "From Buddies — guests see BUZZ only",
      to: "/buddies",
      done: Boolean(snapshot?.guestInviteToken),
    });
  }

  return tasks;
}

export function setupProgress(tasks: SetupTask[]): { done: number; total: number; pct: number } {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
