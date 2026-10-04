import { familyFirstName } from "../../domain/rooms";
import type { BuddyTask, GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type BuddyTaskCardProps = {
  task: BuddyTask;
  buddy?: GuestRow;
  onToggle: () => void;
  onEdit: () => void;
};

export function BuddyTaskCard({ task, buddy, onToggle, onEdit }: BuddyTaskCardProps) {
  return (
    <div className={cn("buddies-row", task.done ? "is-done" : "is-open")}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.done}
        aria-label={task.done ? "Mark open" : "Mark done"}
        className="buddies-row__tick"
      >
        <Icon
          name={task.done ? "check" : "radio_button_unchecked"}
          className="text-[18px]"
        />
      </button>
      <button type="button" onClick={onEdit} className="buddies-row__body">
        <span
          className={cn(
            "buddies-row__title",
            task.done && "line-through decoration-[#1c1410]/30",
          )}
        >
          {task.title}
        </span>
        {buddy ? (
          <span className="buddies-row__who">{familyFirstName(buddy.name)}</span>
        ) : null}
      </button>
    </div>
  );
}
