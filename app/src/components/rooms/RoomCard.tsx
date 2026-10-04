import type { GuestRow, Room } from "../../domain/types";
import {
  BED_KIND_LABELS,
  displayRoomLabel,
  familyFirstName,
  isAutoRoomLabel,
  resolveBedKind,
  roomFamiliesOnDay,
  roomHeadcount,
} from "../../domain/rooms";
import { Icon } from "../ui/Icon";
import { FamilyContactAvatars } from "../ui/ContactAvatar";
import { cn } from "../../design-system/cn";

interface RoomCardProps {
  room: Room;
  guests: GuestRow[];
  onTap: (room: Room) => void;
  day?: string | number | null;
  sequence?: number;
}

export function RoomCard({ room, guests, onTap, day, sequence }: RoomCardProps) {
  const tonight = roomFamiliesOnDay(room, guests, day);
  const laterOnly =
    tonight.length === 0 &&
    room.assignedGuestIds.some((id) => guests.some((g) => g.id === id));
  const headcount = roomHeadcount(room, guests, day);
  const occupied = tonight.length > 0;
  const bedKind = resolveBedKind(room);
  const fillRatio = room.capacity > 0 ? Math.min(1, headcount / room.capacity) : 0;
  const full = headcount >= room.capacity;
  const title = sequence != null ? displayRoomLabel(sequence - 1) : room.label;
  const customName = !isAutoRoomLabel(room.label) ? room.label.trim() : "";

  return (
    <button
      type="button"
      onClick={() => onTap(room)}
      className={cn(
        "relative flex flex-col gap-1.5 p-4 rounded-[22px] text-left transition-all active:scale-[0.97] cursor-pointer",
        "min-h-[140px]",
        occupied
          ? "bg-white border border-[rgba(26,16,12,0.08)] shadow-[0_8px_24px_-16px_rgba(26,16,12,0.18)]"
          : "bg-[#faf7f2] border border-dashed border-[rgba(26,16,12,0.14)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[-0.01em] text-[#1a100c] truncate">
          {title}
          {customName ? ` · ${customName}` : ""}
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#7a6f62] tabular-nums">
          {headcount}/{room.capacity}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
        {occupied ? (
          <ul className="space-y-1.5 min-w-0">
            {tonight.slice(0, 3).map((g) => (
              <li key={g.id} className="flex items-center gap-2 min-w-0">
                <FamilyContactAvatars name={g.name || "Family"} size={26} />
                <span className="text-[13px] font-extrabold tracking-[-0.02em] text-[#1a100c] truncate">
                  {familyFirstName(g.name)}
                </span>
              </li>
            ))}
            {tonight.length > 3 ? (
              <li className="text-[11px] font-semibold text-[#7a6f62] pl-[34px]">
                +{tonight.length - 3}
              </li>
            ) : null}
          </ul>
        ) : laterOnly ? (
          <p className="text-[12px] font-semibold text-[#7a6f62]">Free tonight</p>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-2">
            <Icon name="person_add" className="text-[18px] text-[#7a6f62]/50" />
            <span className="text-[11px] font-semibold text-[#7a6f62]/70">Assign</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mt-auto">
        <div className="h-1 rounded-full bg-[rgba(26,16,12,0.06)] overflow-hidden">
          <div
            className={cn("h-full rounded-full", full ? "bg-[#059669]" : "bg-[#1a100c]")}
            style={{ width: `${fillRatio * 100}%` }}
          />
        </div>
        <p className="text-[10px] font-semibold text-[#7a6f62]">
          {BED_KIND_LABELS[bedKind]}
          {full ? " · Full" : occupied ? " · Space left" : laterOnly ? " · Later" : " · Empty"}
        </p>
      </div>
    </button>
  );
}

interface EmptyAddRoomCardProps {
  onTap: () => void;
}

export function EmptyAddRoomCard({ onTap }: EmptyAddRoomCardProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="col-span-2 flex flex-col items-center justify-center gap-2 p-6 rounded-[22px] min-h-[120px] bg-[#faf7f2] border border-dashed border-[rgba(26,16,12,0.14)] active:scale-[0.98] cursor-pointer"
    >
      <span className="text-[14px] font-extrabold tracking-[-0.02em] text-[#1a100c]">
        Add first room
      </span>
      <span className="text-[12px] font-medium text-[#7a6f62]">
        Or tap Unassigned
      </span>
    </button>
  );
}
