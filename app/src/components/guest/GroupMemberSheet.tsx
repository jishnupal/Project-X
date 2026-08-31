import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";
import { groupPeopleCount, guestsInGroup } from "../../domain/guest";
import type { GuestGroup, GuestRow } from "../../domain/types";

type GroupMemberSheetProps = {
  open: boolean;
  group: GuestGroup | null;
  guests: GuestRow[];
  onClose: () => void;
  onEdit: () => void;
  onRename?: (id: string, name: string) => void;
  /** Same as tapping a guest row — opens guest edit sheet */
  onOpenGuest: (guestId: string) => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function avatarTone(seed: string): string {
  const tones = [
    "bg-[#f3e0e4] text-primary",
    "bg-[#f5edd8] text-[#8a6a12]",
    "bg-[#e8efe8] text-[#2f5d3a]",
    "bg-[#e8eaf4] text-[#3a4580]",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 97;
  return tones[hash % tones.length];
}

/** Cream group sheet — contact-tile members (avatar + name), maroon on actions only. */
export function GroupMemberSheet({
  open,
  group,
  guests,
  onClose,
  onEdit,
  onRename,
  onOpenGuest,
}: GroupMemberSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!open) {
      setRenaming(false);
      return;
    }
    if (group) setDraftName(group.name);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])")
        ?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, group]);

  if (!open || !group) return null;

  const members = guestsInGroup(guests, group.id);
  const people = groupPeopleCount(guests, group.id);

  const commitRename = () => {
    const next = draftName.trim();
    if (next && onRename && next !== group.name) onRename(group.id, next);
    else setDraftName(group.name);
    setRenaming(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/40 group-sheet-backdrop lg:hidden"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          "group-sheet-panel w-full max-w-[420px]",
          "h-[min(68dvh,560px)] max-h-[68dvh]",
          "rounded-t-[24px] overflow-hidden flex flex-col",
          "bg-[#fff8f5] shadow-[0_-18px_48px_-16px_rgba(87,0,19,0.35)]",
          "border border-[rgba(128,0,32,0.14)] border-b-0",
          "pb-[env(safe-area-inset-bottom)]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[rgba(128,0,32,0.18)]" />
        </div>

        <header className="shrink-0 px-4 pb-3 flex items-start gap-2.5 border-b border-[rgba(128,0,32,0.08)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-[rgba(128,0,32,0.14)] bg-white text-primary flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">Group</p>
            {renaming && onRename ? (
              <input
                id={titleId}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  }
                }}
                autoFocus
                autoComplete="off"
                aria-label="Group name"
                className="mt-0.5 w-full bg-transparent font-headline-md text-primary text-[22px] leading-none outline-none border-b border-primary/30 focus:border-primary pb-0.5"
              />
            ) : (
              <h2
                id={titleId}
                className="font-headline-md text-primary text-[22px] leading-none truncate"
              >
                {group.name}
              </h2>
            )}
            <p className="text-[12px] text-secondary tabular-nums mt-1">
              {members.length} {members.length === 1 ? "family" : "families"} · {people} people
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onRename ? (
              <button
                type="button"
                onClick={() => {
                  if (renaming) {
                    commitRename();
                    return;
                  }
                  setDraftName(group.name);
                  setRenaming(true);
                }}
                className={cn(
                  "h-9 px-3 rounded-full text-[11px] font-button border active:scale-95",
                  renaming
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-white text-primary border-[rgba(128,0,32,0.14)]",
                )}
              >
                {renaming ? "Save" : "Rename"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onEdit}
              className="h-9 px-3.5 rounded-full bg-primary text-on-primary text-[11px] font-button active:scale-95"
            >
              Edit
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
          {members.length ? (
            <div className="grid grid-cols-3 gap-2.5">
              {members.map((row) => {
                const label = row.name || "Guest not set";
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onOpenGuest(row.id)}
                    aria-label={`Open ${label}`}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl px-2 pt-3 pb-2.5 min-h-[7.25rem]",
                      "bg-white border border-[rgba(128,0,32,0.1)]",
                      "shadow-[0_8px_20px_-14px_rgba(128,0,32,0.22)]",
                      "active:scale-[0.97] transition-transform",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center shrink-0",
                        "font-headline-md text-[16px] tracking-wide",
                        "ring-2 ring-white shadow-sm",
                        avatarTone(row.id + label),
                      )}
                      aria-hidden
                    >
                      {initials(label)}
                    </span>
                    <span className="w-full text-center font-medium text-[12px] leading-tight text-primary line-clamp-2">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="font-headline-md text-primary text-[18px]">No families yet</p>
              <p className="text-[13px] text-secondary mt-1">Tap Edit to assign guests to this group.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
