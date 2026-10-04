import { guestStaysOnDay } from "../../domain/guest";
import type { GuestRow, Room } from "../../domain/types";
import {
  BED_KIND_LABELS,
  familyFirstName,
  guestStayPeople,
  occupancyInRoom,
  resolveBedKind,
  roomHeadcount,
} from "../../domain/rooms";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

interface RoomDetailSheetProps {
  open: boolean;
  onClose: () => void;
  room: Room | null;
  guests: GuestRow[];
  onAssign: (room: Room) => void;
  onClear: (roomId: string) => void;
  onRemoveGuest: (roomId: string, guestId: string) => void;
  onDelete: (roomId: string) => void;
  day?: string | number | null;
}

export function RoomDetailSheet({
  open,
  onClose,
  room,
  guests,
  onAssign,
  onClear,
  onRemoveGuest,
  onDelete,
  day,
}: RoomDetailSheetProps) {
  if (!room) return null;

  const headcount = roomHeadcount(room, guests, day);
  const booked = roomHeadcount(room, guests);
  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const occupied = room.assignedGuestIds.some((id) => guestMap.has(id));
  const bedKind = resolveBedKind(room);
  const full = booked >= room.capacity;
  const fillRatio = room.capacity > 0 ? Math.min(1, headcount / room.capacity) : 0;

  return (
    <MobileSheet open={open} onClose={onClose} title={room.label} height="content">
      <div className="px-4 pb-6 space-y-5">
        <div className="p-3.5 rounded-[22px] bg-[#faf7f2] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-extrabold tracking-[-0.01em] text-[#1a100c]">
                {headcount}/{room.capacity} tonight
              </p>
              <p className="text-[11px] font-medium text-[#7a6f62] mt-0.5">
                {BED_KIND_LABELS[bedKind]}
                {room.floor ? ` · ${room.floor}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold",
                full ? "bg-[#e8f0ea] text-[#059669]" : "bg-white text-[#7a6f62]",
              )}
            >
              {full ? "Full" : "Open"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(26,16,12,0.06)] overflow-hidden">
            <div
              className={cn("h-full rounded-full", full ? "bg-[#059669]" : "bg-[#1a100c]")}
              style={{ width: `${fillRatio * 100}%` }}
            />
          </div>
        </div>

        {occupied ? (
          <div>
            <h4 className="text-[11px] font-bold text-[#7a6f62] uppercase tracking-[0.12em] mb-2">
              Families
            </h4>
            <div className="space-y-2">
              {room.assignedGuestIds.map((id) => {
                const g = guestMap.get(id);
                if (!g) return null;
                const count = occupancyInRoom(room, id, guests);
                const total = guestStayPeople(g);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-[18px] bg-white border border-[rgba(26,16,12,0.06)]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#faf7f2] grid place-items-center text-[#1a100c] text-[12px] font-extrabold shrink-0">
                      {(g.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[13px] font-extrabold text-[#1a100c] truncate">
                        {familyFirstName(g.name)}
                      </span>
                      <span className="block text-[11px] font-medium text-[#7a6f62]">
                        {guestStaysOnDay(g, day)
                          ? `${count} in this room${total > count ? ` · ${total} in family` : ""}`
                          : "Not this night"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveGuest(room.id, id)}
                      className="w-8 h-8 rounded-full border border-[rgba(26,16,12,0.1)] grid place-items-center text-[#7a6f62] cursor-pointer"
                      aria-label={`Remove ${g.name}`}
                    >
                      <Icon name="close" className="text-[14px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-[12px] font-medium text-[#7a6f62] py-4">
            No families assigned yet
          </p>
        )}

        <div className="space-y-2 pt-1">
          {!full && (
            <button
              type="button"
              onClick={() => {
                onClose();
                window.setTimeout(() => onAssign(room), 200);
              }}
              className="w-full py-3 rounded-[18px] font-extrabold text-[13px] flex items-center justify-center gap-2 bg-[#1a100c] text-white active:scale-[0.98] cursor-pointer"
            >
              <Icon name="person_add" className="text-[18px]" />
              Assign family
            </button>
          )}

          {occupied && (
            <button
              type="button"
              onClick={() => {
                onClear(room.id);
                onClose();
              }}
              className="w-full py-3 rounded-[18px] font-bold text-[13px] text-[#7a6f62] border border-[rgba(26,16,12,0.1)] cursor-pointer"
            >
              Clear room
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onDelete(room.id);
              onClose();
            }}
            className="w-full py-3 rounded-[18px] font-bold text-[13px] text-red-600/80 cursor-pointer"
          >
            Delete room
          </button>
        </div>
      </div>
    </MobileSheet>
  );
}
