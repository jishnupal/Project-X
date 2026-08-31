import { estimateRooms, normalizeGuestRow, syncEventGuestCount } from "./guest";
import type { GuestRow, WeddingState } from "./types";

const FIRST = [
  "Ananya", "Arjun", "Ritika", "Soham", "Debjani", "Kunal", "Isha", "Ayan",
  "Moumita", "Rishav", "Tania", "Abir", "Sneha", "Rajat", "Payel", "Indranil",
  "Dia", "Sagnik", "Niharika", "Aritra", "Shreya", "Bikram", "Oindrila", "Partha",
  "Ankita", "Sourav", "Rupa", "Niladri", "Aditi", "Gaurav",
];

const LAST = [
  "Mukherjee", "Banerjee", "Chatterjee", "Bhattacharya", "Ghosh", "Bose", "Sen",
  "Dutta", "Das", "Roy", "Saha", "Pal", "Nandi", "Guha", "Mitra", "Lahiri",
  "Chakraborty", "Ganguly", "Sarkar", "Basu", "Dey", "Mondal", "Halder", "Biswas",
];

const HOUSE = [
  "family", "house", "uncles", "mama bari", "pishi house", "college batch",
  "office cluster", "neighbours", "maternal cousins", "flat friends",
];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}

function between(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function scenarioCounts(rng: () => number, total: number) {
  const kind = Math.floor(rng() * 8);
  const n = String(total);
  const zero = "0";
  if (kind === 0) {
    return { sangeetCount: n, biyebariCount: n, borjatriCount: n, receptionCount: n, stay: true };
  }
  if (kind === 1) {
    return { sangeetCount: zero, biyebariCount: zero, borjatriCount: zero, receptionCount: n, stay: false };
  }
  if (kind === 2) {
    return { sangeetCount: n, biyebariCount: zero, borjatriCount: zero, receptionCount: n, stay: rng() > 0.6 };
  }
  if (kind === 3) {
    return { sangeetCount: zero, biyebariCount: n, borjatriCount: n, receptionCount: n, stay: true };
  }
  if (kind === 4) {
    return { sangeetCount: n, biyebariCount: n, borjatriCount: zero, receptionCount: n, stay: rng() > 0.5 };
  }
  if (kind === 5) {
    const sangeet = String(Math.max(1, Math.floor(total * 0.6)));
    return { sangeetCount: sangeet, biyebariCount: n, borjatriCount: n, receptionCount: n, stay: true };
  }
  if (kind === 6) {
    return { sangeetCount: zero, biyebariCount: n, borjatriCount: zero, receptionCount: n, stay: rng() > 0.4 };
  }
  return {
    sangeetCount: String(between(rng, 0, total)),
    biyebariCount: String(between(rng, 0, total)),
    borjatriCount: String(between(rng, 0, total)),
    receptionCount: n,
    stay: rng() > 0.45,
  };
}

export function buildDemoGuests(count = 100, seed = 20260307): GuestRow[] {
  const rng = mulberry32(seed);
  const names = new Set<string>();
  const rows: GuestRow[] = [];

  for (let i = 0; i < count; i += 1) {
    let name = `${pick(rng, FIRST)} ${pick(rng, LAST)} ${pick(rng, HOUSE)}`;
    while (names.has(name)) name = `${name} ${i + 1}`;
    names.add(name);

    const total = between(rng, 1, 14);
    const counts = scenarioCounts(rng, total);
    const stayCount = counts.stay ? String(Math.max(1, Math.ceil(total * (0.5 + rng() * 0.5)))) : "0";
    const checkIn = parseInt(counts.sangeetCount, 10) > 0 ? "1" : parseInt(counts.biyebariCount, 10) > 0 ? "2" : "3";
    const sent = rng() > 0.55;

    rows.push(
      normalizeGuestRow({
        id: `demo-g-${i + 1}`,
        name,
        count: String(total),
        receptionCount: counts.receptionCount,
        sangeetCount: counts.sangeetCount,
        biyebariCount: counts.biyebariCount,
        borjatriCount: counts.borjatriCount,
        stayCount,
        needsStay: counts.stay,
        checkIn,
        nights: counts.stay ? String(between(rng, 2, 5)) : "0",
        rooms: counts.stay ? estimateRooms(stayCount) : "0",
        invitationSent: sent,
        inviteStatus: sent ? "Sent" : "Pending",
        groupId: "",
      }),
    );
  }

  return rows;
}

/** Seeded preview rows (`demo-g-*`) — local only, never authority for a live wedding. */
export function isDemoGuestId(id: string | undefined): boolean {
  return String(id || "").startsWith("demo-g-");
}

export function isDemoHeavyGuestList(guests: GuestRow[] | undefined): boolean {
  const rows = guests || [];
  if (rows.length < 20) return false;
  const demoCount = rows.filter((row) => isDemoGuestId(row.id)).length;
  return demoCount >= 20 && demoCount / rows.length >= 0.7;
}

export function stripDemoGuests(guests: GuestRow[] | undefined): GuestRow[] {
  return (guests || []).filter((row) => !isDemoGuestId(row.id));
}

export function withoutDemoGuests(state: WeddingState): WeddingState {
  const guests = stripDemoGuests(state.guests);
  return {
    ...state,
    guests,
    event: { ...state.event, guests: syncEventGuestCount(guests) },
  };
}

