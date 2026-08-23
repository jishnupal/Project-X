import type { EventInfo } from "./types";

const DAY_NAMES: Record<number, string> = {
  1: "Sangeet",
  2: "Marriage",
  3: "Reception",
  4: "Borjatri",
};

export function dayName(day: number): string {
  return DAY_NAMES[Number(day)] ?? "Wedding";
}

export function functionOffset(day: number): number {
  return ({ 1: 0, 2: 2, 3: 4, 4: 2 } as Record<number, number>)[Number(day)] ?? 0;
}

export function getStartDate(event: EventInfo): Date {
  return new Date(`${event.startDate}T00:00:00`);
}

export function getFunctionDate(event: EventInfo, day: number): Date {
  const base = getStartDate(event);
  if (Number.isNaN(base.getTime())) return base;
  base.setDate(base.getDate() + functionOffset(day));
  return base;
}

export function formatDate(event: EventInfo, day: number): string {
  const date = getFunctionDate(event, day);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${date.getDate()}`;
}

export function functionDateLabel(event: EventInfo, day: number): string {
  const date = formatDate(event, day);
  return date ? `${dayName(day)} - ${date}` : dayName(day);
}

export function createId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
