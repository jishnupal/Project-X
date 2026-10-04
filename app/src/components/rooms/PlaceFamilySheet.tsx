import { useEffect, useState } from "react";
import type { GuestRow, Room } from "../../domain/types";
import {
  guestRemainingPeople,
  occupancyInRoom,
  roomsForGuest,
} from "../../domain/rooms";
import { MobileSheet } from "../ui/MobileSheet";
import { ContactAvatar } from "../ui/ContactAvatar";
import { Icon } from "../ui/Icon";
import { RoomGlyph } from "./RoomGlyph";
import { cn } from "../../design-system/cn";

type Step = "add" | "size" | "confirm" | "done";
type Kind = 2 | 3 | 4;

const KINDS: Kind[] = [2, 3, 4];

interface PlaceFamilySheetProps {
  open: boolean;
  onClose: () => void;
  guest: GuestRow | null;
  rooms: Room[];
  onCreateRoomForGuest: (guestId: string, capacity: number, label: string, people: number) => void;
}

function leftoverSlots(people: number): number[] {
  const n = Math.max(0, people);
  if (n === 0) return [];
  const slots: number[] = [];
  let left = n;
  while (left > 0) {
    const chunk = Math.min(4, left);
    slots.push(chunk);
    left -= chunk;
  }
  return slots;
}

export function PlaceFamilySheet({
  open,
  onClose,
  guest,
  rooms,
  onCreateRoomForGuest,
}: PlaceFamilySheetProps) {
  const [step, setStep] = useState<Step>("add");
  const [kind, setKind] = useState<Kind>(2);

  const leftover = guest ? guestRemainingPeople(guest, rooms) : 0;
  const doneRooms = guest ? roomsForGuest(guest, rooms) : [];
  const peopleInRoom = Math.min(kind, leftover || 1);

  useEffect(() => {
    if (!open || !guest) return;
    setStep(leftover <= 0 ? "done" : "add");
    setKind(2);
  }, [open, guest?.id]);

  if (!open || !guest) return null;

  const goBack = () => {
    if (step === "size") setStep("add");
    else if (step === "confirm") setStep("size");
    else onClose();
  };

  const completeRoom = () => {
    onCreateRoomForGuest(guest.id, kind, "", peopleInRoom);
    const after = leftover - peopleInRoom;
    setKind(2);
    setStep(after <= 0 ? "done" : "add");
  };

  return (
    <MobileSheet
      open={open}
      onClose={goBack}
      title={guest.name || "Family"}
      height="tall"
      headerAction="back"
      zIndexClass="z-[80]"
    >
      <div className="px-4 pb-10 space-y-5">
        <div className="flex flex-col items-center pt-1">
          <ContactAvatar name={guest.name || "Family"} size={52} />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {doneRooms.map((room) => (
              <RoomGlyph
                key={room.id}
                capacity={room.capacity}
                filled={occupancyInRoom(room, guest.id, [guest])}
              />
            ))}
            {leftoverSlots(leftover).map((beds, i) => (
              <RoomGlyph key={`wait-${i}`} capacity={beds} filled={0} ghost />
            ))}
          </div>
        </div>

        {step === "add" && leftover > 0 && (
          <button
            type="button"
            onClick={() => setStep("size")}
            aria-label="Add a room"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-dashed border-[#1a100c]/25 text-[#1a100c] active:scale-[0.96]"
          >
            <Icon name="add" className="text-[26px]" />
          </button>
        )}

        {step === "size" && leftover > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} beds`}
                onClick={() => {
                  setKind(n);
                  setStep("confirm");
                }}
                className={cn(
                  "rounded-[20px] py-4 grid place-items-center active:scale-[0.97] cursor-pointer",
                  "bg-white border border-[rgba(26,16,12,0.08)]",
                )}
              >
                <RoomGlyph capacity={n} filled={Math.min(n, leftover)} />
              </button>
            ))}
          </div>
        )}

        {step === "confirm" && leftover > 0 && (
          <div className="flex flex-col items-center gap-4">
            <RoomGlyph capacity={kind} filled={peopleInRoom} size="lg" />
            <button
              type="button"
              onClick={completeRoom}
              aria-label="Complete"
              className="h-14 w-14 rounded-full bg-[#1a100c] text-white grid place-items-center active:scale-[0.96]"
            >
              <Icon name="check" className="text-[22px]" />
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[#e8f0ea] text-[#059669] grid place-items-center">
              <Icon name="check" className="text-[22px]" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Done"
              className="h-12 w-12 rounded-full bg-[#1a100c] text-white grid place-items-center"
            >
              <Icon name="arrow_back" className="text-[18px]" />
            </button>
          </div>
        )}
      </div>
    </MobileSheet>
  );
}
