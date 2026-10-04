import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useAuth } from "../hooks/useAuth";
import { useWeddingState } from "../hooks/useWeddingState";
import {
  buddyTaskProgress,
  createBuddyTask,
  listBuddies,
  touchBuddyTask,
} from "../domain/buddies";
import { appendActivity, createActivityItem } from "../domain/activity";
import { dispatchPushNotify } from "../domain/pushClient";
import { touchGuestRow } from "../domain/guest";
import type { BuddyTask } from "../domain/types";
import { BuddyHelperCard } from "../components/access/BuddyHelperCard";
import { BuddyTaskCard } from "../components/access/BuddyTaskCard";
import { AddBuddySheet } from "../components/access/AddBuddySheet";
import { BuddyEditSheet } from "../components/access/BuddyEditSheet";
import { CreateBuddyTaskSheet } from "../components/access/CreateBuddyTaskSheet";
import { ConfirmDangerDialog } from "../components/ui/ConfirmDangerDialog";
import { HelperTaskBoard } from "../components/access/HelperTaskBoard";
import { SessionLoading } from "../components/layout/SessionLoading";
import { Icon } from "../components/ui/Icon";

export function BuddiesPage() {
  const { state, setState, showToast, syncCode } = useWeddingState();
  const { session, canManage } = useAccess();
  const { memberships } = useAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BuddyTask | null>(null);
  const [editBuddyId, setEditBuddyId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const buddies = useMemo(() => listBuddies(state.guests), [state.guests]);
  const tasks = state.tasks || [];
  const progress = buddyTaskProgress(tasks);
  const editingBuddy = buddies.find((row) => row.id === editBuddyId) || null;
  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === (syncCode || "").toUpperCase(),
  );

  if (!syncCode || !session) return <SessionLoading />;
  if (session.role === "buddy") return <HelperTaskBoard />;
  if (!canManage) return <Navigate to="/command-center" replace />;

  const addHelper = (guestId: string) => {
    setState((prev) => ({
      ...prev,
      guests: prev.guests.map((row) =>
        row.id === guestId ? touchGuestRow({ ...row, isBuddy: true }) : row,
      ),
    }));
    showToast("Buddy added");
  };

  const removeHelper = (guestId: string) => {
    setState((prev) => ({
      ...prev,
      guests: prev.guests.map((row) =>
        row.id === guestId ? touchGuestRow({ ...row, isBuddy: false }) : row,
      ),
    }));
    showToast("Buddy removed");
  };

  const saveTask = (title: string, guestId: string) => {
    const isEdit = Boolean(editingTask);
    const buddyName =
      state.guests.find((row) => row.id === guestId)?.name?.trim() || "Buddy";
    const item = createActivityItem({
      type: "task.assigned",
      title: isEdit ? "Task updated" : "New task for you",
      body: title.trim(),
      href: "/buddies",
      audience: "buddy",
      targetGuestId: guestId,
    });

    setState((prev) => {
      const withTasks = isEdit
        ? {
            ...prev,
            tasks: prev.tasks.map((row) =>
              row.id === editingTask!.id ? touchBuddyTask(row, { title, guestId }) : row,
            ),
          }
        : { ...prev, tasks: [createBuddyTask(title, guestId), ...prev.tasks] };
      return appendActivity(withTasks, item);
    });
    showToast(isEdit ? "Task saved" : "Task added");
    setEditingTask(null);
    void dispatchPushNotify({
      eventId: membership?.eventId,
      eventCode: syncCode,
      type: item.type,
      title: item.title,
      body: `${buddyName}: ${title.trim()}`,
      href: "/command-center",
      audience: "buddy",
      targetGuestId: guestId,
    });
  };

  const toggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((row) =>
        row.id === taskId ? touchBuddyTask(row, { done: !row.done }) : row,
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((row) => row.id !== taskId),
    }));
    showToast("Task deleted");
  };

  const openNewTask = () => {
    if (buddies.length === 0) {
      setAddOpen(true);
      showToast("Add a buddy first");
      return;
    }
    setEditingTask(null);
    setTaskOpen(true);
  };

  const helperWord = buddies.length === 1 ? "buddy" : "buddies";
  const progressLine =
    tasks.length === 0
      ? `${buddies.length} ${helperWord}`
      : `${progress.done} of ${progress.total} done · ${buddies.length} ${helperWord}`;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-clip px-5 pt-3 pb-[calc(8.8rem+env(safe-area-inset-bottom))] people-stage-touch mx-auto w-full max-w-lg">
        <header className="buddies-head">
          <h1 className="buddies-title">Buddies</h1>
          <p className="buddies-progress">
            {buddies.length === 0 ? "Pick people from the guest list." : progressLine}
          </p>
        </header>

        {buddies.length === 0 ? (
          <button type="button" className="buddies-invite" onClick={() => setAddOpen(true)}>
            <Icon name="add" className="text-[22px]" />
            <span className="buddies-invite__copy">
              <span className="buddies-invite__title">Pick someone from the guest list</span>
              <span className="buddies-invite__meta">They become your crew for the event.</span>
            </span>
          </button>
        ) : (
          <div className="buddies-crew">
            {buddies.map((buddy, index) => (
              <BuddyHelperCard
                key={buddy.id}
                buddy={buddy}
                tasks={tasks}
                tone={index}
                onOpen={() => setEditBuddyId(buddy.id)}
              />
            ))}
            <button type="button" className="buddies-person is-add" onClick={() => setAddOpen(true)}>
              <span className="buddies-person__face is-add-face">
                <Icon name="add" className="text-[18px]" />
              </span>
              <span className="buddies-person__name">Add buddy</span>
              <span className="buddies-person__meta">From guests</span>
            </button>
          </div>
        )}

        {buddies.length > 0 ? (
          <>
            <p className="buddies-kicker">Tasks</p>
            {tasks.length === 0 ? (
              <p className="buddies-empty">Nothing assigned yet.</p>
            ) : (
              <div className="buddies-task-list">
                {tasks.map((task) => (
                  <BuddyTaskCard
                    key={task.id}
                    task={task}
                    buddy={state.guests.find((row) => row.id === task.guestId)}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => {
                      setEditingTask(task);
                      setTaskOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
            <button type="button" onClick={openNewTask} className="buddies-cta">
              Add task
            </button>
          </>
        ) : null}
      </div>

      <AddBuddySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        guests={state.guests}
        onAdd={addHelper}
      />
      <CreateBuddyTaskSheet
        open={taskOpen}
        onClose={() => {
          setTaskOpen(false);
          setEditingTask(null);
        }}
        buddies={buddies}
        editing={editingTask}
        onSave={saveTask}
        onDelete={
          editingTask
            ? () => {
                deleteTask(editingTask.id);
                setEditingTask(null);
              }
            : undefined
        }
      />
      <BuddyEditSheet
        open={Boolean(editingBuddy)}
        onClose={() => setEditBuddyId(null)}
        buddy={editingBuddy}
        tasks={tasks}
        onToggleTask={toggleTask}
        onRemove={() => {
          if (!editingBuddy) return;
          setPendingRemove(editingBuddy.id);
        }}
      />
      {pendingRemove ? (
        <ConfirmDangerDialog
          title="Remove this buddy?"
          message="They stay on the guest list. Tasks already assigned to them stay in the list."
          confirmLabel="Remove buddy"
          cancelLabel="Keep"
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            removeHelper(pendingRemove);
            setPendingRemove(null);
            setEditBuddyId(null);
          }}
        />
      ) : null}
    </div>
  );
}
