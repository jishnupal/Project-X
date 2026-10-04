import { useMemo, useState } from "react";
import type { GuestRow, Room } from "../../domain/types";
import { guestRemainingPeople } from "../../domain/rooms";
import { MobileSheet } from "../ui/MobileSheet";
import { UnassignedStayList } from "./UnassignedStayList";
import { Icon } from "../ui/Icon";

interface UnassignedListSheetProps {
  open: boolean;
  onClose: () => void;
  guests: GuestRow[];
  rooms?: Room[];
  onTapGuest: (guest: GuestRow) => void;
  title?: string;
}

export function UnassignedListSheet({
  open,
  onClose,
  guests,
  rooms = [],
  onTapGuest,
  title = "Unassigned",
}: UnassignedListSheetProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => (g.name || "").toLowerCase().includes(q));
  }, [guests, query]);
  const people = filtered.reduce((sum, g) => sum + guestRemainingPeople(g, rooms), 0);

  return (
    <MobileSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title={title}
      height="tall"
      headerAction="back"
    >
      <div className="px-4 pb-10 space-y-3">
        <label className="relative block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6f62] text-[18px]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search families"
            autoComplete="off"
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-[rgba(26,16,12,0.1)] bg-white text-[13px] font-semibold text-[#1a100c] outline-none focus:border-[#c45a3a]/40 focus-visible:ring-2 focus-visible:ring-[#c45a3a]/25"
          />
        </label>
        <p className="text-[13px] font-medium text-[#7a6f62]">
          {filtered.length === 0
            ? guests.length === 0
              ? "Everyone has a room."
              : "No matching families."
            : `${people} · ${filtered.length} waiting`}
        </p>
        <UnassignedStayList guests={filtered} rooms={rooms} onTapGuest={onTapGuest} />
      </div>
    </MobileSheet>
  );
}
