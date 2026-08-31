import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignGuestToGroup,
  createGuestFromDraft,
  createGuestGroup,
  formatGuestPlan,
  guestBoardSplit,
  guestListColumnCount,
  groupPeopleCount,
  guestsByFunctionDay,
  guestMatchesFilter,
  guestMetrics,
  guestsInGroup,
  isReceptionFilter,
  MAX_GUEST_GROUPS,
  removeGuestGroup,
  syncEventGuestCount,
  touchGuestGroup,
  touchGuestRow,
  type GuestDraft,
} from "../../domain/guest";
import {
  canRemoveWeddingFunction,
  functionIds,
  removeWeddingFunction,
  resolveDayName,
  resolveFunctionDateLabel,
} from "../../domain/functions";
import type { GuestGroup, GuestRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { DayPill } from "../menu/DayPill";
import { MobileEventButtons, MAX_MOBILE_EVENTS } from "../ui/MobileEventButtons";
import { AddGuestModal } from "./AddGuestModal";
import {
  CreateGroupModal,
  GroupMemberBoard,
  GuestGroupColumn,
  GuestGroupTile,
} from "./GuestGroupCard";
import { GuestRowCard } from "./GuestRowCard";
import { GuestStatDial } from "./GuestStatDial";
import { GuestMetricCards } from "./GuestMetricCards";
import { GuestListSheet } from "./GuestListSheet";
import { GroupMemberSheet } from "./GroupMemberSheet";
import { ViewerBanner } from "../access/ViewerBanner";
import { HeroCtaButton } from "../ui/HeroCtaButton";
import { AddGuestCta } from "./AddGuestCta";
import { ConfirmDangerDialog } from "../ui/ConfirmDangerDialog";

const GUEST_SWAP_MS = 520;

export function GuestBoard() {
  const navigate = useNavigate();
  const { state, setState, showToast, setNewEventModalOpen } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("guests", "edit");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDay, setActiveDay] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [viewingGroupId, setViewingGroupId] = useState("");
  const [stagedGroupId, setStagedGroupId] = useState("");
  const [swapActive, setSwapActive] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [removingDayId, setRemovingDayId] = useState<number | null>(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<GuestGroup | null>(null);
  const swapTimer = useRef(0);

  const groups = state.guestGroups || [];
  const dayIds = useMemo(() => functionIds(state), [state]);

  useEffect(() => {
    if (!dayIds.length) {
      if (activeDay) setActiveDay("");
      return;
    }
    if (!activeDay || !dayIds.includes(Number(activeDay))) {
      setActiveDay(String(dayIds[0]));
    }
  }, [dayIds, activeDay]);

  const receptionView = isReceptionFilter(activeDay);
  const viewingGroup =
    groups.find((group) => group.id === stagedGroupId) ||
    groups.find((group) => group.id === viewingGroupId) ||
    null;
  const viewingGroupActive = swapActive;

  const openGroupView = useCallback((id: string) => {
    window.clearTimeout(swapTimer.current);
    setShowAddForm(false);
    setCreatingGroup(false);
    setListSheetOpen(false);
    setViewingGroupId(id);
    setStagedGroupId(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSwapActive(true));
    });
  }, []);

  const closeGroupView = useCallback(() => {
    window.clearTimeout(swapTimer.current);
    setViewingGroupId("");
    setSwapActive(false);
    swapTimer.current = window.setTimeout(() => {
      setStagedGroupId("");
    }, GUEST_SWAP_MS);
  }, []);

  const toggleGroupView = useCallback(
    (id: string) => {
      if (viewingGroupId === id || (swapActive && stagedGroupId === id)) {
        closeGroupView();
        return;
      }
      openGroupView(id);
    },
    [viewingGroupId, swapActive, stagedGroupId, closeGroupView, openGroupView],
  );

  useEffect(() => {
    return () => window.clearTimeout(swapTimer.current);
  }, []);

  useEffect(() => {
    if (viewingGroupId && !groups.some((group) => group.id === viewingGroupId)) {
      closeGroupView();
    }
    if (stagedGroupId && !groups.some((group) => group.id === stagedGroupId)) {
      window.clearTimeout(swapTimer.current);
      setStagedGroupId("");
      setSwapActive(false);
      setViewingGroupId("");
    }
    if (editingGroupId && !groups.some((group) => group.id === editingGroupId)) {
      setEditingGroupId("");
    }
  }, [viewingGroupId, stagedGroupId, editingGroupId, groups, closeGroupView]);

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

  const listGuests = useMemo(() => {
    if (!expandedId) return visibleGuests;
    if (visibleGuests.some((row) => row.id === expandedId)) return visibleGuests;
    const extra = state.guests.find((row) => row.id === expandedId);
    return extra ? [extra, ...visibleGuests] : visibleGuests;
  }, [visibleGuests, expandedId, state.guests]);

  const split = guestBoardSplit(groups.length);
  const listColumns = guestListColumnCount(groups.length);
  const hasGroups = groups.length > 0;
  const showGroupColumn = hasGroups;

  const updateGuests = (guests: GuestRow[]) => {
    if (!canEdit) {
      showToast("Viewer profiles cannot edit guests");
      return;
    }
    const prevById = new Map(state.guests.map((row) => [row.id, row]));
    const now = Date.now();
    const stamped = guests.map((row) => {
      const before = prevById.get(row.id);
      if (!before) return row.updatedAt ? row : { ...row, updatedAt: now };
      if ((row.updatedAt || 0) > (before.updatedAt || 0)) return row;
      if (before === row) return row;
      return touchGuestRow(row);
    });
    setState((prev) => ({
      ...prev,
      guests: stamped,
      event: { ...prev.event, guests: syncEventGuestCount(stamped) },
    }));
  };

  const handleAddGuest = (draft: GuestDraft) => {
    const row = createGuestFromDraft(draft);
    updateGuests([...state.guests, row]);
    setExpandedId(null);
    showToast("Guest added");
  };

  const handleCreateGroup = (name: string) => {
    if (!canEdit) return;
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
    openGroupView(group.id);
    setEditingGroupId(group.id);
    showToast("Group created");
  };

  const handleRenameGroup = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      guestGroups: (prev.guestGroups || []).map((group) =>
        group.id === id ? touchGuestGroup({ ...group, name }) : group,
      ),
    }));
  };

  const handleDeleteGroup = (id: string) => {
    if (!canEdit) return;
    setState((prev) => removeGuestGroup(prev, id));
    if (viewingGroupId === id || stagedGroupId === id) closeGroupView();
    if (editingGroupId === id) setEditingGroupId("");
    showToast("Group removed");
  };

  const handleAssignGuest = (guestId: string, groupId: string, people?: number) => {
    updateGuests(
      state.guests.map((row) =>
        row.id === guestId ? assignGuestToGroup(row, groupId, people) : row,
      ),
    );
  };

  const groupColumn = (
    <GuestGroupColumn
      groups={groups}
      guests={state.guests}
      editId={editingGroupId}
      activeGroupId={viewingGroupActive ? viewingGroupId : ""}
      readOnly={!canEdit}
      onOpen={toggleGroupView}
      onCloseEdit={() => setEditingGroupId("")}
      onRename={handleRenameGroup}
      onDelete={handleDeleteGroup}
      onAssignGuest={handleAssignGuest}
    />
  );

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
    if (!canEdit) return;
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
          canDelete={canEdit && canRemoveWeddingFunction(state, day)}
          isRemoving={removingDayId === day}
          compact={compact}
          onSelect={() => toggleDay(day)}
          onDelete={() => handleDeleteDay(day)}
        />
      ))}
    </>
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
    closeGroupView();
    setExpandedId(null);
    setShowAddForm(true);
  };

  const openAddGroup = () => {
    if (groups.length >= MAX_GUEST_GROUPS && !creatingGroup) {
      showToast("Maximum 10 groups");
      return;
    }
    setShowAddForm(false);
    closeGroupView();
    setCreatingGroup((open) => !open);
  };

  const openGuestListSheet = () => {
    closeGroupView();
    setListSheetOpen(true);
  };

  const addGroupCta = (opts?: { compact?: boolean }) => (
    <HeroCtaButton
      label={creatingGroup ? "Adding…" : "Add Group"}
      icon="workspaces"
      onClick={openAddGroup}
      compact={opts?.compact}
      active={creatingGroup}
      disabled={!creatingGroup && groups.length >= MAX_GUEST_GROUPS}
      aria-pressed={creatingGroup}
    />
  );

  const addGuestCta = (placement: "desktop" | "mobile") => (
    <AddGuestCta onClick={openAddGuest} placement={placement} />
  );

  const listToolbar = (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative flex-1 min-w-0">
        <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={receptionView ? "Search everyone at reception" : "Search guests"}
          autoComplete="off"
          className="w-full h-10 lg:h-11 pl-9 pr-3 rounded-xl border border-outline-variant bg-surface text-[13px] outline-none focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
      <div className="hidden lg:flex gap-2 items-center shrink-0">
        {iconBtn("Copy", "ios_share", () => void copyGuestList())}
        {canEdit ? addGroupCta() : null}
      </div>
      <div className="lg:hidden flex gap-1.5 items-center shrink-0">
        <button
          type="button"
          aria-label="Copy guest list"
          onClick={() => void copyGuestList()}
          className="h-10 w-10 rounded-xl border border-outline-variant bg-white text-primary flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Icon name="ios_share" className="text-[18px]" />
        </button>
        {canEdit ? (
          <button
            type="button"
            aria-label={creatingGroup ? "Adding group" : "Add group"}
            aria-pressed={creatingGroup}
            onClick={openAddGroup}
            disabled={!creatingGroup && groups.length >= MAX_GUEST_GROUPS}
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              creatingGroup
                ? "bg-primary text-on-primary"
                : "border border-outline-variant bg-white text-primary",
            )}
          >
            <Icon name="workspaces" className="text-[18px]" />
          </button>
        ) : null}
      </div>
    </div>
  );

  const eventOptions = dayIds.map((day) => ({
    id: String(day),
    name: resolveDayName(state, day),
    dateLabel: resolveFunctionDateLabel(state, day) || "",
    canDelete: canEdit && canRemoveWeddingFunction(state, day),
  }));

  const guestCards = (
    <div
      className={cn(
        "guest-list-grid gap-2",
        listColumns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        listColumns === 2 && "grid-cols-1 sm:grid-cols-2",
        listColumns === 1 && "grid-cols-1",
      )}
    >
      {listGuests.length ? (
        listGuests.map((row) => (
          <GuestRowCard
            key={row.id}
            row={row}
            state={state}
            groups={groups}
            showGroupControls
            readOnly={!canEdit}
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
          <p className="text-sm text-on-surface-variant mt-1">
            {state.guests.length
              ? "Clear search or the day filter."
              : "Use Add Guest to start your list."}
          </p>
        </div>
      )}
    </div>
  );

  const guestListPane = (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {listToolbar}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2">{guestCards}</div>
    </div>
  );

  const mobileStage = (
    <div className="lg:hidden flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] space-y-3.5 pt-1.5">
      <GuestMetricCards
        variant="stage"
        stayTotal={metrics.stayTotal}
        headTotal={metrics.headTotal}
        inviteSentTotal={metrics.inviteSentTotal}
        familyCount={metrics.familyCount}
        onStayClick={() => navigate("/people/rooms")}
      />

      <div className="rounded-xl border border-[rgba(128,0,32,0.1)] bg-white/80 p-1.5 shadow-[0_8px_22px_-16px_rgba(128,0,32,0.3)]">
        <MobileEventButtons
          options={eventOptions}
          value={activeDay}
          onChange={setActiveDay}
          onAddEvent={
            canEdit && eventOptions.length < MAX_MOBILE_EVENTS
              ? () => setNewEventModalOpen(true)
              : undefined
          }
          onDelete={
            canEdit
              ? (id) => {
                  const dayId = Number(id);
                  if (Number.isFinite(dayId)) handleDeleteDay(dayId);
                }
              : undefined
          }
        />
      </div>

      <button
        type="button"
        onClick={openGuestListSheet}
        className={cn(
          "w-full text-left rounded-2xl overflow-hidden",
          "px-3.5 py-3 flex items-center gap-3",
          "bg-white border border-[rgba(128,0,32,0.1)]",
          "shadow-[0_8px_22px_-16px_rgba(128,0,32,0.2)]",
          "active:scale-[0.985] transition-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <span className="h-10 w-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
          <Icon name="format_list_bulleted" className="text-[20px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-headline-md text-primary text-[16px] leading-tight">
            Guest list
          </span>
          <span className="block text-[11px] text-secondary mt-0.5 tabular-nums">
            {visibleGuests.length}{" "}
            {visibleGuests.length === 1 ? "family" : "families"}
            {activeDay ? ` · ${resolveDayName(state, Number(activeDay))}` : ""}
          </span>
        </span>
        <Icon name="chevron_right" className="text-[20px] text-primary/35 shrink-0" />
      </button>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="font-label-caps text-[10px] tracking-[0.14em] text-secondary uppercase">
            Groups
          </p>
          {canEdit ? (
            <button
              type="button"
              onClick={openAddGroup}
              disabled={!creatingGroup && groups.length >= MAX_GUEST_GROUPS}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-[11px] font-button text-primary border border-[rgba(128,0,32,0.14)] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Icon name="add" className="text-[16px]" />
              Add group
            </button>
          ) : null}
        </div>

        {groups.length ? (
          <div
            className={cn(
              "grid gap-2",
              groups.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {groups.map((group) => (
              <div
                key={group.id}
                className={groups.length === 1 ? "min-h-[15rem]" : "min-h-[9.5rem]"}
              >
                <GuestGroupTile
                  group={group}
                  members={guestsInGroup(state.guests, group.id)}
                  people={groupPeopleCount(state.guests, group.id)}
                  compact={groups.length > 1}
                  active={viewingGroupActive && viewingGroupId === group.id}
                  readOnly={!canEdit}
                  groupCount={groups.length}
                  onOpen={() => toggleGroupView(group.id)}
                  onRequestDelete={() => setPendingDeleteGroup(group)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[rgba(128,0,32,0.2)] bg-white/60 px-4 py-6 text-center">
            <p className="font-headline-md text-primary text-[18px]">No groups yet</p>
            <p className="text-[12px] text-secondary mt-1">
              Cluster families into parties for seating and coordination.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bento-card mobile-card rounded-2xl lg:rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 h-full relative max-lg:bg-transparent max-lg:border-0 max-lg:shadow-none max-lg:rounded-none">
      <ViewerBanner module="guests" className="mx-3 mt-2 lg:mx-4 lg:mt-4 shrink-0" />

      {mobileStage}

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
        {canEdit ? addGroupCta() : null}
      </div>

      <div className="hidden lg:flex flex-1 min-h-0 p-0 lg:p-4 xl:p-5 bg-transparent lg:bg-surface-container-low relative overflow-hidden lg:overflow-hidden flex-col">
        <div className="hidden lg:block absolute inset-0 menu-cards-radial pointer-events-none" />
        <div
          className={cn(
            "relative z-10 min-h-0 flex flex-col gap-2 lg:gap-3 lg:h-full lg:overflow-hidden flex-1",
            showGroupColumn && "lg:grid lg:grid-cols-12 lg:gap-5 lg:items-stretch",
          )}
        >
          <div
            className={cn(
              "min-h-0 flex flex-col flex-1",
              "order-1",
              showGroupColumn
                ? cn(
                    "lg:min-h-0 lg:overflow-hidden lg:order-1 lg:h-full",
                    split.listCols === 8
                      ? "lg:col-span-8"
                      : split.listCols === 7
                        ? "lg:col-span-7"
                        : split.listCols === 6
                          ? "lg:col-span-6"
                          : split.listCols === 5
                            ? "lg:col-span-5"
                            : "lg:col-span-4",
                  )
                : "lg:overflow-hidden",
            )}
          >
            <div className="guest-swap-stage flex-1 min-h-0">
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
                    onBack={closeGroupView}
                    onEdit={() => setEditingGroupId(viewingGroup.id)}
                  />
                ) : null}
              </div>
            </div>
            {canEdit && !showAddForm ? (
              <div className="hidden lg:flex shrink-0 pt-3 pointer-events-auto">
                {addGuestCta("desktop")}
              </div>
            ) : null}
          </div>

          {showGroupColumn ? (
            <div
              data-testid="group-column"
              className={cn(
                "hidden lg:flex order-2 min-h-0 flex-col self-stretch lg:h-full lg:min-h-0",
                split.groupCols === 4
                  ? "lg:col-span-4"
                  : split.groupCols === 5
                    ? "lg:col-span-5"
                    : split.groupCols === 6
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

      {canEdit && !showAddForm ? (
        <div
          className={cn(
            "lg:hidden fixed right-3 z-40 pointer-events-none",
            listSheetOpen
              ? "bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[75]"
              : "bottom-[calc(4.35rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="pointer-events-auto">
            <AddGuestCta onClick={openAddGuest} placement="mobile" />
          </div>
        </div>
      ) : null}

      <GuestListSheet
        open={listSheetOpen}
        onClose={() => {
          setListSheetOpen(false);
          setExpandedId(null);
        }}
        guestCount={visibleGuests.length}
        toolbar={listToolbar}
      >
        {guestCards}
      </GuestListSheet>

      <GroupMemberSheet
        open={Boolean(viewingGroupActive && viewingGroup)}
        group={viewingGroup}
        guests={state.guests}
        onClose={closeGroupView}
        onEdit={() => {
          if (viewingGroup) setEditingGroupId(viewingGroup.id);
        }}
        onRename={canEdit ? handleRenameGroup : undefined}
        onOpenGuest={(guestId) => {
          setExpandedId(guestId);
        }}
      />

      {/* Mobile: open guest edit from group without requiring Guest list sheet */}
      {expandedId && !listSheetOpen ? (
        <div className="lg:hidden fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden>
          {(() => {
            const row = state.guests.find((guest) => guest.id === expandedId);
            if (!row) return null;
            return (
              <GuestRowCard
                row={row}
                state={state}
                groups={groups}
                showGroupControls
                readOnly={!canEdit}
                expanded
                onToggle={() => setExpandedId(null)}
                onUpdate={(next) =>
                  updateGuests(state.guests.map((entry) => (entry.id === next.id ? next : entry)))
                }
                onDelete={() => {
                  updateGuests(state.guests.filter((entry) => entry.id !== row.id));
                  setExpandedId(null);
                  showToast("Guest removed");
                }}
              />
            );
          })()}
        </div>
      ) : null}

      <CreateGroupModal
        open={creatingGroup}
        onCancel={() => setCreatingGroup(false)}
        onCreate={handleCreateGroup}
      />

      <AddGuestModal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAddGuest}
      />

      {pendingDeleteGroup ? (
        <ConfirmDangerDialog
          title={`Delete “${pendingDeleteGroup.name}”?`}
          message={
            guestsInGroup(state.guests, pendingDeleteGroup.id).length
              ? "Families in this group stay on your guest list. Only the group is removed."
              : "This group will be removed. You can create it again anytime."
          }
          confirmLabel="Delete group"
          cancelLabel="Keep group"
          onCancel={() => setPendingDeleteGroup(null)}
          onConfirm={() => {
            handleDeleteGroup(pendingDeleteGroup.id);
            setPendingDeleteGroup(null);
          }}
        />
      ) : null}
    </div>
  );
}
