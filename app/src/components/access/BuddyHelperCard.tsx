import { guestContactInitials } from "../guest/guestContactLook";
import { familyFirstName } from "../../domain/rooms";
import { tasksForBuddy } from "../../domain/buddies";
import type { BuddyTask, GuestRow } from "../../domain/types";
import { cn } from "../../design-system/cn";

const TONES = ["is-peach", "is-citrus", "is-sage", "is-sand"] as const;

type BuddyHelperCardProps = {
  buddy: GuestRow;
  tasks: BuddyTask[];
  tone: number;
  onOpen: () => void;
};

function helperLine(tasks: BuddyTask[]): string {
  const open = tasks.filter((row) => !row.done);
  if (tasks.length === 0) return "No tasks yet";
  if (open.length === 0) return "All done";
  return open[0].title;
}

export function BuddyHelperCard({ buddy, tasks, tone, onOpen }: BuddyHelperCardProps) {
  const mine = tasksForBuddy(tasks, buddy.id);
  const first = familyFirstName(buddy.name);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("buddies-person", TONES[tone % TONES.length])}
    >
      <span className="buddies-person__face">{guestContactInitials(buddy.name)}</span>
      <span className="buddies-person__name">{first}</span>
      <span className="buddies-person__meta">{helperLine(mine)}</span>
    </button>
  );
}
