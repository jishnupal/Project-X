import { useEffect, useState } from "react";
import type { BuddyTask, GuestRow } from "../../domain/types";
import { guestContactInitials, guestContactTone } from "../guest/guestContactLook";
import { MobileSheet } from "../ui/MobileSheet";
import { cn } from "../../design-system/cn";

type CreateBuddyTaskSheetProps = {
  open: boolean;
  onClose: () => void;
  buddies: GuestRow[];
  editing?: BuddyTask | null;
  onSave: (title: string, guestId: string) => void;
  onDelete?: () => void;
};

export function CreateBuddyTaskSheet({
  open,
  onClose,
  buddies,
  editing,
  onSave,
  onDelete,
}: CreateBuddyTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [guestId, setGuestId] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title || "");
    setGuestId(editing?.guestId || buddies[0]?.id || "");
  }, [open, editing, buddies]);

  const canSave = title.trim().length > 0 && Boolean(guestId);

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit task" : "New task"}
      height="content"
    >
      <div className="px-4 pb-6 space-y-4">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a6f62]">
            Task
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should they do?"
            className="mt-2 h-12 w-full rounded-2xl bg-[#faf7f2] px-3.5 text-[15px] font-semibold text-[#1a100c] outline-none focus-visible:ring-2 focus-visible:ring-[#8a5548]/40"
          />
        </label>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a6f62]">
            Assign to
          </p>
          {buddies.length === 0 ? (
            <p className="mt-2 text-[13px] font-semibold text-[#7a6f62]">
              Add a buddy first, then assign the task.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {buddies.map((row) => {
                const on = row.id === guestId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setGuestId(row.id)}
                    className={cn(
                      "h-9 pl-1 pr-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-bold",
                      on ? "bg-[#1a100c] text-white" : "bg-[#faf7f2] text-[#1a100c]",
                    )}
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full grid place-items-center text-[9px] font-extrabold",
                        on ? "bg-white/15 text-white" : guestContactTone(row.id),
                      )}
                    >
                      {guestContactInitials(row.name)}
                    </span>
                    <span className="max-w-[9rem] truncate">{row.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            onSave(title.trim(), guestId);
            onClose();
          }}
          className="h-11 w-full rounded-full bg-[#1a100c] text-white text-[13px] font-bold disabled:opacity-40"
        >
          {editing ? "Save task" : "Add task"}
        </button>

        {editing && onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="h-11 w-full rounded-full text-[13px] font-bold text-[#b91c1c]"
          >
            Delete task
          </button>
        ) : null}
      </div>
    </MobileSheet>
  );
}
