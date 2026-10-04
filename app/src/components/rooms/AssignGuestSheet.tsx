import { useMemo, useState } from "react";
import type { GuestRow, Room } from "../../domain/types";
import {
  canAssignGuest,
  guestRemainingPeople,
  guestStayPeople,
  roomHeadcount,
  roomRemainingCapacity,
} from "../../domain/rooms";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

interface AssignGuestSheetProps {
  open: boolean;
  onClose: () => void;
  room: Room | null;
  guests: GuestRow[];
  rooms?: Room[];
  unassignedGuests: GuestRow[];
  onAssign: (roomId: string, guestId: string, people?: number) => void;
  onBlocked?: (message: string) => void;
}

export function AssignGuestSheet({
  open,
  onClose,
  room,
  guests,
  rooms = [],
  unassignedGuests,
  onAssign,
  onBlocked,
}: AssignGuestSheetProps) {
  const [search, setSearch] = useState("");

  const remaining = room ? roomRemainingCapacity(room, guests) : 0;
  const filled = room ? roomHeadcount(room, guests) : 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedGuests;
    const q = search.toLowerCase();
    return unassignedGuests.filter((g) => (g.name || "").toLowerCase().includes(q));
  }, [unassignedGuests, search]);

  const handlePick = (guest: GuestRow) => {
    if (!room) return;
    const fit = canAssignGuest(room, guest, guests);
    if (!fit.ok) {
      onBlocked?.(fit.message);
      return;
    }
    onAssign(room.id, guest.id);
    setSearch("");
    onClose();
  };

  return (
    <MobileSheet
      open={open}
      onClose={() => {
        setSearch("");
        onClose();
      }}
      title={room ? `Assign to ${room.label}` : "Assign"}
      height="tall"
      headerAction="back"
    >
      <div className="px-4 pb-10 space-y-3">
        {room && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[18px] bg-[#faf7f2]">
            <span className="text-[12px] font-semibold text-[#7a6f62]">
              {filled}/{room.capacity} in room
            </span>
            <span className="text-[12px] font-extrabold text-[#1a100c]">
              {remaining === 0 ? "Full" : `${remaining} left`}
            </span>
          </div>
        )}

        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-[#7a6f62]/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find family…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[rgba(26,16,12,0.1)] bg-white font-medium text-[13px] text-[#1a100c] outline-none placeholder:text-[#7a6f62]/40"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-10 text-[12px] font-medium text-[#7a6f62]">
            {unassignedGuests.length === 0 ? "All families have rooms" : "No match"}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((g) => {
              const count = guestStayPeople(g);
              const left = guestRemainingPeople(g, rooms);
              const fit = room
                ? canAssignGuest(room, g, guests, rooms)
                : { ok: false as const, remaining: 0, needed: left, message: "" };
              const blocked = !fit.ok;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handlePick(g)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-[18px] border transition-all active:scale-[0.98] cursor-pointer text-left",
                    blocked
                      ? "bg-[#faf7f2]/60 border-transparent opacity-55"
                      : "bg-white border-[rgba(26,16,12,0.08)]",
                  )}
                >
                  <div className="w-9 h-9 rounded-2xl bg-[#faf7f2] grid place-items-center text-[#1a100c] text-[13px] font-extrabold shrink-0">
                    {(g.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[14px] font-extrabold text-[#1a100c] truncate">
                      {g.name || "Guest"}
                    </span>
                    <span className="block text-[11px] font-medium text-[#7a6f62]">
                      {left} of {count} to place
                    </span>
                    {blocked && "message" in fit && fit.message ? (
                      <span className="block text-[10px] font-semibold text-[#9a3412] mt-0.5">
                        {fit.message}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileSheet>
  );
}
