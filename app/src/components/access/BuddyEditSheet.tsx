import { tasksForBuddy } from "../../domain/buddies";
import type { BuddyTask, GuestRow } from "../../domain/types";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type BuddyEditSheetProps = {
  open: boolean;
  onClose: () => void;
  buddy: GuestRow | null;
  tasks: BuddyTask[];
  onToggleTask: (taskId: string) => void;
  onRemove: () => void;
};

export function BuddyEditSheet({
  open,
  onClose,
  buddy,
  tasks,
  onToggleTask,
  onRemove,
}: BuddyEditSheetProps) {
  if (!buddy) return null;
  const mine = tasksForBuddy(tasks, buddy.id);

  return (
    <MobileSheet open={open} onClose={onClose} title={buddy.name} height="content">
      <div className="px-4 pb-6 space-y-4">
        <div>
          <p className="text-[13px] font-bold text-[#7a6f62]">
            Their tasks
          </p>
          {mine.length === 0 ? (
            <p className="mt-2 text-[13px] font-semibold text-[#7a6f62]">
              No tasks assigned yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {mine.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="w-full flex items-center gap-3 rounded-[18px] bg-[#faf7f2] px-3 py-3 text-left"
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full grid place-items-center shrink-0",
                        task.done ? "bg-[#1a100c] text-white" : "bg-white text-[#1a100c]",
                      )}
                    >
                      <Icon
                        name={task.done ? "check" : "radio_button_unchecked"}
                        className="text-[16px]"
                      />
                    </span>
                    <span
                      className={cn(
                        "text-[14px] font-bold text-[#1a100c]",
                        task.done && "line-through decoration-[#1a100c]/35",
                      )}
                    >
                      {task.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="h-11 w-full rounded-full text-[13px] font-bold text-[#1a100c]"
        >
          Remove buddy
        </button>
      </div>
    </MobileSheet>
  );
}
