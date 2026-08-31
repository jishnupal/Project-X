import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatGroupMemberLabel,
  groupPanelGrid,
  groupPeopleCount,
  guestsInGroup,
  parseCount,
} from "../../domain/guest";
import type { GuestGroup, GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { ConfirmDangerDialog } from "../ui/ConfirmDangerDialog";
import { GroupHeadcountConfirm } from "./GroupHeadcountConfirm";

type GuestGroupColumnProps = {
  groups: GuestGroup[];
  guests: GuestRow[];
  editId: string;
  activeGroupId?: string;
  readOnly?: boolean;
  onOpen: (id: string) => void;
  onCloseEdit: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAssignGuest: (guestId: string, groupId: string, people?: number) => void;
};

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function memberAvatarTone(seed: string): string {
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

function GroupOpenPanel({
  group,
  guests,
  onClose,
  onRename,
  onAssignGuest,
}: {
  group: GuestGroup;
  guests: GuestRow[];
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onAssignGuest: (guestId: string, groupId: string, people?: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [pendingAdd, setPendingAdd] = useState<GuestRow | null>(null);
  const [mobileTab, setMobileTab] = useState<"members" | "add">("members");
  const members = guestsInGroup(guests, group.id);
  const people = groupPeopleCount(guests, group.id);
  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...guests]
      .filter((row) => row.groupId !== group.id)
      .filter((row) => !q || (row.name || "").toLowerCase().includes(q))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }, [guests, query, group.id]);

  const requestAdd = (row: GuestRow) => {
    if (parseCount(row.count) <= 1) {
      onAssignGuest(row.id, group.id, 1);
      return;
    }
    setPendingAdd(row);
  };

  const membersList = (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {members.length ? (
        <ul className="divide-y divide-[rgba(128,0,32,0.07)]">
          {members.map((row) => {
            const label = row.name || "Guest not set";
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onAssignGuest(row.id, "")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgba(128,0,32,0.04)]"
                >
                  <span
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-headline-md",
                      memberAvatarTone(row.id + label),
                    )}
                    aria-hidden
                  >
                    {memberInitials(label)}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] text-primary truncate">{label}</span>
                  <span className="text-[10px] tabular-nums text-secondary shrink-0">
                    {formatGroupMemberLabel(row)}
                  </span>
                  <span className="text-[10px] text-primary/50 shrink-0">Remove</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-10 text-center text-[13px] text-secondary">No families in this group yet</p>
      )}
    </div>
  );

  const addList = (
    <div className="min-h-0 flex flex-col flex-1">
      <div className="shrink-0 px-3 pt-2 pb-2">
        <div className="relative">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests to add"
            autoComplete="off"
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[rgba(128,0,32,0.12)] bg-white text-[13px] outline-none focus:border-primary/35"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {directory.length ? (
          <ul className="divide-y divide-[rgba(128,0,32,0.07)]">
            {directory.map((row) => {
              const label = row.name || "Guest not set";
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => requestAdd(row)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgba(204,167,48,0.08)]"
                  >
                    <span
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-headline-md",
                        memberAvatarTone(row.id + label),
                      )}
                      aria-hidden
                    >
                      {memberInitials(label)}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] text-on-surface truncate">{label}</span>
                    <span className="text-[10px] tabular-nums text-secondary shrink-0">
                      {parseCount(row.count)}
                    </span>
                    <span className="h-7 px-2.5 rounded-full bg-primary text-on-primary text-[10px] font-button flex items-center">
                      Add
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-[13px] text-secondary">
            {query.trim() ? "No match" : "Everyone is already in this group"}
          </p>
        )}
      </div>
    </div>
  );

  /* Portal so Edit still works when the group strip is `hidden` on mobile. */
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 group-sheet-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="group-open-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "group-sheet-panel w-full max-w-[560px]",
          "h-[min(72dvh,580px)] sm:h-[min(72vh,560px)]",
          "rounded-t-[24px] sm:rounded-2xl overflow-hidden flex flex-col",
          "bg-[#fff8f5] shadow-[0_-18px_48px_-16px_rgba(87,0,19,0.3)]",
          "border border-[rgba(128,0,32,0.14)] sm:border-b",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sm:hidden shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-[rgba(128,0,32,0.18)]" />
        </div>

        <header className="shrink-0 px-4 pb-3 flex items-start gap-3 border-b border-[rgba(128,0,32,0.08)]">
          <div className="min-w-0 flex-1">
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">Edit group</p>
            <input
              id="group-open-title"
              value={group.name}
              onChange={(e) => onRename(group.id, e.target.value)}
              className="w-full bg-transparent font-headline-md text-[20px] text-primary outline-none"
            />
            <p className="text-[12px] text-secondary tabular-nums mt-0.5">
              {members.length} families · {people} people
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-full bg-primary text-on-primary text-[11px] font-button shrink-0"
          >
            Done
          </button>
        </header>

        {/* Mobile: tab so Add never starves the member list */}
        <div className="sm:hidden shrink-0 px-3 pt-2">
          <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-[10px] bg-[rgba(128,0,32,0.07)]" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "members"}
              onClick={() => setMobileTab("members")}
              className={cn(
                "min-h-9 rounded-lg text-[12px] font-button",
                mobileTab === "members" ? "bg-primary text-on-primary" : "text-secondary",
              )}
            >
              In group ({members.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "add"}
              onClick={() => setMobileTab("add")}
              className={cn(
                "min-h-9 rounded-lg text-[12px] font-button",
                mobileTab === "add" ? "bg-primary text-on-primary" : "text-secondary",
              )}
            >
              Add
            </button>
          </div>
        </div>

        <div className="sm:hidden flex-1 min-h-0 flex flex-col mt-1">
          {mobileTab === "members" ? membersList : addList}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 min-h-0 flex-1 divide-x divide-[rgba(128,0,32,0.1)]">
          <section className="min-h-0 flex flex-col">
            <p className="shrink-0 px-3 py-2 font-label-caps text-[9px] tracking-[0.14em] text-secondary">
              In group
            </p>
            {membersList}
          </section>
          <section className="min-h-0 flex flex-col">
            <p className="shrink-0 px-3 pt-2 font-label-caps text-[9px] tracking-[0.14em] text-secondary">
              Add
            </p>
            {addList}
          </section>
        </div>
      </div>

      {pendingAdd ? (
        <GroupHeadcountConfirm
          row={pendingAdd}
          groupName={group.name}
          onCancel={() => setPendingAdd(null)}
          onConfirm={(headcount) => {
            onAssignGuest(pendingAdd.id, group.id, headcount);
            setPendingAdd(null);
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
}

export function GuestGroupTile({
  group,
  members,
  people,
  compact,
  active,
  readOnly,
  groupCount,
  onOpen,
  onRequestDelete,
}: {
  group: GuestGroup;
  members: GuestRow[];
  people: number;
  compact: boolean;
  active?: boolean;
  readOnly?: boolean;
  groupCount: number;
  onOpen: () => void;
  onRequestDelete: () => void;
}) {
  const solo = groupCount === 1;
  const preview = members.slice(0, solo ? 5 : 4);
  const extra = Math.max(0, members.length - preview.length);

  return (
    <article
      data-testid="group-tile"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "hero-meal-card hero-group-card rounded-[24px] overflow-hidden flex flex-col relative min-h-0 h-full",
        "cursor-pointer select-none transition-[transform,filter,box-shadow] duration-200 ease-out",
        "hover:brightness-[1.03] active:scale-[0.985]",
        active && "ring-2 ring-[rgba(243,213,138,0.65)] brightness-[1.04]",
      )}
    >
      <div
        className={cn(
          "relative z-[3] flex flex-col flex-1 min-h-0",
          compact ? "px-3.5 pt-3.5 pb-3" : solo ? "px-5 pt-6 pb-5" : "px-5 pt-5 pb-4",
          solo && "justify-between",
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-headline-xl text-white leading-[1.05] tracking-[-0.02em]",
                compact ? "text-[20px]" : solo ? "text-[30px]" : "text-[26px]",
                compact ? "line-clamp-2" : "truncate",
              )}
            >
              {group.name}
            </p>
            <p
              className={cn(
                "mt-2.5 font-label-caps tracking-[0.14em] uppercase text-white/45 tabular-nums",
                compact ? "text-[9px]" : "text-[11px]",
              )}
            >
              {members.length} {members.length === 1 ? "family" : "families"}
              <span className="text-white/25 mx-1.5">·</span>
              {people} people
            </p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              aria-label={`Remove ${group.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onRequestDelete();
              }}
              className="pointer-events-auto h-7 w-7 rounded-full bg-black/20 text-white/80 hover:text-white hover:bg-black/35 flex items-center justify-center shrink-0 transition-colors"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          ) : null}
        </div>

        <div className={cn("flex items-end justify-between gap-2", compact ? "pt-3 mt-auto" : "pt-6 mt-auto")}>
          <div className="flex items-center pl-0.5" aria-hidden>
            {preview.length ? (
              preview.map((row, index) => {
                const label = row.name || "?";
                return (
                  <span
                    key={row.id}
                    className={cn(
                      "rounded-full flex items-center justify-center font-headline-md ring-2 ring-[rgba(87,0,19,0.55)]",
                      compact ? "h-7 w-7 text-[9px] -ml-1.5 first:ml-0" : "h-9 w-9 text-[11px] -ml-2 first:ml-0",
                      memberAvatarTone(row.id + label),
                    )}
                    style={{ zIndex: preview.length - index }}
                  >
                    {memberInitials(label)}
                  </span>
                );
              })
            ) : (
              <span className="text-[11px] text-white/30">Tap to assign</span>
            )}
            {extra > 0 ? (
              <span
                className={cn(
                  "rounded-full bg-black/35 text-white/80 font-medium ring-2 ring-[rgba(87,0,19,0.55)] flex items-center justify-center tabular-nums",
                  compact ? "h-7 w-7 text-[9px] -ml-1.5" : "h-9 w-9 text-[10px] -ml-2",
                )}
              >
                +{extra}
              </span>
            ) : null}
          </div>
          <Icon name="north_east" className={cn("text-white/50 shrink-0", compact ? "text-[16px]" : "text-[18px]")} />
        </div>
      </div>
    </article>
  );
}

function CreateGroupHero({
  draftName,
  onDraftName,
  onCancel,
  onCreate,
}: {
  draftName: string;
  onDraftName: (value: string) => void;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const name = draftName.trim();
        if (!name) return;
        onCreate(name);
      }}
      className="hero-meal-card hero-group-card rounded-[24px] overflow-hidden min-h-0 h-full flex flex-col"
    >
      <div className="relative z-[3] flex flex-col flex-1 min-h-0 px-5 pt-5 pb-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <input
              value={draftName}
              onChange={(e) => onDraftName(e.target.value)}
              placeholder="Name this party"
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent font-headline-xl text-[28px] text-white leading-[1.05] outline-none placeholder:text-white/30"
            />
            <p className="mt-2 font-label-caps text-[10px] tracking-[0.14em] uppercase text-white/40">
              New group
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="h-7 w-7 rounded-full bg-black/20 text-white/80 hover:text-white hover:bg-black/35 flex items-center justify-center shrink-0"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
        <div className="mt-auto pt-6 flex items-center justify-between">
          <button type="button" onClick={onCancel} className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/40">
            Cancel
          </button>
          <button type="submit" className="h-9 px-4 rounded-full bg-white/15 text-[10px] font-label-caps tracking-[0.16em] uppercase text-white border border-white/20">
            Create
          </button>
        </div>
      </div>
    </form>
  );
}

export function GroupMemberBoard({
  group,
  guests,
  onBack,
  onEdit,
  flush = false,
}: {
  group: GuestGroup;
  guests: GuestRow[];
  onBack: () => void;
  onEdit: () => void;
  /** Fill a sheet without outer radius / card chrome */
  flush?: boolean;
}) {
  const members = guestsInGroup(guests, group.id);
  const people = groupPeopleCount(guests, group.id);

  return (
    <article
      className={cn(
        "hero-meal-card hero-group-card h-full max-h-full min-h-0 overflow-hidden flex flex-col",
        flush ? "rounded-none" : "rounded-[24px]",
      )}
    >
      <div className="relative z-[3] shrink-0 px-4 pt-4 pb-3 flex items-start gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-8 w-8 rounded-full bg-black/20 text-white/80 hover:text-white flex items-center justify-center shrink-0"
          aria-label="Back to list"
        >
          <Icon name="arrow_back" className="text-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-label-caps text-[9px] tracking-[0.16em] text-white/50">Group</p>
          <p className="font-headline-xl text-white text-[22px] leading-none truncate">{group.name}</p>
          <p className="text-[11px] text-white/55 tabular-nums mt-1">
            {members.length} families · {people} people
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="relative z-10 h-9 px-3.5 rounded-full border border-[rgba(255,215,140,0.4)] bg-black/25 text-[10px] font-label-caps tracking-[0.14em] uppercase text-[#f3d58a] active:scale-95"
        >
          Edit
        </button>
      </div>
      <div className="relative z-[3] flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 pt-0">
        {members.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 auto-rows-[minmax(4.25rem,auto)] content-start">
            {members.map((row) => (
              <div key={row.id} className="group-member-tile flex flex-col justify-end p-2.5 min-h-[4.25rem] max-h-[5.5rem]">
                <p className="font-medium text-[12px] lg:text-[13px] leading-tight line-clamp-2">
                  {row.name || "Guest not set"}
                </p>
                <p className="text-[10px] text-white/55 tabular-nums mt-0.5 truncate">
                  {parseCount(row.groupCount) > 0 &&
                  parseCount(row.groupCount) < parseCount(row.count)
                    ? formatGroupMemberLabel(row)
                    : `${parseCount(row.count)} people`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="group-member-tile flex items-center justify-center min-h-[4.25rem] p-2"
              >
                <p className="text-[11px] text-white/25">Empty</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function CreateGroupModal({
  open,
  onCancel,
  onCreate,
}: {
  open: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [draftName, setDraftName] = useState("");

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45"
      role="dialog"
      aria-modal
      aria-labelledby="create-group-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] sm:rounded-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <CreateGroupHero
          draftName={draftName}
          onDraftName={setDraftName}
          onCancel={() => {
            setDraftName("");
            onCancel();
          }}
          onCreate={(name) => {
            onCreate(name);
            setDraftName("");
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

export function GuestGroupColumn({
  groups,
  guests,
  editId,
  activeGroupId = "",
  readOnly = false,
  onOpen,
  onCloseEdit,
  onRename,
  onDelete,
  onAssignGuest,
}: GuestGroupColumnProps) {
  const [pendingDelete, setPendingDelete] = useState<GuestGroup | null>(null);
  const count = groups.length;
  const panel = groupPanelGrid(count);
  const compact = count >= 3;
  const editGroup = groups.find((group) => group.id === editId) || null;

  const deleteDialog = pendingDelete ? (
    <ConfirmDangerDialog
      title={`Delete “${pendingDelete.name}”?`}
      message={
        guestsInGroup(guests, pendingDelete.id).length
          ? "Families in this group stay on your guest list. Only the group is removed."
          : "This group will be removed. You can create it again anytime."
      }
      confirmLabel="Delete group"
      cancelLabel="Keep group"
      onCancel={() => setPendingDelete(null)}
      onConfirm={() => {
        onDelete(pendingDelete.id);
        setPendingDelete(null);
      }}
    />
  ) : null;

  const cards = groups.map((group, index) => {
    const span = panel.spans[index] || {};
    return (
      <div
        key={group.id}
        className="min-h-0 min-w-0 h-full"
        style={{
          gridColumn: span.colSpan ? `span ${span.colSpan}` : undefined,
          gridRow: span.rowSpan ? `span ${span.rowSpan}` : undefined,
        }}
      >
        <GuestGroupTile
          group={group}
          members={guestsInGroup(guests, group.id)}
          people={groupPeopleCount(guests, group.id)}
          compact={compact}
          active={activeGroupId === group.id}
          readOnly={readOnly}
          groupCount={count}
          onOpen={() => onOpen(group.id)}
          onRequestDelete={() => setPendingDelete(group)}
        />
      </div>
    );
  });

  const editPanel = !readOnly && editGroup ? (
    <GroupOpenPanel
      group={editGroup}
      guests={guests}
      onClose={onCloseEdit}
      onRename={onRename}
      onAssignGuest={onAssignGuest}
    />
  ) : null;

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <div
          className={cn(
            "flex-1 min-h-0",
            panel.fillHeight ? "grid h-full" : "grid overflow-y-auto overscroll-contain auto-rows-[minmax(140px,auto)]",
          )}
          style={{
            gridTemplateColumns: `repeat(${panel.cols}, minmax(0, 1fr))`,
            gridTemplateRows: panel.fillHeight
              ? `repeat(${panel.rows}, minmax(0, 1fr))`
              : undefined,
            gap: panel.gapPx,
          }}
        >
          {cards}
        </div>
      </div>
      {editPanel}
      {deleteDialog}
    </>
  );
}
