import type { GuestRow, Room } from "../../domain/types";
import { guestRemainingPeople } from "../../domain/rooms";
import { ContactAvatar } from "../ui/ContactAvatar";

interface PartialFamilyTileProps {
  guests: GuestRow[];
  rooms: Room[];
  onOpen: () => void;
}

export function PartialFamilyTile({ guests, rooms, onOpen }: PartialFamilyTileProps) {
  const people = guests.reduce((sum, g) => sum + guestRemainingPeople(g, rooms), 0);
  const families = guests.length;
  const preview = guests.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex flex-col gap-2 p-4 rounded-[22px] text-left min-h-[140px] bg-[#f5edd8] cursor-pointer active:scale-[0.97] transition-transform"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[-0.01em] text-[#1a100c]">
          Partial
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#8a6a12] tabular-nums">
          {families}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[22px] font-extrabold tracking-[-0.04em] text-[#1a100c] leading-none">
          {people}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#8a6a12]">
          left
        </p>
      </div>

      <div className="flex -space-x-2 mt-auto">
        {preview.map((g) => (
          <span key={g.id} className="ring-2 ring-[#f5edd8] rounded-full">
            <ContactAvatar name={g.name || "Family"} size={28} />
          </span>
        ))}
        {families > preview.length && (
          <div className="w-7 h-7 rounded-full bg-[#1a100c] ring-2 ring-[#f5edd8] grid place-items-center text-white text-[9px] font-extrabold">
            +{families - preview.length}
          </div>
        )}
      </div>
    </button>
  );
}
