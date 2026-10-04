import { createId } from "./event";
import { activityDeepLink } from "./notificationRoutes";
import type { ActivityAudience, ActivityItem, ActivityType, WeddingState } from "./types";

export const ACTIVITY_CAP = 30;

export const CHEESY_BROADCAST_PRESETS = [
  { title: "Don't ghost the party", body: "Open Buzz — the latest scoop is waiting." },
  { title: "Plot twist", body: "The plan just got better. Tap in." },
  { title: "Your invite got hotter", body: "Peek at Buzz for the update." },
  { title: "Buddies, assemble", body: "A fresh quest just landed." },
  { title: "Counting on you", body: "Something new for the celebration — open the app." },
  { title: "Psst…", body: "The host dropped a note. You'll want to see it." },
] as const;

export function createActivityItem(input: {
  type: ActivityType;
  title: string;
  body?: string;
  href?: string;
  audience: ActivityAudience;
  targetGuestId?: string;
  targetUserId?: string;
}): ActivityItem {
  return {
    id: createId("act"),
    type: input.type,
    title: input.title.trim(),
    body: input.body?.trim() || undefined,
    href: input.href || activityDeepLink(input.type),
    audience: input.audience,
    targetGuestId: input.targetGuestId,
    targetUserId: input.targetUserId,
    createdAt: Date.now(),
  };
}

export function appendActivity(state: WeddingState, item: ActivityItem): WeddingState {
  const next = [item, ...(state.activity || [])].slice(0, ACTIVITY_CAP);
  return { ...state, activity: next };
}

export function normalizeActivity(rows: unknown): ActivityItem[] {
  if (!Array.isArray(rows)) return [];
  const out: ActivityItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const raw = row as Partial<ActivityItem>;
    const title = String(raw.title || "").trim();
    if (!title) continue;
    const type = String(raw.type || "broadcast") as ActivityType;
    const audience = (raw.audience || "all") as ActivityAudience;
    out.push({
      id: String(raw.id || createId("act")),
      type,
      title,
      body: raw.body ? String(raw.body) : undefined,
      href: raw.href ? String(raw.href) : undefined,
      audience,
      targetGuestId: raw.targetGuestId ? String(raw.targetGuestId) : undefined,
      targetUserId: raw.targetUserId ? String(raw.targetUserId) : undefined,
      createdAt: Number(raw.createdAt) || Date.now(),
    });
  }
  return out.slice(0, ACTIVITY_CAP);
}

export function activityVisibleTo(
  item: ActivityItem,
  role: string,
  opts?: { guestId?: string | null; userId?: string | null },
): boolean {
  const r = role === "admin" || role === "super_admin" ? "host" : role;
  if (item.audience === "all") return true;
  if (item.audience === "host") return r === "host";
  if (item.audience === "guest") return r === "guest" || r === "buddy" || r === "host";
  if (item.audience === "buddy") {
    if (r === "host") return true;
    if (r !== "buddy") return false;
    if (item.targetGuestId && opts?.guestId) return item.targetGuestId === opts.guestId;
    if (item.targetUserId && opts?.userId) return item.targetUserId === opts.userId;
    return !item.targetGuestId && !item.targetUserId;
  }
  return false;
}

const READ_KEY = "biyeflow.activityReadAt";
const READ_IDS_KEY = "biyeflow.activityItemRead";
const DISMISS_KEY = "biyeflow.activityDismissed";

function readIdMap(storageKey: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, string[]>;
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

function writeIdMap(storageKey: string, map: Record<string, string[]>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function idSetFor(storageKey: string, eventCode: string): Set<string> {
  const key = eventCode.toUpperCase();
  const list = readIdMap(storageKey)[key];
  return new Set(Array.isArray(list) ? list : []);
}

function addId(storageKey: string, eventCode: string, id: string): void {
  const key = eventCode.toUpperCase();
  const map = readIdMap(storageKey);
  const next = new Set(Array.isArray(map[key]) ? map[key] : []);
  next.add(id);
  map[key] = [...next].slice(-200);
  writeIdMap(storageKey, map);
  try {
    window.dispatchEvent(new Event("biyeflow:activity-inbox"));
  } catch {
    /* ignore */
  }
}

export function getActivityReadAt(eventCode: string): number {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    return Number(map[eventCode.toUpperCase()] || 0);
  } catch {
    return 0;
  }
}

/** Legacy watermark — kept for migration; prefer per-item read. */
export function setActivityReadAt(eventCode: string, at = Date.now()): void {
  try {
    const key = eventCode.toUpperCase();
    const raw = localStorage.getItem(READ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[key] = at;
    localStorage.setItem(READ_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getDismissedActivityIds(eventCode: string): Set<string> {
  return idSetFor(DISMISS_KEY, eventCode);
}

export function dismissActivityItem(eventCode: string, id: string): void {
  addId(DISMISS_KEY, eventCode, id);
}

export function isActivityItemRead(eventCode: string, item: ActivityItem): boolean {
  if (idSetFor(READ_IDS_KEY, eventCode).has(item.id)) return true;
  // Older sessions used a page-open watermark — keep those items read.
  return item.createdAt <= getActivityReadAt(eventCode);
}

export function markActivityItemRead(eventCode: string, id: string): void {
  addId(READ_IDS_KEY, eventCode, id);
}

export function visibleActivityItems(
  items: ActivityItem[],
  eventCode: string,
  role: string,
  opts?: { guestId?: string | null; userId?: string | null },
): ActivityItem[] {
  const dismissed = getDismissedActivityIds(eventCode);
  return items.filter(
    (item) => !dismissed.has(item.id) && activityVisibleTo(item, role, opts),
  );
}

export function countUnreadActivity(
  items: ActivityItem[],
  eventCode: string,
  role: string,
  opts?: { guestId?: string | null; userId?: string | null },
): number {
  return visibleActivityItems(items, eventCode, role, opts).filter(
    (item) => !isActivityItemRead(eventCode, item),
  ).length;
}
