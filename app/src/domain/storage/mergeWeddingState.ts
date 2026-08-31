import type { GuestGroup, GuestRow, WeddingState } from "../types";
import { reconcileGuestGroups, syncEventGuestCount } from "../guest";
import {
  isDemoHeavyGuestList,
  stripDemoGuests,
} from "../guestSeed";
import { hydrateWeddingState } from "./localStorageRepository";

function rowClock(value: { updatedAt?: number } | null | undefined): number {
  return Number(value?.updatedAt) || 0;
}

function mergeById<T extends { id: string; updatedAt?: number }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const row of remote) {
    map.set(row.id, row);
  }
  for (const row of local) {
    const existing = map.get(row.id);
    if (!existing) {
      map.set(row.id, row);
      continue;
    }
    const localAt = rowClock(row);
    const remoteAt = rowClock(existing);
    if (localAt > remoteAt) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}

/**
 * Remote document is the base for menu/tasks/theme.
 * Demo seed guests never win over a real list.
 */
export function mergeWeddingState(local: WeddingState, remote: WeddingState): WeddingState {
  const localGuests = local.guests || [];
  const remoteGuests = remote.guests || [];
  const localDemo = isDemoHeavyGuestList(localGuests);
  const remoteDemo = isDemoHeavyGuestList(remoteGuests);

  let guests: GuestRow[];
  if (localDemo && !remoteDemo) {
    guests = remoteGuests;
  } else if (!localDemo && remoteDemo) {
    guests = localGuests;
  } else if (localDemo && remoteDemo) {
    guests = [];
  } else {
    guests = mergeById<GuestRow>(stripDemoGuests(localGuests), stripDemoGuests(remoteGuests));
  }

  const groups = mergeById<GuestGroup>(local.guestGroups || [], remote.guestGroups || []);
  const grouped = reconcileGuestGroups(groups, guests);
  const base = remoteDemo && !localDemo ? local : remote;
  return hydrateWeddingState({
    ...base,
    guests: grouped.guests,
    guestGroups: grouped.guestGroups,
    event: {
      ...base.event,
      guests: syncEventGuestCount(grouped.guests),
    },
  });
}

