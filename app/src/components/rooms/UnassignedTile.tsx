import type { GuestRow, Room } from "../../domain/types";
import { guestRemainingPeople } from "../../domain/rooms";
import { ContactAvatar } from "../ui/ContactAvatar";

interface UnassignedTileProps {
  guests: GuestRow[];
  rooms: Room[];
  onOpen: () => void;
}

export function UnassignedTile({ guests, rooms, onOpen }: UnassignedTileProps) {
  const people = guests.reduce((sum, g) => sum + guestRemainingPeople(g, rooms), 0);
  const families = guests.length;
  const preview = guests.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex flex-col gap-2 p-4 rounded-[22px] text-left min-h-[140px] bg-[#f3e4e6] cursor-pointer active:scale-[0.97] transition-transform"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[-0.01em] text-[#1a100c]">
          Unassigned
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#7a5a60] tabular-nums">
          {families}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[22px] font-extrabold tracking-[-0.04em] text-[#1a100c] leading-none">
          {people}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#7a5a60]">
          waiting
        </p>
      </div>

      <div className="flex -space-x-2 mt-auto">
        {preview.map((g) => (
          <span key={g.id} className="ring-2 ring-[#f3e4e6] rounded-full">
            <ContactAvatar name={g.name || "Family"} size={28} />
          </span>
        ))}
        {families > preview.length && (
          <div className="w-7 h-7 rounded-full bg-[#1a100c] ring-2 ring-[#f3e4e6] grid place-items-center text-white text-[9px] font-extrabold">
            +{families - preview.length}
          </div>
        )}
      </div>
    </button>
  );
}
