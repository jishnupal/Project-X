import type { GuestRow, Room } from "../../domain/types";
import { guestRemainingPeople, guestStayPeople } from "../../domain/rooms";
import { ContactAvatar } from "../ui/ContactAvatar";

interface UnassignedStayListProps {
  guests: GuestRow[];
  rooms: Room[];
  onTapGuest: (guest: GuestRow) => void;
}

export function UnassignedStayList({ guests, rooms, onTapGuest }: UnassignedStayListProps) {
  if (guests.length === 0) {
    return (
      <div className="h-14 rounded-[20px] bg-[#e8f0ea]" />
    );
  }

  return (
    <div className="space-y-2">
      {guests.map((g) => {
        const count = guestStayPeople(g);
        const left = guestRemainingPeople(g, rooms);
        const partial = left > 0 && left < count;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onTapGuest(g)}
            className="w-full min-w-0 flex items-center gap-2.5 px-3 py-3 rounded-[18px] bg-white border border-[rgba(26,16,12,0.08)] active:scale-[0.98] cursor-pointer text-left overflow-hidden"
          >
            <ContactAvatar name={g.name || "Guest"} size={40} />
            <div className="flex-1 min-w-0">
              <span className="block text-[15px] font-extrabold tracking-[-0.01em] text-[#1a100c] truncate">
                {g.name || "Guest"}
              </span>
              <span className="block text-[12px] font-medium text-[#7a5a60]">
                {partial
                  ? `${left} of ${count} left`
                  : `${count} ${count === 1 ? "person" : "people"}`}
              </span>
            </div>
            <span className="shrink-0 h-9 px-3 rounded-full bg-[#1a100c] text-white text-[12px] font-extrabold grid place-items-center">
              {partial ? "Partial" : "Give room"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
