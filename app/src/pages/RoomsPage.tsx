import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { ViewerBanner } from "../components/access/ViewerBanner";
import { useWeddingState } from "../hooks/useWeddingState";
import { FamilyStayGrid } from "../components/rooms/FamilyStayGrid";
import { AddRoomSheet } from "../components/rooms/AddRoomSheet";
import { AssignGuestSheet } from "../components/rooms/AssignGuestSheet";
import { PlaceFamilySheet } from "../components/rooms/PlaceFamilySheet";
import { RoomDetailSheet } from "../components/rooms/RoomDetailSheet";
import { UnassignedListSheet } from "../components/rooms/UnassignedListSheet";
import { RoomMixCard } from "../components/rooms/RoomMixCard";
import type { GuestRow, Room, RoomBedKind } from "../domain/types";
import { functionIds, resolveDayName } from "../domain/functions";
import {
  addRoom,
  assignGuestToRoom,
  assignPeopleToRoom,
  canAssignGuest,
  clearRoom,
  createRoom,
  guestPlacedPeople,
  guestStayPeople,
  MAX_BEDS_PER_ROOM,
  nextRoomLabel,
  normalizeStayRooms,
  placeGuestInNewRoom,
  placePeopleInNewRoom,
  removeRoom,
  sequenceRooms,
  sortRooms,
  unassignedGuests,
  unassignGuestFromRoom,
} from "../domain/rooms";

export function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, setState, showToast } = useWeddingState();
  const dayIds = useMemo(() => functionIds(state), [state]);
  const urlDay = searchParams.get("day") || "";
  const activeDay = dayIds.includes(Number(urlDay)) ? urlDay : "";
  const dayLabel = activeDay ? resolveDayName(state, Number(activeDay)) : "";

  useEffect(() => {
    setState((prev) => {
      const packed = prev.rooms.some((r) => {
        if (r.capacity > MAX_BEDS_PER_ROOM) return true;
        return r.assignedGuestIds.some((id) => {
          const g = prev.guests.find((row) => row.id === id);
          const raw = r.occupancyByGuestId?.[id] ?? (g ? guestStayPeople(g) : 0);
          return raw > MAX_BEDS_PER_ROOM;
        });
      });
      const rooms = packed
        ? normalizeStayRooms(prev.rooms, prev.guests)
        : sequenceRooms(prev.rooms);
      const same =
        rooms.length === prev.rooms.length &&
        rooms.every((r, i) => r.id === prev.rooms[i].id && r.label === prev.rooms[i].label);
      return same ? prev : { ...prev, rooms };
    });
  }, [setState, state.rooms, state.guests]);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [partialListOpen, setPartialListOpen] = useState(false);
  const [placeSheet, setPlaceSheet] = useState<{ open: boolean; guest: GuestRow | null }>({
    open: false,
    guest: null,
  });
  const [assignSheet, setAssignSheet] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [detailSheet, setDetailSheet] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [roomQuery, setRoomQuery] = useState("");

  const waiting = useMemo(
    () => unassignedGuests(state.guests, state.rooms, activeDay),
    [state.guests, state.rooms, activeDay],
  );
  const unassigned = useMemo(
    () => waiting.filter((g) => guestPlacedPeople(g, state.rooms) === 0),
    [waiting, state.rooms],
  );
  const partial = useMemo(
    () => waiting.filter((g) => guestPlacedPeople(g, state.rooms) > 0),
    [waiting, state.rooms],
  );
  const needStayCount = useMemo(
    () => state.guests.filter((g) => g.needsStay).length,
    [state.guests],
  );
  const largestWaiting = useMemo(
    () => waiting.reduce((max, g) => Math.max(max, guestStayPeople(g)), 0),
    [waiting],
  );

  const query = roomQuery.trim().toLowerCase();
  const nameHit = (name: string) => !query || name.toLowerCase().includes(query);
  const visibleUnassigned = useMemo(
    () => unassigned.filter((g) => nameHit(g.name || "")),
    [unassigned, query],
  );
  const visiblePartial = useMemo(
    () => partial.filter((g) => nameHit(g.name || "")),
    [partial, query],
  );
  const visibleRooms = useMemo(
    () =>
      sortRooms(
        state.rooms.filter((room) => {
          if (!query) return true;
          if (nameHit(room.label)) return true;
          return room.assignedGuestIds.some((id) => {
            const guest = state.guests.find((row) => row.id === id);
            return guest ? nameHit(guest.name || "") : false;
          });
        }),
      ),
    [state.rooms, state.guests, query],
  );

  const handleAddRoom = useCallback(
    (label: string, bedKind: RoomBedKind, capacity: number, floor: string) => {
      setState((prev) => {
        const name = label.trim() || nextRoomLabel(prev.rooms);
        return addRoom(prev, createRoom(name, bedKind, capacity, floor));
      });
      showToast(`${label.trim() || nextRoomLabel(state.rooms)} added`);
    },
    [setState, showToast, state.rooms],
  );

  const handleAssign = useCallback(
    (roomId: string, guestId: string, people?: number) => {
      const room = state.rooms.find((r) => r.id === roomId);
      const guest = state.guests.find((g) => g.id === guestId);
      if (!room || !guest) return;
      const chunk = people ?? guestStayPeople(guest);
      const fit = canAssignGuest(room, guest, state.guests, state.rooms);
      if (people == null && !fit.ok) {
        showToast(fit.message);
        return;
      }
      setState((prev) =>
        people != null
          ? assignPeopleToRoom(prev, roomId, guestId, people)
          : assignGuestToRoom(prev, roomId, guestId),
      );
      showToast(`${guest.name} · ${chunk} placed`);
    },
    [setState, state.guests, state.rooms, showToast],
  );

  const handleCreateForGuest = useCallback(
    (guestId: string, capacity: number, label: string, people?: number) => {
      const guest = state.guests.find((g) => g.id === guestId);
      setState((prev) =>
        people != null
          ? placePeopleInNewRoom(prev, guestId, people, capacity, label)
          : placeGuestInNewRoom(prev, guestId, capacity, label),
      );
      if (guest) showToast(`${guest.name} · room added`);
    },
    [setState, state.guests, showToast],
  );

  const handleClear = useCallback(
    (roomId: string) => {
      setState((prev) => clearRoom(prev, roomId));
      showToast("Room cleared");
    },
    [setState, showToast],
  );

  const handleRemoveGuest = useCallback(
    (roomId: string, guestId: string) => {
      setState((prev) => unassignGuestFromRoom(prev, roomId, guestId));
      showToast("Guest removed");
    },
    [setState, showToast],
  );

  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      setState((prev) => removeRoom(prev, roomId));
      showToast("Room deleted");
    },
    [setState, showToast],
  );

  const handleTapFamily = useCallback((guest: GuestRow) => {
    setListOpen(false);
    setPartialListOpen(false);
    setPlaceSheet({ open: true, guest });
  }, []);

  const handleTapRoom = useCallback((room: Room) => {
    setDetailSheet({ open: true, room });
  }, []);

  const handleAssignFromDetail = useCallback((room: Room) => {
    setAssignSheet({ open: true, room });
  }, []);

  if (needStayCount === 0) {
    return (
      <div className="flex flex-col gap-2 min-h-0 flex-1">
        <ViewerBanner module="rooms" />
        <div className="mx-4 mt-6 rounded-[24px] bg-[#faf7f2] p-6 text-center">
          <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-[#1a100c]">
            Rooms
          </h2>
          <p className="mt-2 text-[13px] font-medium text-[#7a6f62] leading-relaxed">
            Mark families as Need Stay on Guests, then place them into rooms here.
          </p>
          <Link
            to="/people/guests"
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 bg-[#1a100c] text-white rounded-full text-[13px] font-extrabold"
          >
            Go to Guests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:touch-pan-y pb-28 lg:pb-8 [-webkit-overflow-scrolling:touch]">
      <ViewerBanner module="rooms" />

      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/people/guests${activeDay ? `?day=${activeDay}` : ""}`)}
            className="h-10 w-10 rounded-full bg-[#1a100c] text-white grid place-items-center shrink-0 cursor-pointer active:scale-[0.97]"
            aria-label="Back"
          >
            <span className="text-[16px] font-bold leading-none" aria-hidden>
              ←
            </span>
          </button>
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#1a100c]">
            Rooms
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setAddSheetOpen(true)}
          className="h-10 w-10 rounded-full bg-[#1a100c] text-white grid place-items-center cursor-pointer active:scale-[0.96]"
          aria-label="Add room"
        >
          <Icon name="add" className="text-[18px]" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <RoomMixCard rooms={sortRooms(state.rooms)} dayLabel={dayLabel} />
      </div>

      <div className="px-4 pb-2">
        <label className="relative block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6f62] text-[18px]"
          />
          <input
            value={roomQuery}
            onChange={(e) => setRoomQuery(e.target.value)}
            placeholder="Search rooms or families"
            autoComplete="off"
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-[rgba(26,16,12,0.1)] bg-white text-[13px] font-semibold text-[#1a100c] outline-none focus:border-[#c45a3a]/40 focus-visible:ring-2 focus-visible:ring-[#c45a3a]/25"
          />
        </label>
      </div>

      {query &&
      visibleRooms.length === 0 &&
      visibleUnassigned.length === 0 &&
      visiblePartial.length === 0 ? (
        <p className="px-4 pt-6 text-center text-[13px] font-semibold text-[#7a6f62]">
          No rooms or families match that search.
        </p>
      ) : (
        <FamilyStayGrid
          unassigned={visibleUnassigned}
          partial={visiblePartial}
          rooms={visibleRooms}
          guests={state.guests}
          onOpenUnassigned={() => setListOpen(true)}
          onOpenPartial={() => setPartialListOpen(true)}
          onTapRoom={handleTapRoom}
          onAddRoom={() => setAddSheetOpen(true)}
          day={activeDay}
        />
      )}

      <UnassignedListSheet
        open={listOpen}
        onClose={() => setListOpen(false)}
        guests={unassigned}
        rooms={state.rooms}
        onTapGuest={handleTapFamily}
      />

      <UnassignedListSheet
        open={partialListOpen}
        onClose={() => setPartialListOpen(false)}
        title="Partial"
        guests={partial}
        rooms={state.rooms}
        onTapGuest={handleTapFamily}
      />

      <AddRoomSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        existingRoomCount={state.rooms.length}
        suggestCapacity={largestWaiting || undefined}
        onAdd={handleAddRoom}
      />

      <PlaceFamilySheet
        open={placeSheet.open}
        onClose={() => setPlaceSheet({ open: false, guest: null })}
        guest={placeSheet.guest}
        rooms={state.rooms}
        onCreateRoomForGuest={handleCreateForGuest}
      />

      <AssignGuestSheet
        open={assignSheet.open}
        onClose={() => setAssignSheet({ open: false, room: null })}
        room={
          assignSheet.room
            ? state.rooms.find((r) => r.id === assignSheet.room!.id) || assignSheet.room
            : null
        }
        guests={state.guests}
        rooms={state.rooms}
        unassignedGuests={waiting}
        onAssign={handleAssign}
        onBlocked={(msg) => showToast(msg)}
      />

      <RoomDetailSheet
        open={detailSheet.open}
        onClose={() => setDetailSheet({ open: false, room: null })}
        room={
          detailSheet.room
            ? state.rooms.find((r) => r.id === detailSheet.room!.id) || detailSheet.room
            : null
        }
        guests={state.guests}
        day={activeDay}
        onAssign={handleAssignFromDetail}
        onClear={handleClear}
        onRemoveGuest={handleRemoveGuest}
        onDelete={handleDeleteRoom}
      />
    </div>
  );
}
