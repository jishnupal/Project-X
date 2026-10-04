import { guestStaysOnDay } from "./guest";
import type { GuestRow, Room, RoomBedKind, RoomType, WeddingState } from "./types";

let nextId = 0;
export function generateRoomId(): string {
  nextId += 1;
  return `room-${Date.now()}-${nextId}`;
}

export const BED_KIND_CAPACITY: Record<Exclude<RoomBedKind, "custom">, number> = {
  double: 2,
  triple: 3,
  quad: 4,
};

export const BED_KIND_LABELS: Record<RoomBedKind, string> = {
  double: "Double",
  triple: "Triple",
  quad: "Quad",
  custom: "Custom",
};

export function capacityForBedKind(kind: RoomBedKind, customCapacity = 2): number {
  if (kind === "custom") return Math.max(1, customCapacity);
  return BED_KIND_CAPACITY[kind];
}

export function bedKindFromCapacity(capacity: number): RoomBedKind {
  if (capacity === 2) return "double";
  if (capacity === 3) return "triple";
  if (capacity === 4) return "quad";
  return "custom";
}

export function resolveBedKind(room: Room): RoomBedKind {
  return room.bedKind || bedKindFromCapacity(room.capacity);
}

export function roomKindSummary(rooms: Room[]): Array<{
  kind: RoomBedKind;
  label: string;
  count: number;
}> {
  const counts: Record<RoomBedKind, number> = {
    double: 0,
    triple: 0,
    quad: 0,
    custom: 0,
  };
  for (const room of rooms) {
    counts[resolveBedKind(room)] += 1;
  }
  return (["double", "triple", "quad", "custom"] as const)
    .filter((kind) => counts[kind] > 0)
    .map((kind) => ({ kind, label: BED_KIND_LABELS[kind], count: counts[kind] }));
}

export function guestStayPeople(guest: GuestRow): number {
  return Math.max(1, Number.parseInt(guest.stayCount || guest.count || "1", 10) || 1);
}

/** First token of a family name — "Banerjee family" → Banerjee, "Sen & Guha" → Sen. */
export function familyFirstName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Family";
  const stripped = trimmed.replace(/\s+(family|clan|house)\s*$/i, "").trim() || trimmed;
  return stripped.split(/[\s,/&]+/).find(Boolean) || trimmed;
}

/** Hotel reality: one room does not sleep a whole 5–6 person family. */
export const MAX_BEDS_PER_ROOM = 4;

/** Balanced rooms of at most 4. 6 → [3, 3], 5 → [3, 2], 7 → [4, 3]. */
export function planFamilyRooms(people: number): number[] {
  const n = Math.max(1, people);
  if (n <= MAX_BEDS_PER_ROOM) return [n];
  const rooms = Math.ceil(n / MAX_BEDS_PER_ROOM);
  const base = Math.floor(n / rooms);
  const extra = n % rooms;
  return Array.from({ length: rooms }, (_, i) => base + (i < extra ? 1 : 0)).sort((a, b) => b - a);
}

/** Double / Triple / Quad mixes that sum to `people`. Fewest rooms first. 10 → [4,4,2], [4,3,3]… */
export function familyRoomMixes(people: number): number[][] {
  const n = Math.max(1, people);
  if (n <= MAX_BEDS_PER_ROOM) return [[n]];

  const results: number[][] = [];
  const walk = (left: number, max: number, acc: number[]) => {
    if (left === 0) {
      results.push([...acc]);
      return;
    }
    for (let k = Math.min(max, MAX_BEDS_PER_ROOM); k >= 2; k -= 1) {
      if (k > left) continue;
      if (left - k !== 0 && left - k < 2) continue;
      acc.push(k);
      walk(left - k, k, acc);
      acc.pop();
    }
  };
  walk(n, MAX_BEDS_PER_ROOM, []);
  return results.sort((a, b) => a.length - b.length || b[0] - a[0]);
}

export function mixKindLabels(mix: number[]): string {
  return mix.map((n) => BED_KIND_LABELS[bedKindFromCapacity(n)] || `${n}`).join(" · ");
}

export function occupancyInRoom(room: Room, guestId: string, guests: GuestRow[]): number {
  if (!room.assignedGuestIds.includes(guestId)) return 0;
  const explicit = room.occupancyByGuestId?.[guestId];
  const guest = guests.find((g) => g.id === guestId);
  const raw =
    typeof explicit === "number" && explicit > 0
      ? explicit
      : guest
        ? guestStayPeople(guest)
        : 0;
  return Math.min(MAX_BEDS_PER_ROOM, Math.max(0, raw));
}

export function guestPlacedPeople(guest: GuestRow, rooms: Room[]): number {
  return (rooms || []).reduce((sum, room) => sum + occupancyInRoom(room, guest.id, [guest]), 0);
}

export function guestRemainingPeople(guest: GuestRow, rooms: Room[]): number {
  return Math.max(0, guestStayPeople(guest) - guestPlacedPeople(guest, rooms));
}

export function roomsForGuest(guest: GuestRow, rooms: Room[]): Room[] {
  return sortRooms((rooms || []).filter((r) => r.assignedGuestIds.includes(guest.id)));
}

export function createRoom(
  label: string,
  bedKind: RoomBedKind = "double",
  capacity = capacityForBedKind(bedKind),
  floor = "",
  notes = "",
  type: RoomType = "standard",
): Room {
  const cap = Math.min(
    MAX_BEDS_PER_ROOM,
    Math.max(1, Number(capacity) || capacityForBedKind(bedKind)),
  );
  return {
    id: generateRoomId(),
    label: label.trim() || "Room",
    type,
    capacity: cap,
    bedKind: bedKind === "custom" ? "custom" : bedKindFromCapacity(cap),
    assignedGuestIds: [],
    notes,
    floor,
  };
}

/** Auto label: empty, "Room", or "Room 12". Custom names stay optional. */
const NUMBERED_ROOM_LABEL = /^Room\s+(\d+)$/i;

export function isAutoRoomLabel(label: string): boolean {
  const trimmed = (label || "").trim();
  return !trimmed || /^room(?:\s+\d+)?$/i.test(trimmed);
}

export function displayRoomLabel(index: number): string {
  return `Room ${index + 1}`;
}

function roomCreatedAt(room: Room): number {
  const match = /^room-(\d+)-(\d+)$/.exec(room.id);
  if (!match) return 0;
  return Number.parseInt(match[1], 10) * 1000 + Number.parseInt(match[2], 10);
}

export function roomSequenceNumber(room: Room): number {
  const trimmed = room.label.trim();
  const numbered = NUMBERED_ROOM_LABEL.exec(trimmed);
  if (numbered) return Number.parseInt(numbered[1], 10);
  if (isAutoRoomLabel(trimmed)) return Number.MAX_SAFE_INTEGER / 2;
  return Number.POSITIVE_INFINITY;
}

export function sortRooms(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    const na = roomSequenceNumber(a);
    const nb = roomSequenceNumber(b);
    if (na !== nb) return na - nb;
    const ca = roomCreatedAt(a);
    const cb = roomCreatedAt(b);
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });
}

/** Persist rooms as Room 1 … Room N. Custom names keep their text and sit at the end. */
export function sequenceRooms(rooms: Room[]): Room[] {
  return sortRooms(rooms).map((room, index) => {
    if (!isAutoRoomLabel(room.label)) return room;
    const label = displayRoomLabel(index);
    return room.label === label ? room : { ...room, label };
  });
}

export function nextRoomLabel(rooms: Room[]): string {
  return displayRoomLabel(rooms.length);
}

export function addRoom(state: WeddingState, room: Room): WeddingState {
  return { ...state, rooms: sequenceRooms([...(state.rooms || []), room]) };
}

export function removeRoom(state: WeddingState, roomId: string): WeddingState {
  return { ...state, rooms: sequenceRooms((state.rooms || []).filter((r) => r.id !== roomId)) };
}

export function updateRoom(state: WeddingState, roomId: string, patch: Partial<Room>): WeddingState {
  return {
    ...state,
    rooms: sequenceRooms((state.rooms || []).map((r) => (r.id === roomId ? { ...r, ...patch } : r))),
  };
}

/** Place part of a family in a room. Does not remove them from other rooms (splits). */
export function assignPeopleToRoom(
  state: WeddingState,
  roomId: string,
  guestId: string,
  people: number,
): WeddingState {
  const rooms = state.rooms || [];
  const guests = state.guests || [];
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return state;
  const already = occupancyInRoom(room, guestId, guests);
  const free = roomRemainingCapacity(room, guests) + already;
  const chunk = Math.max(
    1,
    Math.min(MAX_BEDS_PER_ROOM, people, Math.max(1, free), room.capacity || MAX_BEDS_PER_ROOM),
  );
  const nextRooms = rooms.map((r) => {
    if (r.id !== roomId) return r;
    const ids = r.assignedGuestIds.includes(guestId)
      ? r.assignedGuestIds
      : [...r.assignedGuestIds, guestId];
    return {
      ...r,
      capacity: Math.min(MAX_BEDS_PER_ROOM, Math.max(1, r.capacity || chunk)),
      assignedGuestIds: ids,
      occupancyByGuestId: { ...(r.occupancyByGuestId || {}), [guestId]: chunk },
    };
  });
  return { ...state, rooms: sequenceRooms(nextRooms) };
}

export function assignGuestToRoom(
  state: WeddingState,
  roomId: string,
  guestId: string,
): WeddingState {
  const guest = (state.guests || []).find((g) => g.id === guestId);
  if (!guest) return state;
  const leftover = guestRemainingPeople(guest, state.rooms || []);
  const chunk = planFamilyRooms(leftover || guestStayPeople(guest))[0] || 1;
  return assignPeopleToRoom(state, roomId, guestId, chunk);
}

/** Split any family that was dumped into one oversized room. */
export function normalizeStayRooms(rooms: Room[], guests: GuestRow[]): Room[] {
  const capped = (rooms || []).map((r) => ({
    ...r,
    capacity: Math.min(MAX_BEDS_PER_ROOM, Math.max(1, Number(r.capacity) || 2)),
    occupancyByGuestId: { ...(r.occupancyByGuestId || {}) },
    assignedGuestIds: [...(r.assignedGuestIds || [])],
  }));
  const extras: Room[] = [];

  for (const room of capped) {
    for (const guestId of room.assignedGuestIds) {
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) continue;
      const stored = room.occupancyByGuestId[guestId];
      const raw =
        typeof stored === "number" && stored > 0 ? stored : guestStayPeople(guest);
      const keep = Math.min(MAX_BEDS_PER_ROOM, room.capacity, raw);
      room.occupancyByGuestId[guestId] = keep;
      let leftover = raw - keep;
      if (leftover <= 0) continue;
      for (const chunk of planFamilyRooms(leftover)) {
        const extra = createRoom(
          nextRoomLabel([...capped, ...extras]),
          bedKindFromCapacity(chunk),
          chunk,
        );
        extra.assignedGuestIds = [guestId];
        extra.occupancyByGuestId = { [guestId]: chunk };
        extras.push(extra);
        leftover -= chunk;
      }
    }
  }

  return sequenceRooms([...capped, ...extras]);
}

/** Put `people` of this family into a new room (never more than 4 beds). */
export function placePeopleInNewRoom(
  state: WeddingState,
  guestId: string,
  people: number,
  capacity?: number,
  label?: string,
): WeddingState {
  const chunk = Math.max(1, Math.min(MAX_BEDS_PER_ROOM, people));
  const cap = Math.max(chunk, Math.min(MAX_BEDS_PER_ROOM, capacity ?? chunk));
  const room = createRoom(
    (label || "").trim() || nextRoomLabel(state.rooms || []),
    bedKindFromCapacity(cap),
    cap,
  );
  return assignPeopleToRoom(addRoom(state, room), room.id, guestId, chunk);
}

/** Create one room per size in the mix and place this family across them. */
export function placeFamilyMix(
  state: WeddingState,
  guestId: string,
  mix: number[],
): WeddingState {
  return mix.reduce(
    (next, people) => placePeopleInNewRoom(next, guestId, people, people, ""),
    state,
  );
}

/** Create room(s) for this family — auto-splits when more than 4 people. */
export function placeGuestInNewRoom(
  state: WeddingState,
  guestId: string,
  capacity?: number,
  label?: string,
): WeddingState {
  const guest = (state.guests || []).find((g) => g.id === guestId);
  if (!guest) return state;
  const remaining = guestRemainingPeople(guest, state.rooms || []);
  const plan = planFamilyRooms(remaining);
  let next = state;
  plan.forEach((chunk, index) => {
    const roomLabel =
      plan.length === 1
        ? (label || "").trim() || nextRoomLabel(next.rooms || [])
        : nextRoomLabel(next.rooms || []);
    next = placePeopleInNewRoom(next, guestId, chunk, capacity ?? chunk, roomLabel);
    void index;
  });
  return next;
}

export function unassignGuestFromRoom(
  state: WeddingState,
  roomId: string,
  guestId: string,
): WeddingState {
  return {
    ...state,
    rooms: (state.rooms || []).map((r) => {
      if (r.id !== roomId) return r;
      const occupancy = { ...(r.occupancyByGuestId || {}) };
      delete occupancy[guestId];
      return {
        ...r,
        assignedGuestIds: r.assignedGuestIds.filter((id) => id !== guestId),
        occupancyByGuestId: occupancy,
      };
    }),
  };
}

export function clearRoom(state: WeddingState, roomId: string): WeddingState {
  return updateRoom(state, roomId, { assignedGuestIds: [], occupancyByGuestId: {} });
}

export function guestsNeedingStay(guests: GuestRow[], day?: string | number | null): GuestRow[] {
  return guests.filter((g) => guestStaysOnDay(g, day));
}

export function assignedGuestIds(rooms: Room[]): Set<string> {
  const ids = new Set<string>();
  for (const room of rooms) {
    for (const id of room.assignedGuestIds) {
      ids.add(id);
    }
  }
  return ids;
}

export function unassignedGuests(
  guests: GuestRow[],
  rooms: Room[],
  day?: string | number | null,
): GuestRow[] {
  return guests.filter((g) => guestStaysOnDay(g, day) && guestRemainingPeople(g, rooms) > 0);
}

export function unassignedPeopleCount(guests: GuestRow[], rooms: Room[]): number {
  return unassignedGuests(guests, rooms).reduce((sum, g) => sum + guestStayPeople(g), 0);
}

export interface RoomMetrics {
  totalRooms: number;
  occupiedRooms: number;
  emptyRooms: number;
  totalGuestsNeedingStay: number;
  assignedGuests: number;
  unassignedGuests: number;
  /** People (heads) still waiting for a room */
  unassignedPeople: number;
  /** People already mapped into rooms */
  assignedPeople: number;
  totalStayPeople: number;
}

export function roomMetrics(state: WeddingState, day?: string | number | null): RoomMetrics {
  const rooms = state.rooms || [];
  const guests = state.guests || [];
  const needStay = guestsNeedingStay(guests, day);
  const occupiedRooms = rooms.filter(
    (r) => roomFamiliesOnDay(r, guests, day).length > 0,
  ).length;
  const unassignedList = needStay.filter((g) => guestRemainingPeople(g, rooms) > 0);
  const fullyMapped = needStay.filter((g) => guestRemainingPeople(g, rooms) === 0);

  return {
    totalRooms: rooms.length,
    occupiedRooms,
    emptyRooms: rooms.length - occupiedRooms,
    totalGuestsNeedingStay: needStay.length,
    assignedGuests: fullyMapped.length,
    unassignedGuests: unassignedList.length,
    unassignedPeople: unassignedList.reduce((sum, g) => sum + guestRemainingPeople(g, rooms), 0),
    assignedPeople: needStay.reduce((sum, g) => sum + guestPlacedPeople(g, rooms), 0),
    totalStayPeople: needStay.reduce((sum, g) => sum + guestStayPeople(g), 0),
  };
}

export function roomFamiliesOnDay(
  room: Room,
  guests: GuestRow[],
  day?: string | number | null,
): GuestRow[] {
  const guestMap = new Map(guests.map((g) => [g.id, g]));
  return room.assignedGuestIds
    .map((id) => guestMap.get(id))
    .filter((g): g is GuestRow => {
      if (!g) return false;
      if (day == null || day === "" || day === "All") return true;
      return guestStaysOnDay(g, day);
    });
}

export function roomGuestNames(
  room: Room,
  guests: GuestRow[],
  day?: string | number | null,
): string[] {
  return roomFamiliesOnDay(room, guests, day)
    .map((g) => g.name || "")
    .filter(Boolean);
}

export function roomHeadcount(
  room: Room,
  guests: GuestRow[],
  day?: string | number | null,
): number {
  return roomFamiliesOnDay(room, guests, day).reduce(
    (sum, guest) => sum + occupancyInRoom(room, guest.id, guests),
    0,
  );
}

export function roomRemainingCapacity(room: Room, guests: GuestRow[]): number {
  return Math.max(0, room.capacity - roomHeadcount(room, guests));
}

export type AssignFit =
  | { ok: true; remainingAfter: number }
  | { ok: false; remaining: number; needed: number; message: string };

export function canAssignPeople(room: Room, people: number, guests: GuestRow[]): AssignFit {
  const needed = Math.max(1, people);
  const remaining = roomRemainingCapacity(room, guests);
  if (needed <= remaining && needed <= MAX_BEDS_PER_ROOM) {
    return { ok: true, remainingAfter: remaining - needed };
  }
  return {
    ok: false,
    remaining,
    needed,
    message:
      needed > MAX_BEDS_PER_ROOM
        ? `A room holds at most ${MAX_BEDS_PER_ROOM} — split this family`
        : remaining <= 0
          ? "This room is full"
          : `Only ${remaining} ${remaining === 1 ? "bed" : "beds"} left — this group needs ${needed}`,
  };
}

export function canAssignGuest(
  room: Room,
  guest: GuestRow,
  guests: GuestRow[],
  rooms: Room[] = [],
): AssignFit {
  const leftover = guestRemainingPeople(guest, rooms);
  const chunk = Math.min(MAX_BEDS_PER_ROOM, leftover || guestStayPeople(guest));
  return canAssignPeople(room, chunk, guests);
}

export function roomsThatFit(
  rooms: Room[],
  guest: GuestRow,
  guests: GuestRow[],
  people?: number,
): { fit: Room[]; noFit: Room[] } {
  const chunk = people ?? Math.min(MAX_BEDS_PER_ROOM, guestRemainingPeople(guest, rooms) || guestStayPeople(guest));
  const fit: Room[] = [];
  const noFit: Room[] = [];
  for (const room of rooms) {
    if (canAssignPeople(room, chunk, guests).ok) fit.push(room);
    else noFit.push(room);
  }
  return { fit, noFit };
}

/** Prefer a room that still fits this family; else first empty room; else null. */
export function findRoomForGuest(rooms: Room[], guest: GuestRow, guests: GuestRow[]): Room | null {
  const fitting = rooms.find((r) => canAssignGuest(r, guest, guests).ok);
  if (fitting) return fitting;
  return rooms.find((r) => r.assignedGuestIds.length === 0) || null;
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: "Standard",
  deluxe: "Deluxe",
  suite: "Suite",
  family: "Family",
};

export const ROOM_TYPE_ICONS: Record<RoomType, string> = {
  standard: "bed",
  deluxe: "king_bed",
  suite: "hotel",
  family: "family_restroom",
};
