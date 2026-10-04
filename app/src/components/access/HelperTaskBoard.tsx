import { touchBuddyTask } from "../../domain/buddies";
import type { BuddyTask } from "../../domain/types";
import { appendActivity, createActivityItem } from "../../domain/activity";
import { dispatchPushNotify } from "../../domain/pushClient";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { BuzzPlayBoard } from "../buzz/BuzzPlayBoard";

function readClaimGuestId(): string {
  try {
    return sessionStorage.getItem("biyeflow.claimGuestId") || "";
  } catch {
    return "";
  }
}

export function HelperTaskBoard() {
  const { state, setState, showToast, syncCode } = useWeddingState();
  const { profile } = useAccess();
  const { memberships, user } = useAuth();
  const claimGuestId = readClaimGuestId();
  const matchedGuests = state.guests.filter((guest) => {
    if (claimGuestId && guest.id === claimGuestId) return true;
    if (profile?.name && guest.isBuddy && guest.name.trim() === profile.name.trim()) return true;
    return false;
  });
  const allowedIds = new Set(matchedGuests.map((guest) => guest.id));
  const tasks = (state.tasks || []).filter((task) =>
    allowedIds.size ? allowedIds.has(task.guestId) : false,
  );
  const open = tasks.filter((task) => !task.done).length;
  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === (syncCode || "").toUpperCase(),
  );
  const helperName =
    matchedGuests[0]?.name?.trim() || profile?.name?.trim() || user?.name?.trim() || "Buddy";

  const toggle = (task: BuddyTask) => {
    const markingDone = !task.done;
    const item = createActivityItem({
      type: "task.updated",
      title: markingDone ? `${helperName} completed a task` : `${helperName} reopened a task`,
      body: task.title,
      href: "/buddies",
      audience: "host",
    });
    setState((prev) =>
      appendActivity(
        {
          ...prev,
          tasks: prev.tasks.map((row) =>
            row.id === task.id ? touchBuddyTask(row, { done: !row.done }) : row,
          ),
        },
        item,
      ),
    );
    if (markingDone) {
      showToast("Task done");
      if (syncCode) {
        void fetch("/api/buddies/task-done", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: syncCode, taskId: task.id }),
        }).catch(() => undefined);
      }
    }
    void dispatchPushNotify({
      eventId: membership?.eventId,
      eventCode: syncCode,
      type: item.type,
      title: item.title,
      body: item.body,
      href: "/command-center",
      audience: "host",
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(8.8rem+env(safe-area-inset-bottom))] mx-auto w-full max-w-lg">
        <header className="buddies-head">
          <h1 className="buddies-title">Your tasks</h1>
          <p className="buddies-progress">
            {tasks.length === 0 ? "Nothing assigned yet." : `${open} still open`}
          </p>
        </header>
        {tasks.length === 0 ? (
          <p className="mt-6 text-[13px] font-semibold text-[#7a6f62]">
            The host will add tasks here. You only mark them done.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggle(task)}
                  className={cn("buddies-row w-full text-left", task.done ? "is-done" : "is-open")}
                >
                  <span className="buddies-row__tick" aria-hidden>
                    <Icon
                      name={task.done ? "check" : "radio_button_unchecked"}
                      className="text-[18px]"
                    />
                  </span>
                  <span
                    className={cn(
                      "buddies-row__title",
                      task.done && "line-through decoration-[#1c1410]/30",
                    )}
                  >
                    {task.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <BuzzPlayBoard />
        </div>
      </div>
    </div>
  );
}
