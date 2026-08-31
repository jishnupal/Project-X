import type { GuestGroup, GuestRow, WeddingState } from "./types";
import { createId } from "./event";
import { functionOffset, resolveDayName, resolveFunctionDateLabel } from "./functions";

export type GuestFunctionDay = "1" | "2" | "3" | "4";

export const GUEST_FUNCTION_DIALS: GuestFunctionDay[] = ["1", "2", "4", "3"];
export const RECEPTION_DAY: GuestFunctionDay = "3";
export const MAX_GUEST_GROUPS = 10;
export const GROUP_CARD_NAME_SLOTS = 5;

/** How many family names fit on a group tile without crowding. */
export function groupCardNameSlots(groupCount: number, compact: boolean): number {
  if (compact) return groupCount >= 3 ? 3 : 4;
  if (groupCount === 1) return 5;
  if (groupCount === 2) return 4;
  return 4;
}
export const GROUP_MEMBER_BOARD_MAX = 40;

export function groupBoardLayout(groupCount: number): { cols: number; rows: number; gapPx: number } {
  const n = Math.min(Math.max(groupCount, 1), MAX_GUEST_GROUPS);
  if (n === 1) return { cols: 1, rows: 1, gapPx: 16 };
  if (n === 2) return { cols: 2, rows: 1, gapPx: 14 };
  if (n === 3) return { cols: 3, rows: 1, gapPx: 12 };
  if (n === 4) return { cols: 2, rows: 2, gapPx: 12 };
  if (n <= 6) return { cols: 3, rows: 2, gapPx: 10 };
  if (n <= 8) return { cols: 4, rows: 2, gapPx: 8 };
  if (n === 9) return { cols: 3, rows: 3, gapPx: 8 };
  return { cols: 2, rows: 5, gapPx: 6 };
}

/** Fill the left board with up to 40 family tiles. */
export function groupMemberBoardLayout(memberCount: number): { cols: number; rows: number; gapPx: number } {
  const n = Math.min(Math.max(memberCount, 1), GROUP_MEMBER_BOARD_MAX);
  if (n <= 1) return { cols: 1, rows: 1, gapPx: 12 };
  if (n === 2) return { cols: 2, rows: 1, gapPx: 12 };
  if (n <= 4) return { cols: 2, rows: 2, gapPx: 10 };
  if (n <= 6) return { cols: 3, rows: 2, gapPx: 10 };
  if (n <= 9) return { cols: 3, rows: 3, gapPx: 8 };
  if (n <= 12) return { cols: 4, rows: 3, gapPx: 8 };
  if (n <= 16) return { cols: 4, rows: 4, gapPx: 7 };
  if (n <= 20) return { cols: 5, rows: 4, gapPx: 6 };
  if (n <= 25) return { cols: 5, rows: 5, gapPx: 6 };
  if (n <= 30) return { cols: 6, rows: 5, gapPx: 5 };
  if (n <= 36) return { cols: 6, rows: 6, gapPx: 5 };
  return { cols: 8, rows: 5, gapPx: 4 };
}

/** Bento grid for the group panel — tiles fill all space, no empty tail. */
export function groupPanelGrid(count: number): {
  cols: number;
  rows: number;
  gapPx: number;
  /** Per-tile grid placement (index order). */
  spans: Array<{ colSpan?: number; rowSpan?: number }>;
  fillHeight: boolean;
} {
  const n = Math.min(Math.max(count, 1), MAX_GUEST_GROUPS);
  if (n === 1) {
    return { cols: 1, rows: 1, gapPx: 12, spans: [{}], fillHeight: true };
  }
  if (n === 2) {
    return { cols: 1, rows: 2, gapPx: 12, spans: [{}, {}], fillHeight: true };
  }
  if (n === 3) {
    return {
      cols: 2,
      rows: 2,
      gapPx: 10,
      spans: [{}, {}, { colSpan: 2 }],
      fillHeight: true,
    };
  }
  if (n === 4) {
    return {
      cols: 2,
      rows: 2,
      gapPx: 10,
      spans: [{}, {}, {}, {}],
      fillHeight: true,
    };
  }
  const layout = groupBoardLayout(n);
  return {
    cols: layout.cols,
    rows: layout.rows,
    gapPx: layout.gapPx,
    spans: Array.from({ length: n }, () => ({})),
    fillHeight: false,
  };
}

/** Mobile group panel height — compact so tiles + list + dock fit without bulk. */
export function groupPanelMobileHeight(count: number): string | undefined {
  const n = Math.min(Math.max(count, 1), 4);
  if (n === 1) return "min(32dvh, 260px)";
  if (n === 2) return "min(36dvh, 300px)";
  if (n === 3) return "min(38dvh, 320px)";
  if (n === 4) return "min(40dvh, 340px)";
  return undefined;
}

/** Desktop 12-col split: guest list vs group tiles — scales with group count. */
export function guestBoardSplit(groupCount: number): { listCols: number; groupCols: number } {
  if (groupCount <= 0) return { listCols: 12, groupCols: 0 };
  if (groupCount === 1) return { listCols: 7, groupCols: 5 };
  if (groupCount === 2) return { listCols: 6, groupCols: 6 };
  if (groupCount <= 4) return { listCols: 6, groupCols: 6 };
  if (groupCount <= 6) return { listCols: 5, groupCols: 7 };
  return { listCols: 4, groupCols: 8 };
}

/** How many guest-row columns to use. Follows group count, never the Add tile. */
export function guestListColumnCount(groupCount: number): 1 | 2 | 3 {
  if (groupCount <= 0) return 1;
  if (groupCount <= 4) return 2;
  return 1;
}

export function isReceptionFilter(activeDay: string): boolean {
  return activeDay === RECEPTION_DAY;
}

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
  const groupId = String(row.groupId || "").trim();
  const totalPeople = parseCount(count);
  let groupCount = "0";
  if (groupId) {
    if (row.groupCount == null || row.groupCount === "") {
      /* Legacy assigned rows had no groupCount — treat as full family. */
      groupCount = String(Math.max(1, totalPeople));
    } else {
      groupCount = String(Math.min(totalPeople, Math.max(1, parseCount(row.groupCount))));
    }
  }

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
    groupId,
    groupCount,
    updatedAt: Number(row.updatedAt) || 0,
  };
}

/** Stamp a guest row so conflict merge can prefer the newer edit. */
export function touchGuestRow(row: Partial<GuestRow>): GuestRow {
  return normalizeGuestRow({ ...row, updatedAt: Date.now() });
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
  if (next.groupId && parseCount(next.groupCount) > max) {
    next.groupCount = String(Math.max(1, max));
  }
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
    return touchGuestRow({
      ...row,
      needsStay: false,
      stayCount: "0",
      nights: "0",
      rooms: "0",
    });
  }
  const stayCount = parseCount(row.stayCount) > 0 ? row.stayCount : row.count;
  return touchGuestRow({
    ...row,
    needsStay: true,
    stayCount,
    nights: defaultStayDays(row.checkIn),
    rooms: estimateRooms(stayCount),
  });
}

export function applyStayCountChange(row: GuestRow, stayCount: string): GuestRow {
  const needsStay = parseCount(stayCount) > 0;
  return touchGuestRow({
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
  const total = Math.max(1, parseCount(count) || 1);
  // Total and Reception stay in sync; other event/stay counts clamp to the new total.
  return syncGuestEventCounts(
    touchGuestRow({
      ...row,
      count: String(total),
      receptionCount: String(total),
    }),
  );
}

export function applyFieldCountChange(
  row: GuestRow,
  field: keyof GuestRow,
  value: string,
): GuestRow {
  if (field === "count") {
    return applyTotalCountChange(row, value);
  }
  if (field === "receptionCount") {
    // Reception moves Total with it.
    return applyTotalCountChange(row, value);
  }
  if (field === "stayCount") {
    return applyStayCountChange(row, value);
  }
  const next = touchGuestRow({ ...row, [field]: value });
  return syncGuestEventCounts(keepTotalAtLeastEventCounts(next));
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
    updatedAt: Date.now(),
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
  const dayMatch = !activeDay || activeDay === "All" ? true : guestCountForFunction(row, activeDay) > 0;
  return queryMatch && dayMatch;
}

export function guestMetrics(guests: GuestRow[], day?: string) {
  const pool =
    !day || day === "All" ? guests : guests.filter((row) => guestCountForFunction(row, day) > 0);
  const stayTotal = pool.reduce(
    (sum, row) => (row.needsStay ? sum + parseCount(row.stayCount || row.count) : sum),
    0,
  );
  const headTotal = pool.reduce(
    (sum, row) =>
      sum + (!day || day === "All" ? parseCount(row.count) : guestCountForFunction(row, day)),
    0,
  );
  const inviteSentTotal = pool.filter((row) => row.invitationSent).length;
  return { stayTotal, headTotal, inviteSentTotal, familyCount: pool.length };
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
    ...(state.guestGroups || []).map((group) => {
      const members = (state.guests || []).filter((row) => row.groupId === group.id);
      const names = members.map((row) => row.name || "Guest not set").join(", ");
      return `Group ${group.name}: ${names || "no guests assigned"}`;
    }),
    state.guestGroups?.length ? "" : "",
    ...(rows.length ? rows : ["- No guests added"]),
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");
}

export function normalizeGuestGroup(row: Partial<GuestGroup>): GuestGroup {
  return {
    id: row.id || createId("gg"),
    name: String(row.name || "").trim() || "Untitled group",
    updatedAt: Number(row.updatedAt) || 0,
  };
}

export function createGuestGroup(name: string): GuestGroup {
  return normalizeGuestGroup({ name, updatedAt: Date.now() });
}

export function touchGuestGroup(row: Partial<GuestGroup>): GuestGroup {
  return normalizeGuestGroup({ ...row, updatedAt: Date.now() });
}

export function guestsInGroup(guests: GuestRow[], groupId: string): GuestRow[] {
  return guests.filter((row) => row.groupId === groupId);
}

export function groupPeopleCount(guests: GuestRow[], groupId: string): number {
  return guestsInGroup(guests, groupId).reduce((sum, row) => sum + parseCount(row.groupCount), 0);
}

/**
 * Suggest how many from a family to put in a group.
 * Prefers the smallest partial event invite when the family is larger than that.
 */
export function suggestGroupHeadcount(row: GuestRow): number {
  const total = Math.max(1, parseCount(row.count));
  if (total <= 1) return 1;

  const events = [
    parseCount(row.sangeetCount),
    parseCount(row.biyebariCount),
    parseCount(row.borjatriCount),
    parseCount(row.receptionCount || row.count),
  ];
  if (row.needsStay) {
    events.push(parseCount(row.stayCount));
  }

  const positive = events.filter((n) => n > 0);
  const partial = positive.filter((n) => n < total);
  if (partial.length) {
    return Math.min(...partial);
  }
  return total;
}

export function formatGroupMemberLabel(row: GuestRow): string {
  const total = parseCount(row.count);
  const inGroup = parseCount(row.groupCount);
  if (row.groupId && inGroup > 0 && inGroup < total) {
    return `${inGroup} of ${total}`;
  }
  return `${total}`;
}

export function assignGuestToGroup(
  row: GuestRow,
  groupId: string,
  people?: number,
): GuestRow {
  if (!groupId) {
    return touchGuestRow({ ...row, groupId: "", groupCount: "0" });
  }
  const total = Math.max(1, parseCount(row.count));
  const headcount =
    people != null
      ? Math.min(total, Math.max(1, Math.floor(people)))
      : suggestGroupHeadcount(row);
  return touchGuestRow({
    ...row,
    groupId,
    groupCount: String(headcount),
  });
}

export function removeGuestGroup(state: WeddingState, groupId: string): WeddingState {
  return {
    ...state,
    guestGroups: (state.guestGroups || []).filter((group) => group.id !== groupId),
    guests: state.guests.map((row) =>
      row.groupId === groupId
        ? touchGuestRow({ ...row, groupId: "", groupCount: "0" })
        : row,
    ),
  };
}

export function reconcileGuestGroups(
  groups: GuestGroup[] | undefined,
  guests: GuestRow[],
): { guestGroups: GuestGroup[]; guests: GuestRow[] } {
  const guestGroups = (groups || []).map(normalizeGuestGroup);
  const ids = new Set(guestGroups.map((group) => group.id));
  return {
    guestGroups,
    guests: guests.map((row) =>
      row.groupId && !ids.has(row.groupId)
        ? { ...row, groupId: "", groupCount: "0" }
        : row,
    ),
  };
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
