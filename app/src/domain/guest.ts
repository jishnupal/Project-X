import type { GuestRow, WeddingState } from "./types";
import { createId } from "./event";
import { functionOffset, resolveDayName, resolveFunctionDateLabel } from "./functions";

export type GuestFunctionDay = "1" | "2" | "3" | "4";

export const GUEST_FUNCTION_DIALS: GuestFunctionDay[] = ["1", "2", "4", "3"];

const DIAL_COLORS: Record<GuestFunctionDay, string> = {
  "1": "#ba1a1a",
  "2": "#c9942e",
  "4": "#2f7f86",
  "3": "#005359",
};

export function dialColor(day: GuestFunctionDay): string {
  return DIAL_COLORS[day];
}

export function parseCount(value: string | undefined): number {
  const amount = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(amount) ? amount : 0;
}

export function estimateRooms(count: string | number): string {
  const people = Math.max(parseCount(String(count)), 1);
  return String(Math.ceil(people / 2));
}

export function defaultStayDays(checkIn: string): string {
  const day = Number(checkIn) || 1;
  const days = functionOffset(3) - functionOffset(day) + 1;
  return String(Math.max(days, 1));
}

export function normalizeInviteStatus(status: string | undefined): "Sent" | "Pending" {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return ["sent", "shared", "invited", "done"].includes(normalized) ? "Sent" : "Pending";
}

export function normalizeGuestRow(row: Partial<GuestRow>): GuestRow {
  const count = row.count || "1";
  const receptionCount = row.receptionCount || count;
  const stayCount =
    row.stayCount || (parseCount(row.stayCount) > 0 || row.needsStay ? count : "0");
  const needsStay =
    typeof row.needsStay === "boolean" ? row.needsStay : parseCount(stayCount) > 0;
  const effectiveStayCount = needsStay
    ? String(parseCount(stayCount) > 0 ? stayCount : count)
    : "0";
  const checkIn = row.checkIn || "3";
  const nights = row.nights || (needsStay ? defaultStayDays(checkIn) : "0");
  const rooms = row.rooms || (needsStay ? estimateRooms(effectiveStayCount) : "0");
  const invitationSent =
    Boolean(row.invitationSent) || normalizeInviteStatus(row.inviteStatus) === "Sent";

  return {
    id: row.id || createId("g"),
    name: row.name || "",
    count,
    receptionCount,
    sangeetCount: row.sangeetCount || "",
    biyebariCount: row.biyebariCount || "",
    borjatriCount: row.borjatriCount || "",
    stayCount: effectiveStayCount,
    needsStay,
    checkIn,
    nights,
    rooms,
    invitationSent,
    inviteStatus: invitationSent ? "Sent" : "Pending",
  };
}

export function guestCountForFunction(row: GuestRow, day: string | number): number {
  if (String(day) === "1") return parseCount(row.sangeetCount);
  if (String(day) === "2") return parseCount(row.biyebariCount);
  if (String(day) === "4") return parseCount(row.borjatriCount);
  if (String(day) === "3") return parseCount(row.receptionCount || row.count);
  return parseCount(row.count);
}

export function guestsByFunctionDay(guests: GuestRow[], day: string | number): number {
  return guests.reduce((sum, row) => sum + guestCountForFunction(row, day), 0);
}

export function syncGuestEventCounts(row: GuestRow): GuestRow {
  const max = parseCount(row.count);
  if (max <= 0) return row;
  const next = { ...row };
  (["receptionCount", "sangeetCount", "biyebariCount", "borjatriCount", "stayCount"] as const).forEach(
    (field) => {
      if (parseCount(next[field]) > max) next[field] = String(max);
    },
  );
  return next;
}

export function keepTotalAtLeastEventCounts(row: GuestRow): GuestRow {
  const maxEventCount = Math.max(
    parseCount(row.receptionCount),
    parseCount(row.sangeetCount),
    parseCount(row.biyebariCount),
    parseCount(row.borjatriCount),
    1,
  );
  if (parseCount(row.count) < maxEventCount) {
    return { ...row, count: String(maxEventCount) };
  }
  return row;
}

export function inferCheckInFromEventCounts(row: Pick<GuestRow, "receptionCount" | "sangeetCount" | "biyebariCount">): string {
  if (parseCount(row.sangeetCount) > 0) return "1";
  if (parseCount(row.biyebariCount) > 0) return "2";
  if (parseCount(row.receptionCount) > 0) return "3";
  return "3";
}

export function applyStayToggle(row: GuestRow, needsStay: boolean): GuestRow {
  if (!needsStay) {
    return normalizeGuestRow({
      ...row,
      needsStay: false,
      stayCount: "0",
      nights: "0",
      rooms: "0",
    });
  }
  const stayCount = parseCount(row.stayCount) > 0 ? row.stayCount : row.count;
  return normalizeGuestRow({
    ...row,
    needsStay: true,
    stayCount,
    nights: defaultStayDays(row.checkIn),
    rooms: estimateRooms(stayCount),
  });
}

export function applyStayCountChange(row: GuestRow, stayCount: string): GuestRow {
  const needsStay = parseCount(stayCount) > 0;
  return normalizeGuestRow({
    ...row,
    stayCount,
    needsStay,
    nights: needsStay
      ? parseCount(row.nights) > 0
        ? row.nights
        : defaultStayDays(row.checkIn)
      : "0",
    rooms: needsStay ? estimateRooms(stayCount || row.count) : "0",
  });
}

export function applyTotalCountChange(row: GuestRow, count: string): GuestRow {
  const next = normalizeGuestRow({
    ...row,
    count,
    receptionCount: count,
  });
  return syncGuestEventCounts(keepTotalAtLeastEventCounts(next));
}

export function applyFieldCountChange(
  row: GuestRow,
  field: keyof GuestRow,
  value: string,
): GuestRow {
  let next = normalizeGuestRow({ ...row, [field]: value });
  if (field === "count") {
    next = applyTotalCountChange(next, value);
  } else if (field === "stayCount") {
    next = applyStayCountChange(next, value);
  } else {
    next = syncGuestEventCounts(keepTotalAtLeastEventCounts(next));
  }
  return next;
}

export function createGuestFromDraft(draft: {
  name: string;
  count: string;
  receptionCount: string;
  sangeetCount: string;
  biyebariCount: string;
  borjatriCount: string;
  stayCount: string;
}): GuestRow {
  const totalCount = Math.max(1, parseCount(draft.count) || 1);
  const receptionCount =
    draft.receptionCount === ""
      ? totalCount
      : Math.min(totalCount, parseCount(draft.receptionCount));
  const raw = {
    id: createId("g"),
    name: draft.name.trim() || "Guest not set",
    count: String(totalCount),
    receptionCount: String(receptionCount),
    sangeetCount: String(Math.min(totalCount, parseCount(draft.sangeetCount))),
    biyebariCount: String(Math.min(totalCount, parseCount(draft.biyebariCount))),
    borjatriCount: String(Math.min(totalCount, parseCount(draft.borjatriCount))),
    stayCount: String(Math.min(totalCount, parseCount(draft.stayCount))),
    checkIn: inferCheckInFromEventCounts({
      receptionCount: String(receptionCount),
      sangeetCount: draft.sangeetCount,
      biyebariCount: draft.biyebariCount,
    }),
  };
  return syncGuestEventCounts(keepTotalAtLeastEventCounts(normalizeGuestRow(raw)));
}

export function guestEventLabelList(row: GuestRow, state: WeddingState): string {
  const entries = [
    { label: resolveDayName(state, 1), value: row.sangeetCount },
    { label: resolveDayName(state, 2), value: row.biyebariCount },
    { label: resolveDayName(state, 3), value: row.receptionCount || row.count },
    { label: resolveDayName(state, 4), value: row.borjatriCount },
  ];
  return entries
    .filter((entry) => parseCount(entry.value) > 0)
    .map((entry) => entry.label)
    .join(", ");
}

export function guestEventSummary(
  row: GuestRow,
  state: WeddingState,
  activeDay: string,
): { primaryCount: number; detail: string } {
  const total = parseCount(row.count);
  const selectedDay = activeDay === "All" ? null : activeDay;
  const primaryCount = selectedDay ? guestCountForFunction(row, selectedDay) : total;
  const entries = [
    { day: "3", label: resolveDayName(state, 3), value: row.receptionCount || row.count },
    { day: "1", label: resolveDayName(state, 1), value: row.sangeetCount },
    { day: "2", label: resolveDayName(state, 2), value: row.biyebariCount },
    { day: "4", label: resolveDayName(state, 4), value: row.borjatriCount },
  ];
  const eventParts = entries
    .filter((entry) => parseCount(entry.value) > 0)
    .sort((a, b) => {
      if (!selectedDay) return 0;
      if (a.day === selectedDay) return -1;
      if (b.day === selectedDay) return 1;
      return 0;
    })
    .map((entry) => `${entry.label} ${parseCount(entry.value)}`);
  return {
    primaryCount,
    detail: eventParts.length ? eventParts.join(" · ") : "No event count set",
  };
}

export function guestMatchesFilter(
  row: GuestRow,
  searchTerm: string,
  activeDay: string,
  state: WeddingState,
): boolean {
  const haystack = [row.name, resolveFunctionDateLabel(state, Number(row.checkIn) || 1)]
    .join(" ")
    .toLowerCase();
  const queryMatch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
  const dayMatch =
    activeDay === "All" ? true : guestCountForFunction(row, activeDay) > 0;
  return queryMatch && dayMatch;
}

export function guestMetrics(guests: GuestRow[]) {
  const stayTotal = guests.reduce(
    (sum, row) => (row.needsStay ? sum + parseCount(row.stayCount || row.count) : sum),
    0,
  );
  const headTotal = guests.reduce((sum, row) => sum + parseCount(row.count), 0);
  const inviteSentTotal = guests.filter((row) => row.invitationSent).length;
  return { stayTotal, headTotal, inviteSentTotal, familyCount: guests.length };
}

export function syncEventGuestCount(guests: GuestRow[]): string {
  const total = guests.reduce((sum, row) => sum + parseCount(row.count), 0);
  return total > 0 ? String(total) : "";
}

export function formatGuestPlan(state: WeddingState): string {
  const rows = state.guests.map((row) => {
    const stay = row.needsStay
      ? `Stay: yes | Check-in: ${resolveFunctionDateLabel(state, Number(row.checkIn) || 1)} | Days: ${row.nights || 0} | Rooms: ${row.rooms || 0}`
      : "Stay: no";
    return `- ${row.name || "Guest not set"} | People: ${row.count || 0} | ${stay}`;
  });

  const functionLabels = [1, 2, 3]
    .map((day) => resolveFunctionDateLabel(state, day))
    .filter(Boolean)
    .join(", ");

  return [
    `${state.event.name || "Bengali wedding"} - guest and accommodation list`,
    `Functions: ${functionLabels || "Dates not set"}`,
    "",
    ...(rows.length ? rows : ["- No guests added"]),
  ].join("\n");
}

export function dialPercentage(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}

export function emptyGuestDraft() {
  return {
    name: "",
    count: "1",
    receptionCount: "1",
    sangeetCount: "0",
    biyebariCount: "0",
    borjatriCount: "0",
    stayCount: "0",
  };
}

export type GuestDraft = ReturnType<typeof emptyGuestDraft>;
