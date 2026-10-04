import { createId } from "./event";
import type { BuddyTask, GuestRow } from "./types";

export function listBuddies(guests: GuestRow[]): GuestRow[] {
  return (guests || []).filter((row) => row.isBuddy);
}

export function normalizeBuddyTask(row: unknown): BuddyTask | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Partial<BuddyTask>;
  const title = String(raw.title || "").trim();
  if (!title) return null;
  return {
    id: String(raw.id || createId("bt")),
    title,
    guestId: String(raw.guestId || ""),
    done: Boolean(raw.done),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function normalizeBuddyTasks(rows: unknown): BuddyTask[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeBuddyTask).filter((row): row is BuddyTask => Boolean(row));
}

export function createBuddyTask(title: string, guestId: string): BuddyTask {
  const now = Date.now();
  return {
    id: createId("bt"),
    title: title.trim(),
    guestId,
    done: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function touchBuddyTask(row: BuddyTask, patch: Partial<BuddyTask>): BuddyTask {
  return {
    ...row,
    ...patch,
    id: row.id,
    updatedAt: Date.now(),
  };
}

export function tasksForBuddy(tasks: BuddyTask[], guestId: string): BuddyTask[] {
  return (tasks || []).filter((row) => row.guestId === guestId);
}

export function buddyTaskProgress(tasks: BuddyTask[]) {
  const total = tasks.length;
  const done = tasks.filter((row) => row.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, open: total - done, pct };
}
