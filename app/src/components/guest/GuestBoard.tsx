import {
  assignGuestToGroup,
  createGuestFromDraft,
  createGuestGroup,
  formatGuestPlan,
  guestBoardSplit,
  guestListColumnCount,
  guestsByFunctionDay,
  guestMatchesFilter,
  guestMetrics,
  isReceptionFilter,
  MAX_GUEST_GROUPS,
  removeGuestGroup,
  syncEventGuestCount,
  type GuestDraft,
} from "../../domain/guest";
import {
  canRemoveWeddingFunction,
  functionIds,
  removeWeddingFunction,
  resolveDayName,
  resolveFunctionDateLabel,
} from "../../domain/functions";
import type { GuestRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { DayPill } from "../menu/DayPill";
import { AddGuestModal } from "./AddGuestModal";
import { GuestGroupColumn, GroupMemberBoard } from "./GuestGroupCard";
import { GuestRowCard } from "./GuestRowCard";
import { GuestStatDial } from "./GuestStatDial";
import { useEffect, useMemo, useState } from "react";

export function GuestBoard() {
  const { state, setState, showToast } = useWeddingState();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDay, setActiveDay] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingGroupId, setViewingGroupId] = useState("");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [removingDayId, setRemovingDayId] = useState<number | null>(null);

  const groups = state.guestGroups || [];
  const dayIds = useMemo(() => functionIds(state), [state]);
  const receptionView = isReceptionFilter(activeDay);
  const viewingGroup = groups.find((group) => group.id === viewingGroupId) || null;
  const viewingGroupActive = Boolean(viewingGroup);

  useEffect(() => {
    if (viewingGroupId && !groups.some((group) => group.id === viewingGroupId)) {
      setViewingGroupId("");
    }
    if (editingGroupId && !groups.some((group) => group.id === editingGroupId)) {
      setEditingGroupId("");
    }
  }, [viewingGroupId, editingGroupId, groups]);

  const metrics = useMemo(
    () => guestMetrics(state.guests, activeDay || undefined),
    [state.guests, activeDay],
  );
  const invitePct =
    metrics.familyCount > 0
      ? Math.min(100, Math.round((metrics.inviteSentTotal / metrics.familyCount) * 100))
      : 0;

  const visibleGuests = useMemo(
    () =>
      [...state.guests]
        .filter((row) => guestMatchesFilter(row, searchTerm.trim(), activeDay, state))
        .sort((a, b) =>
          (a.name.trim() || "zzzz").localeCompare(b.name.trim() || "zzzz", undefined, {
            sensitivity: "base",
          }),
        ),
    [state, searchTerm, activeDay],
  );

  const creatingFirstGroup = creatingGroup && groups.length === 0;
  const split = guestBoardSplit(creatingFirstGroup ? 1 : groups.length);
  const listColumns = guestListColumnCount(creatingFirstGroup ? 1 : groups.length);
  const showGroupColumn = groups.length > 0 || creatingGroup;

  const updateGuests = (guests: GuestRow[]) => {
    setState((prev) => ({
      ...prev,
      guests,
      event: { ...prev.event, guests: syncEventGuestCount(guests) },
    }));
  };

  const handleAddGuest = (draft: GuestDraft) => {
    const row = createGuestFromDraft(draft);
    updateGuests([...state.guests, row]);
    setExpandedId(null);
    showToast("Guest added · keep going");
  };

  const handleCreateGroup = (name: string) => {
    if (groups.length >= MAX_GUEST_GROUPS) {
      showToast("Maximum 10 groups");
      return;
    }
    const group = createGuestGroup(name);
    setState((prev) => ({
      ...prev,
      guestGroups: [...(prev.guestGroups || []), group],
    }));
    setCreatingGroup(false);
    setViewingGroupId(group.id);
    setEditingGroupId(group.id);
    showToast("Group created");
  };

  const handleRenameGroup = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      guestGroups: (prev.guestGroups || []).map((group) =>
        group.id === id ? { ...group, name } : group,
      ),
    }));
  };

  const handleDeleteGroup = (id: string) => {
    setState((prev) => removeGuestGroup(prev, id));
    if (viewingGroupId === id) setViewingGroupId("");
    if (editingGroupId === id) setEditingGroupId("");
    showToast("Group removed");
  };

  const handleAssignGuest = (guestId: string, groupId: string) => {
    updateGuests(
      state.guests.map((row) => (row.id === guestId ? assignGuestToGroup(row, groupId) : row)),
    );
  };

  const copyGuestList = async () => {
    try {
      await navigator.clipboard.writeText(formatGuestPlan(state));
      showToast("Guest list copied");
    } catch {
      showToast("Could not copy guest list");
    }
  };

  const toggleDay = (day: number) => {
    const key = String(day);
    setActiveDay((current) => (current === key ? "" : key));
  };

  const handleDeleteDay = (dayId: number) => {
    const name = resolveDayName(state, dayId);
    setRemovingDayId(dayId);
    window.setTimeout(() => {
      setState((prev) => removeWeddingFunction(prev, dayId));
      setRemovingDayId(null);
      if (activeDay === String(dayId)) setActiveDay("");
      showToast(`${name} removed`);
    }, 320);
  };

  const renderPills = (compact: boolean) => (
    <>
      {dayIds.map((day) => (
        <DayPill
          key={day}
          isActive={activeDay === String(day)}
          name={resolveDayName(state, day)}
          dateLabel={resolveFunctionDateLabel(state, day) || `${guestsByFunctionDay(state.guests, day)}`}
          canDelete={canRemoveWeddingFunction(state, day)}
          isRemoving={removingDayId === day}
          compact={compact}
          onSelect={() => toggleDay(day)}
          onDelete={() => handleDeleteDay(day)}
        />
      ))}
    </>
  );

  const groupColumn = (
    <GuestGroupColumn
      groups={groups}
      guests={state.guests}
      editId={editingGroupId}
      creating={creatingGroup}
      onOpen={(id) => {
        setShowAddForm(false);
        setCreatingGroup(false);
        setViewingGroupId(id);
      }}
      onEdit={(id) => setEditingGroupId(id)}
      onCloseEdit={() => setEditingGroupId("")}
      onStartCreate={() => {
        setShowAddForm(false);
        setViewingGroupId("");
        setCreatingGroup(true);
      }}
      onCancelCreate={() => setCreatingGroup(false)}
      onCreate={handleCreateGroup}
      onRename={handleRenameGroup}
      onDelete={handleDeleteGroup}
      onAssignGuest={handleAssignGuest}
    />
  );

  const iconBtn = (label: string, icon: string, onClick: () => void, primary = false) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 shrink-0 w-12 h-12 rounded-xl border shadow-sm transition-colors",
        primary
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface text-primary hover:bg-primary hover:text-on-primary hover:border-primary",
      )}
    >
      <Icon name={icon} className="text-[20px]" />
      <span className="text-[8px] font-label-caps tracking-wide leading-none">{label}</span>
    </button>
  );

  const openAddGuest = () => {
    setCreatingGroup(false);
    setViewingGroupId("");
    setShowAddForm(true);
  };

  const openAddGroup = () => {
    setShowAddForm(false);
    setViewingGroupId("");
    setCreatingGroup((open) => !open);
  };

  const addGuestCta = (opts?: { sticky?: boolean; full?: boolean; balanced?: boolean }) => (
    <button
      type="button"
      onClick={openAddGuest}
      className={cn(
        "add-guest-cta relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary",
        "font-label-caps tracking-[0.12em] shadow-[0_14px_28px_-10px_rgba(128,0,32,0.55)]",
        "hover:brightness-110 active:scale-[0.98] transition-[transform,filter]",
        opts?.full
          ? "w-full h-12 px-5 text-[11px]"
          : opts?.balanced
            ? "h-11 min-w-[168px] px-6 text-[11px]"
            : "h-12 px-5 text-[11px] shrink-0",
        opts?.sticky && "shadow-[0_18px_36px_-12px_rgba(128,0,32,0.65)]",
      )}
    >
      <Icon name="person_add" className="relative z-[1] text-[18px]" />
      <span className="relative z-[1]">Add Guest</span>
    </button>
  );

  const addGroupCta = (
    <button
      type="button"
      onClick={openAddGroup}
      aria-pressed={creatingGroup}
      className={cn(
        "add-guest-cta relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full shrink-0",
        "h-12 px-5 font-label-caps text-[11px] tracking-[0.12em]",
        "shadow-[0_14px_28px_-10px_rgba(128,0,32,0.55)]",
        "hover:brightness-110 active:scale-[0.98] transition-[transform,filter]",
        creatingGroup
          ? "bg-[#f3d58a] text-primary"
          : "bg-primary text-on-primary",
      )}
    >
      <Icon name="workspaces" className="relative z-[1] text-[20px]" />
      <span className="relative z-[1]">{creatingGroup ? "Adding…" : "Add Group"}</span>
    </button>
  );

  const listToolbar = (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative flex-1">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={receptionView ? "Search everyone at reception" : "Search guests"}
          autoComplete="off"
          className="w-full h-11 pl-10 pr-3 rounded-xl border border-outline-variant bg-surface text-sm outline-none focus:border-primary/40"
        />
      </div>
      <div className="lg:hidden flex gap-2 items-center">
        {iconBtn("Copy", "ios_share", () => void copyGuestList())}
      </div>
    </div>
  );

  const guestListPane = (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {listToolbar}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        <div
          className={cn(
            "guest-list-grid gap-2",
            listColumns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            listColumns === 2 && "grid-cols-1 sm:grid-cols-2",
            listColumns === 1 && "grid-cols-1",
          )}
        >
          {visibleGuests.length ? (
            visibleGuests.map((row) => (
              <GuestRowCard
                key={row.id}
                row={row}
                state={state}
                groups={groups}
                showGroupControls
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                onUpdate={(next) =>
                  updateGuests(state.guests.map((entry) => (entry.id === next.id ? next : entry)))
                }
                onDelete={() => {
                  updateGuests(state.guests.filter((entry) => entry.id !== row.id));
                  if (expandedId === row.id) setExpandedId(null);
                  showToast("Guest removed");
                }}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-[rgba(128,0,32,0.12)] bg-surface p-8 text-center sm:col-span-2 xl:col-span-3">
              <p className="font-headline-md text-primary text-[22px]">
                {state.guests.length ? "No guests in this view" : "No guests yet"}
              </p>
              <p className="text-sm text-on-surface-variant mt-1 mb-5">
                {state.guests.length
                  ? "Clear search or the day filter."
                  : "Start your guest list with the first family."}
              </p>
              {!state.guests.length ? (
                <div className="flex justify-center">{addGuestCta()}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <div
        className={cn(
          "hidden lg:flex shrink-0",
          showGroupColumn ? "pt-1" : "justify-center items-center pt-3 pb-1",
        )}
      >
        {addGuestCta(
          showGroupColumn
            ? { full: true, sticky: true }
            : { balanced: true, sticky: true },
        )}
      </div>
    </div>
  );

  return (
    <div className="bento-card mobile-card rounded-2xl lg:rounded-xl overflow-hidden flex flex-col lg:h-full lg:min-h-0">
      <div className="lg:hidden border-b border-surface-container-highest bg-surface-container-low">
        <div className="px-3 pt-3 pb-2">
          <div className="flex gap-2 items-center overflow-x-auto scroll-hide">{renderPills(true)}</div>
        </div>
        <div className="px-3 pb-3">
          <div className="mobile-h-scroll scroll-hide">
            <GuestStatDial
              compact
              label="Stay"
              value={String(metrics.stayTotal)}
              hint="Need rooms"
              icon="hotel"
              percent={metrics.headTotal ? (metrics.stayTotal / metrics.headTotal) * 100 : 0}
            />
            <GuestStatDial
              compact
              label="Guests"
              value={String(metrics.headTotal)}
              hint={activeDay ? "This event" : "Headcount"}
              icon="groups"
              percent={100}
            />
            <GuestStatDial
              compact
              label="Invited"
              value={`${metrics.inviteSentTotal}/${metrics.familyCount || 0}`}
              hint="Families"
              icon="mark_email_read"
              percent={invitePct}
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex px-5 py-2 bg-surface-container-low border-b border-surface-container-highest items-center shrink-0">
        <div className="flex gap-2 items-center min-w-0 overflow-x-auto scroll-hide py-1">{renderPills(false)}</div>
      </div>

      <div className="hidden lg:flex px-5 py-1.5 border-b border-surface-container-highest items-center gap-3 shrink-0">
        <div className="grid grid-cols-3 gap-2 flex-1">
          <GuestStatDial
            label="Stay"
            value={String(metrics.stayTotal)}
            hint="Need rooms"
            icon="hotel"
            percent={metrics.headTotal ? (metrics.stayTotal / metrics.headTotal) * 100 : 0}
          />
          <GuestStatDial
            label="Guests"
            value={String(metrics.headTotal)}
            hint={activeDay ? "This event" : "Headcount"}
            icon="groups"
            percent={100}
          />
          <GuestStatDial
            label="Invited"
            value={`${metrics.inviteSentTotal} / ${metrics.familyCount || 0}`}
            hint="Families sent"
            icon="mark_email_read"
            percent={invitePct}
          />
        </div>
        {iconBtn("Copy", "ios_share", () => void copyGuestList())}
        {addGroupCta}
      </div>

      <div className="flex-1 min-h-0 p-3 pb-16 lg:pb-4 lg:p-4 xl:p-5 bg-surface-container-low relative overflow-y-auto lg:overflow-hidden">
        <div className="absolute inset-0 menu-cards-radial pointer-events-none" />
        <div
          className={cn(
            "relative z-10 min-h-0 flex flex-col gap-3 lg:h-full lg:overflow-hidden",
            showGroupColumn && "lg:grid lg:grid-cols-12 lg:gap-5 lg:gap-y-0",
          )}
        >
          <div
            className={cn(
              "min-h-0 flex flex-col order-2",
              showGroupColumn
                ? cn(
                    "lg:min-h-0 lg:overflow-hidden lg:order-1",
                    split.listCols === 6
                      ? "lg:col-span-6"
                      : split.listCols === 5
                        ? "lg:col-span-5"
                        : "lg:col-span-4",
                  )
                : "flex-1 lg:overflow-hidden",
            )}
          >
            <div className="guest-swap-stage">
              <div
                className={cn(
                  "guest-swap-pane guest-swap-pane--list",
                  viewingGroupActive && "is-away",
                )}
              >
                {guestListPane}
              </div>
              <div
                className={cn(
                  "guest-swap-pane guest-swap-pane--group",
                  viewingGroupActive && "is-in",
                )}
              >
                {viewingGroup ? (
                  <GroupMemberBoard
                    group={viewingGroup}
                    guests={state.guests}
                    onBack={() => setViewingGroupId("")}
                    onEdit={() => setEditingGroupId(viewingGroup.id)}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {showGroupColumn ? (
            <div
              className={cn(
                "order-1 lg:order-2 lg:h-full lg:min-h-0",
                split.groupCols === 6
                  ? "lg:col-span-6"
                  : split.groupCols === 7
                    ? "lg:col-span-7"
                    : "lg:col-span-8",
              )}
            >
              {groupColumn}
            </div>
          ) : null}
        </div>
      </div>

      {!showAddForm ? (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto flex justify-center">
            {addGuestCta({ balanced: true, sticky: true })}
          </div>
        </div>
      ) : null}

      <AddGuestModal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAddGuest}
      />
    </div>
  );
}
