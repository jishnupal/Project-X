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
  _snapshot: AccessSnapshot | null,
  _canManage: boolean,
): SetupTask[] {
  const buzz = { ...DEFAULT_BUZZ, ...state.buzz };
  const buzzReady =
    Boolean(buzz.welcomeTitle?.trim()) &&
    Boolean(buzz.welcomeMessage?.trim()) &&
    Boolean(buzz.venueName?.trim());

  const tasks: SetupTask[] = [
    {
      id: "dates",
      label: "Lock the dates",
      hint: "Set the days of the week",
      to: "/command-center",
      done: !weddingScheduleNeedsSetup(state),
    },
    {
      id: "buzz",
      label: "Write the invite",
      hint: "What guests see in Buzz",
      to: "/buzz",
      done: buzzReady,
    },
    {
      id: "guests",
      label: "Add the people",
      hint: "Families and headcount",
      to: "/people/contacts",
      done: (state.guests?.length || 0) > 0,
    },
    {
      id: "menu",
      label: "Set the food",
      hint: "Courses for each day",
      to: "/people/menu",
      done: (state.menu?.length || 0) > 0,
    },
  ];

  return tasks;
}

export function setupProgress(tasks: SetupTask[]): { done: number; total: number; pct: number } {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
