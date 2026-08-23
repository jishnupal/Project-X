import { useMemo, useState } from "react";
import {
  GROUP_CARD_NAME_SLOTS,
  GROUP_MEMBER_BOARD_MAX,
  groupBoardLayout,
  groupMemberBoardLayout,
  groupPeopleCount,
  guestsInGroup,
  MAX_GUEST_GROUPS,
  parseCount,
} from "../../domain/guest";
import type { GuestGroup, GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GuestGroupColumnProps = {
  groups: GuestGroup[];
  guests: GuestRow[];
  editId: string;
  creating: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onCloseEdit: () => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAssignGuest: (guestId: string, groupId: string) => void;
};

function GroupNameRows({ members, compact }: { members: GuestRow[]; compact?: boolean }) {
  const visible = members.slice(0, GROUP_CARD_NAME_SLOTS);
  const extra = Math.max(0, members.length - GROUP_CARD_NAME_SLOTS);
  const slots = Array.from({ length: GROUP_CARD_NAME_SLOTS }, (_, index) => visible[index] ?? null);

  return (
    <section className="min-w-0 min-h-0 flex flex-col">
      <p
        className={cn(
          "font-label-caps tracking-[0.18em] text-white/45 mb-2",
          compact ? "text-[8px]" : "text-[10px]",
        )}
      >
        Families
      </p>
      <ul className={compact ? "space-y-[4px]" : "space-y-[6px]"}>
        {slots.map((row, index) => (
          <li
            key={row?.id ?? `slot-${index}`}
            className={cn(
              "leading-[1.4] font-medium tracking-[0.01em] truncate",
              compact ? "text-[12px]" : "text-[13px]",
              row ? "text-white/[0.92]" : "text-white/18",
            )}
          >
            {row ? row.name || "Guest not set" : "—"}
          </li>
        ))}
        <li
          className={cn(
            "pt-0.5 font-label-caps tracking-[0.14em]",
            compact ? "text-[8px]" : "text-[10px]",
            extra > 0 ? "text-white/55" : "text-white/18",
          )}
        >
          {extra > 0 ? `+${extra} more` : "+ more"}
        </li>
      </ul>
    </section>
  );
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
  onAssignGuest: (guestId: string, groupId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const members = guestsInGroup(guests, group.id);
  const people = groupPeopleCount(guests, group.id);
  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...guests]
      .filter((row) => row.groupId !== group.id)
      .filter((row) => !q || (row.name || "").toLowerCase().includes(q))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }, [guests, query, group.id]);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal
      aria-labelledby="group-open-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] h-[min(72vh,560px)] rounded-2xl bg-surface shadow-2xl border border-[rgba(128,0,32,0.18)] overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hero-meal-card hero-group-card shrink-0 rounded-none px-4 py-3.5">
          <div className="relative z-[3] flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-label-caps text-[9px] tracking-[0.16em] text-[#f3d58a]/80">
                Assign families
              </p>
              <input
                id="group-open-title"
                value={group.name}
                onChange={(e) => onRename(group.id, e.target.value)}
                className="w-full bg-transparent font-headline-md text-[18px] text-white outline-none"
              />
              <p className="text-[11px] text-white/55 tabular-nums mt-0.5">
                {members.length} families · {people} people
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-black/20 text-white/80 hover:text-white flex items-center justify-center"
              aria-label="Close"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 min-h-0 flex-1 divide-x divide-[rgba(128,0,32,0.12)]">
          <section className="min-h-0 flex flex-col bg-[rgba(128,0,32,0.03)]">
            <p className="shrink-0 px-3 py-2 font-label-caps text-[9px] tracking-[0.14em] text-primary">
              In group
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
              {members.length ? (
                <ul>
                  {members.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onAssignGuest(row.id, "")}
                        className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[rgba(128,0,32,0.06)]"
                      >
                        <span className="min-w-0 flex-1 text-[13px] text-primary truncate">
                          {row.name || "Guest not set"}
                        </span>
                        <span className="text-[10px] tabular-nums text-[#a67c00] shrink-0">
                          {parseCount(row.count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-6 text-[12px] text-on-surface-variant">Empty</p>
              )}
            </div>
          </section>

          <section className="min-h-0 flex flex-col">
            <div className="shrink-0 px-2 pt-2 pb-1">
              <p className="px-1 mb-1.5 font-label-caps text-[9px] tracking-[0.14em] text-[#a67c00]">
                Add
              </p>
              <div className="relative">
                <Icon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 text-secondary text-[16px]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  autoComplete="off"
                  className="w-full h-8 pl-8 pr-2 rounded-lg border border-[rgba(204,167,48,0.45)] bg-surface text-[12px] outline-none focus:border-primary/40"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
              {directory.length ? (
                <ul>
                  {directory.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onAssignGuest(row.id, group.id)}
                        className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[rgba(204,167,48,0.1)]"
                      >
                        <span className="min-w-0 flex-1 text-[13px] text-on-surface truncate">
                          {row.name || "Guest not set"}
                        </span>
                        <span className="text-[10px] tabular-nums text-on-surface-variant shrink-0">
                          {parseCount(row.count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-6 text-[12px] text-on-surface-variant">
                  {query.trim() ? "No match" : "All in"}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  members,
  people,
  compact,
  onOpen,
  onDelete,
}: {
  group: GuestGroup;
  members: GuestRow[];
  people: number;
  compact: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="hero-meal-card hero-group-card rounded-[24px] overflow-hidden min-h-0 h-full flex flex-col relative">
      <div className={cn("shrink-0", compact ? "px-3.5 pt-3.5 pb-2" : "px-5 pt-5 pb-3")}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-bold tracking-[0.16em] uppercase border border-white/15 bg-white/10 text-white">
                Group
              </span>
              <span className="text-[11px] text-white/40 tabular-nums">
                {members.length} · {people} people
              </span>
            </div>
            <p
              className={cn(
                "font-headline-xl text-white leading-none tracking-[-0.02em] truncate",
                compact ? "text-[20px]" : "text-[26px]",
              )}
            >
              {group.name}
            </p>
            <p className="mt-1.5 text-[12px] text-white/45 flex items-center gap-1.5">
              <Icon name="groups" className="text-[15px] text-white/35" />
              All functions
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${group.name}`}
            onClick={onDelete}
            className="h-7 w-7 rounded-full bg-black/20 text-white/80 hover:text-white hover:bg-black/35 flex items-center justify-center shrink-0"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn("flex-1 min-h-0 text-left", compact ? "px-3.5 pb-2" : "px-5 pb-3")}
      >
        <GroupNameRows members={members} compact={compact} />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex items-center justify-between border-t border-white/10 bg-black/[0.12] shrink-0 text-left",
          compact ? "px-3.5 py-2.5" : "px-5 py-3",
        )}
      >
        <span className="text-[10px] font-label-caps tracking-[0.18em] uppercase text-white/40">Families</span>
        <span className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/70">Open</span>
      </button>
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
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[9px] font-bold tracking-[0.16em] uppercase border border-white/15 bg-white/10 text-white">
                Group
              </span>
            </div>
            <input
              value={draftName}
              onChange={(e) => onDraftName(e.target.value)}
              placeholder="Name this party"
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent font-headline-xl text-[26px] text-white leading-none outline-none placeholder:text-white/30"
            />
            <p className="mt-1.5 text-[12px] text-white/45 flex items-center gap-1.5">
              <Icon name="groups" className="text-[15px] text-white/35" />
              All functions
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
      </div>
      <div className="flex-1 min-h-0 px-5 pb-3">
        <GroupNameRows members={[]} />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/[0.12] shrink-0">
        <button type="button" onClick={onCancel} className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white/40">
          Cancel
        </button>
        <button type="submit" className="text-[10px] font-label-caps tracking-[0.16em] uppercase text-white">
          Create
        </button>
      </div>
    </form>
  );
}

function AddGroupChip({
  creating,
  draftName,
  onDraftName,
  onStartCreate,
  onCancelCreate,
  onCreate,
}: {
  creating: boolean;
  draftName: string;
  onDraftName: (value: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: (name: string) => void;
}) {
  if (creating) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const name = draftName.trim();
          if (!name) return;
          onCreate(name);
        }}
        className="mini-meal-card w-full shrink-0 rounded-2xl p-3"
      >
        <p className="relative z-[1] font-label-caps text-[9px] text-secondary">New group</p>
        <input
          value={draftName}
          onChange={(e) => onDraftName(e.target.value)}
          placeholder="Name this party"
          autoComplete="off"
          autoFocus
          className="relative z-[1] mt-2 w-full h-9 px-2 rounded-lg border border-outline-variant text-sm outline-none bg-white"
        />
        <div className="relative z-[1] mt-2 flex items-center justify-between">
          <button type="button" onClick={onCancelCreate} className="text-[11px] text-secondary">
            Cancel
          </button>
          <button type="submit" className="text-[11px] text-primary font-semibold">
            Create
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartCreate}
      aria-label="Add group"
      className="mini-meal-card h-14 w-full shrink-0 rounded-2xl flex items-center justify-center gap-1.5 text-secondary hover:text-primary"
    >
      <Icon name="add" className="relative z-[1] text-[20px]" />
      <span className="relative z-[1] text-[9px] font-label-caps">Add group</span>
    </button>
  );
}

export function GroupMemberBoard({
  group,
  guests,
  onBack,
  onEdit,
}: {
  group: GuestGroup;
  guests: GuestRow[];
  onBack: () => void;
  onEdit: () => void;
}) {
  const members = guestsInGroup(guests, group.id);
  const people = groupPeopleCount(guests, group.id);
  const visible = members.slice(0, GROUP_MEMBER_BOARD_MAX);
  const extra = Math.max(0, members.length - GROUP_MEMBER_BOARD_MAX);
  const layout = groupMemberBoardLayout(visible.length || 4);
  const compact = visible.length > 12;
  const dense = visible.length > 24;
  const slots =
    visible.length > 0
      ? visible
      : Array.from({ length: 4 }, () => null);

  return (
    <article className="hero-meal-card hero-group-card h-full min-h-0 rounded-[24px] overflow-hidden flex flex-col">
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
          onClick={onEdit}
          className="h-8 px-3 rounded-full border border-[rgba(255,215,140,0.4)] bg-black/20 text-[10px] font-label-caps tracking-[0.14em] uppercase text-[#f3d58a]"
        >
          Edit
        </button>
      </div>
      <div
        className="relative z-[3] flex-1 min-h-0 p-3 pt-0 grid"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
          gap: layout.gapPx,
        }}
      >
        {slots.map((row, index) => (
          <div key={row?.id ?? `empty-${index}`} className="group-member-tile flex flex-col justify-end p-2.5">
            {row ? (
              <>
                <p
                  className={cn(
                    "font-medium leading-tight truncate",
                    dense ? "text-[11px]" : compact ? "text-[12px]" : "text-[14px]",
                  )}
                >
                  {row.name || "Guest not set"}
                </p>
                <p className={cn("text-white/55 tabular-nums mt-0.5", dense ? "text-[9px]" : "text-[10px]")}>
                  {parseCount(row.count)} people
                </p>
              </>
            ) : (
              <p className="text-[11px] text-white/25">Empty</p>
            )}
          </div>
        ))}
        {extra > 0 ? (
          <div className="group-member-tile flex items-center justify-center">
            <p className="text-[12px] font-label-caps tracking-[0.12em] text-[#f3d58a]">+{extra} more</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function GuestGroupColumn({
  groups,
  guests,
  editId,
  creating,
  onOpen,
  onEdit,
  onCloseEdit,
  onStartCreate,
  onCancelCreate,
  onCreate,
  onRename,
  onDelete,
  onAssignGuest,
}: GuestGroupColumnProps) {
  const [draftName, setDraftName] = useState("");
  const count = groups.length;
  const canAdd = count < MAX_GUEST_GROUPS;
  const layout = groupBoardLayout(count || 1);
  const compact = count >= 3;
  const editGroup = groups.find((group) => group.id === editId) || null;
  const add = canAdd || creating ? (
    <AddGroupChip
      creating={creating}
      draftName={draftName}
      onDraftName={setDraftName}
      onStartCreate={onStartCreate}
      onCancelCreate={() => {
        setDraftName("");
        onCancelCreate();
      }}
      onCreate={(name) => {
        onCreate(name);
        setDraftName("");
      }}
    />
  ) : null;

  const cards = groups.map((group) => (
    <GroupCard
      key={group.id}
      group={group}
      members={guestsInGroup(guests, group.id)}
      people={groupPeopleCount(guests, group.id)}
      compact={compact}
      onOpen={() => onOpen(group.id)}
      onDelete={() => onDelete(group.id)}
    />
  ));

  const panel = editGroup ? (
    <GroupOpenPanel
      group={editGroup}
      guests={guests}
      onClose={onCloseEdit}
      onRename={onRename}
      onAssignGuest={onAssignGuest}
    />
  ) : null;

  if (!count && creating) {
    return (
      <>
        <div className="h-full min-h-0">
          <CreateGroupHero
            draftName={draftName}
            onDraftName={setDraftName}
            onCancel={() => {
              setDraftName("");
              onCancelCreate();
            }}
            onCreate={(name) => {
              onCreate(name);
              setDraftName("");
            }}
          />
        </div>
        {panel}
      </>
    );
  }

  if (count === 1) {
    return (
      <>
        <div className="h-full min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0">{cards}</div>
          {add}
        </div>
        {panel}
      </>
    );
  }

  return (
    <>
      <div className="h-full min-h-0 flex flex-col gap-3">
        <div
          className="flex-1 min-h-0 grid"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
            gap: layout.gapPx,
          }}
        >
          {cards}
        </div>
        {add}
      </div>
      {panel}
    </>
  );
}
