import { useMemo, useState } from "react";
import type { GuestRow } from "../../domain/types";
import { guestContactInitials, guestContactTone } from "../guest/guestContactLook";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type AddBuddySheetProps = {
  open: boolean;
  onClose: () => void;
  guests: GuestRow[];
  onAdd: (guestId: string) => void;
};

export function AddBuddySheet({ open, onClose, guests, onAdd }: AddBuddySheetProps) {
  const [query, setQuery] = useState("");
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const openGuests = guests.filter((row) => !row.isBuddy && row.name.trim());
    if (!q) return openGuests;
    return openGuests.filter((row) => row.name.toLowerCase().includes(q));
  }, [guests, query]);

  return (
    <MobileSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title="Add buddy"
      height="tall"
    >
      <div className="px-4 pb-6 space-y-3">
        <label className="block">
          <span className="sr-only">Search guests</span>
          <span className="flex items-center gap-2 h-11 px-3 rounded-2xl bg-[#faf7f2]">
            <Icon name="search" className="text-[18px] text-[#7a6f62]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guest list"
              className="flex-1 bg-transparent text-[14px] font-semibold text-[#1a100c] outline-none placeholder:text-[#7a6f62]/70"
            />
          </span>
        </label>

        {candidates.length === 0 ? (
          <p className="px-1 py-6 text-[13px] font-semibold text-[#7a6f62]">
            {guests.every((row) => row.isBuddy)
              ? "Everyone on the guest list is already a buddy."
              : "No matching guests."}
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(row.id);
                    setQuery("");
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-[22px] bg-[#faf7f2] px-3 py-3 text-left active:scale-[0.99]"
                >
                  <span
                    className={cn(
                      "h-9 w-9 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0",
                      guestContactTone(row.id),
                    )}
                  >
                    {guestContactInitials(row.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#1a100c]">
                      {row.name}
                    </span>
                    <span className="block text-[11px] font-semibold text-[#7a6f62]">
                      From guest list
                    </span>
                  </span>
                  <Icon name="add" className="text-[20px] text-[#8a5548]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileSheet>
  );
}
