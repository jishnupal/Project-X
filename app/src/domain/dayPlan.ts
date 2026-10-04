import { createId } from "./event";
import type { DayPlan, DayPlanBlock, DayBlockKind, WeddingState } from "./types";

export const DAY_BLOCK_KINDS: Array<{ id: DayBlockKind; label: string; icon: string }> = [
  { id: "moment", label: "Moment", icon: "celebration" },
  { id: "travel", label: "Travel", icon: "directions_car" },
  { id: "place", label: "Place", icon: "location_on" },
  { id: "meal", label: "Meal", icon: "restaurant" },
  { id: "activity", label: "Activity", icon: "sports_volleyball" },
  { id: "note", label: "Note", icon: "sticky_note_2" },
];

export function blockKindMeta(kind?: DayBlockKind) {
  return DAY_BLOCK_KINDS.find((row) => row.id === kind) || DAY_BLOCK_KINDS[0];
}

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

function cleanTime(value: unknown): string | undefined {
  const raw = cleanText(value);
  if (!raw) return undefined;
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  return undefined;
}

export function normalizeDayPlanBlock(raw: Partial<DayPlanBlock> | null | undefined): DayPlanBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const title = cleanText(raw.title);
  if (!title) return null;
  const kind = DAY_BLOCK_KINDS.some((row) => row.id === raw.kind) ? (raw.kind as DayBlockKind) : undefined;
  return {
    id: cleanText(raw.id) || createId("beat"),
    kind,
    title,
    timeStart: cleanTime(raw.timeStart),
    timeEnd: cleanTime(raw.timeEnd),
    place: cleanText(raw.place) || undefined,
    mapsUrl: cleanText(raw.mapsUrl) || undefined,
    fromPlace: cleanText(raw.fromPlace) || undefined,
    toPlace: cleanText(raw.toPlace) || undefined,
    owner: cleanText(raw.owner) || undefined,
    notes: cleanText(raw.notes) || undefined,
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
  };
}

export function normalizeDayPlan(
  dayId: number,
  raw: Partial<DayPlan> | null | undefined,
): DayPlan {
  const blocks = (Array.isArray(raw?.blocks) ? raw.blocks : [])
    .map((row) => normalizeDayPlanBlock(row))
    .filter((row): row is DayPlanBlock => Boolean(row))
    .sort((a, b) => {
      const ta = a.timeStart || "";
      const tb = b.timeStart || "";
      if (ta && tb && ta !== tb) return ta.localeCompare(tb);
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      return a.order - b.order;
    })
    .map((row, index) => ({ ...row, order: index }));

  const placeLabel = cleanText(raw?.place?.label);
  return {
    dayId,
    place: placeLabel
      ? { label: placeLabel, mapsUrl: cleanText(raw?.place?.mapsUrl) || undefined }
      : undefined,
    blocks,
  };
}

export function normalizeDayPlans(raw: unknown): Record<string, DayPlan> {
  if (!raw || typeof raw !== "object") return {};
  const next: Record<string, DayPlan> = {};
  for (const [key, value] of Object.entries(raw as Record<string, Partial<DayPlan>>)) {
    const dayId = Number(key) || Number(value?.dayId) || 0;
    if (!dayId) continue;
    const plan = normalizeDayPlan(dayId, value);
    if (plan.blocks.length || plan.place) next[String(dayId)] = plan;
  }
  return next;
}

export function getDayPlan(state: WeddingState, dayId: number): DayPlan {
  const existing = state.dayPlans?.[String(dayId)];
  return normalizeDayPlan(dayId, existing);
}

export function upsertDayPlan(state: WeddingState, plan: DayPlan): WeddingState {
  const normalized = normalizeDayPlan(plan.dayId, plan);
  const next = { ...(state.dayPlans || {}) };
  if (!normalized.blocks.length && !normalized.place) {
    delete next[String(plan.dayId)];
  } else {
    next[String(plan.dayId)] = normalized;
  }
  return { ...state, dayPlans: next };
}

export function createDayBlock(input: {
  title: string;
  kind?: DayBlockKind;
  timeStart?: string;
  timeEnd?: string;
  place?: string;
  mapsUrl?: string;
  fromPlace?: string;
  toPlace?: string;
  owner?: string;
  notes?: string;
  order?: number;
}): DayPlanBlock {
  return (
    normalizeDayPlanBlock({
      id: createId("beat"),
      ...input,
      order: input.order ?? 0,
    }) || {
      id: createId("beat"),
      title: "Beat",
      order: 0,
    }
  );
}

export function formatBeatTime(isoTime?: string): string {
  if (!isoTime) return "";
  const [hRaw, m] = isoTime.split(":").map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(m)) return isoTime;
  const suffix = hRaw >= 12 ? "p" : "a";
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function dayFeelLine(index: number, total: number): string {
  if (total <= 1) return "The whole plan in one day.";
  if (index === 0) return "Day one. The plan starts here.";
  if (index === total - 1) return "Last day. Bring it home.";
  if (total === 3 && index === 1) return "The middle stretch.";
  return `Day ${index + 1} of ${total}.`;
}
