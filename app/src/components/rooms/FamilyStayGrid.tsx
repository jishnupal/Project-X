import type { GuestRow, Room } from "../../domain/types";
import { RoomCard, EmptyAddRoomCard } from "./RoomCard";
import { UnassignedTile } from "./UnassignedTile";
import { PartialFamilyTile } from "./PartialFamilyTile";

interface FamilyStayGridProps {
  unassigned: GuestRow[];
  partial: GuestRow[];
  rooms: Room[];
  guests: GuestRow[];
  onOpenUnassigned: () => void;
  onOpenPartial: () => void;
  onTapRoom: (room: Room) => void;
  onAddRoom: () => void;
  day?: string | number | null;
}

export function FamilyStayGrid({
  unassigned,
  partial,
  rooms,
  guests,
  onOpenUnassigned,
  onOpenPartial,
  onTapRoom,
  onAddRoom,
  day,
}: FamilyStayGridProps) {
  const waiting = unassigned.length > 0;
  const hasPartial = partial.length > 0;

  return (
    <div className="px-4 pt-1 pb-8 space-y-3">
      {waiting || hasPartial ? (
        <div className="grid grid-cols-2 gap-3">
          {waiting ? (
            <UnassignedTile guests={unassigned} rooms={rooms} onOpen={onOpenUnassigned} />
          ) : null}
          {hasPartial ? (
            <PartialFamilyTile guests={partial} rooms={rooms} onOpen={onOpenPartial} />
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {rooms.length === 0 ? (
          waiting || hasPartial ? null : <EmptyAddRoomCard onTap={onAddRoom} />
        ) : (
          rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              guests={guests}
              day={day}
              sequence={index + 1}
              onTap={onTapRoom}
            />
          ))
        )}
      </div>
    </div>
  );
}
