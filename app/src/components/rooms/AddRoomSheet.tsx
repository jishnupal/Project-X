import { useState } from "react";
import type { RoomBedKind } from "../../domain/types";
import { bedKindFromCapacity, MAX_BEDS_PER_ROOM } from "../../domain/rooms";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

interface AddRoomSheetProps {
  open: boolean;
  onClose: () => void;
  existingRoomCount: number;
  /** Suggested capacity when a large family is still waiting */
  suggestCapacity?: number;
  onAdd: (label: string, bedKind: RoomBedKind, capacity: number, floor: string) => void;
}

const QUICK = [2, 3, 4] as const;

export function AddRoomSheet({
  open,
  onClose,
  existingRoomCount,
  suggestCapacity,
  onAdd,
}: AddRoomSheetProps) {
  const defaultCap = Math.min(MAX_BEDS_PER_ROOM, suggestCapacity && suggestCapacity >= 2 ? suggestCapacity : 2);
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(defaultCap);
  const [floor, setFloor] = useState("");
  const [showMore, setShowMore] = useState(false);

  const previewName = label.trim() || `Room ${existingRoomCount + 1}`;

  const reset = () => {
    setLabel("");
    setCapacity(defaultCap);
    setFloor("");
    setShowMore(false);
  };

  const handleAdd = () => {
    const bedKind = bedKindFromCapacity(capacity);
    onAdd(label.trim(), bedKind, Math.max(1, capacity), floor.trim());
    reset();
    onClose();
  };

  return (
    <MobileSheet open={open} onClose={onClose} title="Add room" height="content">
      <div className="px-4 pb-6 space-y-5">
        <div>
          <p className="text-[11px] font-bold text-[#7a6f62] uppercase tracking-[0.12em] mb-2">
            How many people?
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCapacity(n)}
                className={cn(
                  "h-11 min-w-[3.25rem] px-3 rounded-full text-[13px] font-extrabold cursor-pointer transition-all",
                  capacity === n
                    ? "bg-[#1a100c] text-white"
                    : "bg-[#faf7f2] text-[#1a100c] border border-[rgba(26,16,12,0.08)]",
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-[18px] bg-[#faf7f2]">
            <span className="text-[12px] font-semibold text-[#7a6f62]">Exact count</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.max(2, c - 1))}
                className="w-9 h-9 rounded-full bg-white border border-[rgba(26,16,12,0.1)] grid place-items-center cursor-pointer"
                aria-label="Decrease"
              >
                <Icon name="remove" className="text-[16px] text-[#1a100c]" />
              </button>
              <span className="w-8 text-center text-[18px] font-extrabold text-[#1a100c] tabular-nums">
                {capacity}
              </span>
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.min(MAX_BEDS_PER_ROOM, c + 1))}
                className="w-9 h-9 rounded-full bg-white border border-[rgba(26,16,12,0.1)] grid place-items-center cursor-pointer"
                aria-label="Increase"
              >
                <Icon name="add" className="text-[16px] text-[#1a100c]" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[12px] font-medium text-[#7a6f62]">
            A room holds at most {MAX_BEDS_PER_ROOM}. Bigger families split across rooms.
            {suggestCapacity && suggestCapacity > MAX_BEDS_PER_ROOM ? (
              <span className="block mt-1 text-[#9a3412]">
                A waiting family has {suggestCapacity} people — they’ll need more than one room.
              </span>
            ) : null}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-[12px] font-bold text-[#7a6f62] cursor-pointer"
          >
            {showMore ? "Hide name & floor" : "Optional name & floor"}
          </button>
          {showMore && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#7a6f62] mb-1.5">
                  Name <span className="font-medium opacity-60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={previewName}
                  className="w-full px-4 py-3 rounded-[18px] border border-[rgba(26,16,12,0.1)] bg-white font-medium text-[14px] text-[#1a100c] outline-none focus:ring-2 focus:ring-[rgba(26,16,12,0.12)] placeholder:text-[#7a6f62]/45"
                />
                <p className="mt-1.5 text-[11px] text-[#7a6f62]">
                  Leave blank → saves as {previewName}
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#7a6f62] mb-1.5">
                  Floor / wing <span className="font-medium opacity-60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="East wing"
                  className="w-full px-4 py-3 rounded-[18px] border border-[rgba(26,16,12,0.1)] bg-white font-medium text-[14px] text-[#1a100c] outline-none focus:ring-2 focus:ring-[rgba(26,16,12,0.12)] placeholder:text-[#7a6f62]/45"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-3.5 rounded-[18px] font-extrabold text-[14px] tracking-[-0.01em] flex items-center justify-center gap-2 bg-[#1a100c] text-white active:scale-[0.98] transition-transform cursor-pointer"
        >
          <Icon name="add" className="text-[18px]" />
          Add {previewName} · {capacity} beds
        </button>
      </div>
    </MobileSheet>
  );
}
