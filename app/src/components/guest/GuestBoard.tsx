import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { roomMetrics } from "../../domain/rooms";
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
import { InviteTrackerSheet } from "./InviteTrackerSheet";

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
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [guestPortalOpening, setGuestPortalOpening] = useState(false);
  const portalOpenTimer = useRef(0);
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

  useEffect(() => {
    if (searchParams.get("invites") !== "1") return;
    setInviteSheetOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("invites");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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
  const stayRoomMetrics = useMemo(() => roomMetrics(state), [state]);
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
    const newName = String(draft.newGroupName || "").trim();
    if (newName) {
      if (groups.length >= MAX_GUEST_GROUPS) {
        showToast("Maximum 10 groups");
        return;
      }
      const group = createGuestGroup(newName);
      const row = createGuestFromDraft({ ...draft, groupId: group.id });
      const stamped = row.updatedAt ? row : { ...row, updatedAt: Date.now() };
      setState((prev) => {
        const guests = [...prev.guests, stamped];
        return {
          ...prev,
          guestGroups: [...(prev.guestGroups || []), group],
          guests,
          event: { ...prev.event, guests: syncEventGuestCount(guests) },
        };
      });
      setExpandedId(null);
      showToast(`Guest added · ${group.name}`);
      return;
    }

    const row = createGuestFromDraft(draft);
    updateGuests([...state.guests, row]);
    setExpandedId(null);
    const groupName = draft.groupId
      ? groups.find((group) => group.id === draft.groupId)?.name
      : undefined;
    showToast(groupName ? `Guest added · ${groupName}` : "Guest added");
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

  const handleToggleInvite = (guestId: string, sent: boolean) => {
    if (!canEdit) {
      showToast("Viewer profiles cannot edit guests");
      return;
    }
    updateGuests(
      state.guests.map((row) =>
        row.id === guestId
          ? { ...row, invitationSent: sent, inviteStatus: sent ? "Sent" : "Pending" }
          : row,
      ),
    );
    showToast(sent ? "Marked as invited" : "Moved to pending");
  };

  const openGuestListSheet = () => {
    closeGroupView();
    if (guestPortalOpening || listSheetOpen) return;
    setGuestPortalOpening(true);
    window.clearTimeout(portalOpenTimer.current);
    portalOpenTimer.current = window.setTimeout(() => {
      setListSheetOpen(true);
      setGuestPortalOpening(false);
    }, 280);
  };

  useEffect(() => {
    return () => window.clearTimeout(portalOpenTimer.current);
  }, []);

  const previewGuests = visibleGuests.slice(0, 3);
  const dayLabel = activeDay
    ? resolveDayName(state, Number(activeDay))
    : "All events";
  const peekTones = [
    "bg-[#f3e0e4] text-[#9f1239]",
    "bg-[#f5edd8] text-[#8a6a12]",
    "bg-[#e8efe8] text-[#2f5d3a]",
  ] as const;
  const peekInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?";

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
    <div className="lg:hidden flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-clip px-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] space-y-6 pt-2 people-bg-airy people-stage-touch">
      <GuestMetricCards
        variant="stage"
        stayTotal={metrics.stayTotal}
        headTotal={metrics.headTotal}
        inviteSentTotal={metrics.inviteSentTotal}
        familyCount={metrics.familyCount}
        onInviteClick={() => setInviteSheetOpen(true)}
      />

      <section className="people-event-rail" aria-label="Event day filter">
        <p className="people-event-rail__lab">Pick an event day</p>
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
          className="people-event-rail__scroller"
        />
      </section>

      <section className="space-y-3.5" aria-label="Guests and menu">
        <p className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1a100c] px-0.5">
          Guests & menu
        </p>

        <div className="people-masonry">
          <button
            type="button"
            onClick={openGuestListSheet}
            aria-label="Open full guest list"
            className={cn(
              "people-masonry__guest text-left relative overflow-hidden",
              "rounded-[26px] bg-[#f5c9a8] px-4 pt-4 pb-4",
              "shadow-[0_10px_28px_-16px_rgba(154,72,36,0.28)]",
              "active:scale-[0.985] transition-transform",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45a3a]/40",
              guestPortalOpening && "is-opening",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a5238]/80">
              This event · {dayLabel}
            </p>
            <p className="mt-2 text-[20px] font-extrabold tracking-[-0.02em] text-[#1a100c] leading-none">
              Guest list
            </p>
            <p className="mt-2 text-[12px] font-semibold text-[#6b5c50] tabular-nums">
              {visibleGuests.length}{" "}
              {visibleGuests.length === 1 ? "family" : "families"}
            </p>

            <div className="mt-5 flex items-center" aria-hidden>
              {previewGuests.slice(0, 3).map((row, index) => (
                <span
                  key={row.id}
                  className={cn(
                    "h-8 w-8 rounded-full grid place-items-center text-[9px] font-extrabold border-2 border-white",
                    index > 0 && "-ml-2",
                    peekTones[index % peekTones.length],
                  )}
                >
                  {peekInitials(row.name)}
                </span>
              ))}
              {visibleGuests.length > 3 ? (
                <span className="-ml-2 h-8 px-2 rounded-full grid place-items-center text-[10px] font-extrabold bg-white/80 text-[#1a100c] border-2 border-white">
                  +{visibleGuests.length - 3}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/55 text-[10px] font-bold text-[#1a100c]">
                <Icon name="mark_email_read" className="text-[12px]" />
                {metrics.inviteSentTotal} sent
              </span>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/55 text-[10px] font-bold text-[#1a100c]">
                <Icon name="hotel" className="text-[12px]" />
                {metrics.stayTotal} stay
              </span>
            </div>
          </button>

          <div className="people-masonry__side space-y-3">
            <button
              type="button"
              onClick={() => navigate(`/people/menu${activeDay ? `?day=${activeDay}` : ""}`)}
              aria-label="Go to Menu"
              className={cn(
                "w-full text-left relative overflow-hidden",
                "rounded-[26px] bg-[#d7e4f0] px-4 py-4 min-h-[7.5rem]",
                "shadow-[0_10px_28px_-16px_rgba(60,90,120,0.22)]",
                "active:scale-[0.985] transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a9ab8]/45",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#4a6478]/80">
                Plan meals
              </p>
              <p className="mt-1.5 text-[18px] font-extrabold tracking-[-0.02em] text-[#1a100c] leading-none">
                Menu
              </p>
              <p className="mt-2 text-[11px] font-semibold text-[#5a7080]">
                Courses · caterers
              </p>
              <Icon
                name="north_east"
                className="absolute top-4 right-4 text-[18px] text-[#4a6478]/70"
              />
            </button>

            <button
              type="button"
              onClick={() => navigate("/people/rooms")}
              aria-label="Go to Rooms"
              className={cn(
                "w-full text-left relative overflow-hidden",
                "rounded-[26px] bg-[#ecd5d8] px-4 py-3.5",
                "shadow-[0_10px_28px_-16px_rgba(120,60,70,0.2)]",
                "active:scale-[0.985] transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a87880]/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1a100c] leading-none">
                    Rooms
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#7a5a60] tabular-nums">
                    {metrics.stayTotal === 0
                      ? "No stay guests"
                      : stayRoomMetrics.unassignedGuests > 0
                        ? `${stayRoomMetrics.unassignedGuests} waiting · ${stayRoomMetrics.totalRooms} ${stayRoomMetrics.totalRooms === 1 ? "room" : "rooms"}`
                        : `${stayRoomMetrics.assignedGuests} mapped · ${stayRoomMetrics.totalRooms} ${stayRoomMetrics.totalRooms === 1 ? "room" : "rooms"}`}
                  </p>
                </div>
                <span className="h-9 w-9 rounded-full bg-white/70 grid place-items-center text-[#7a5a60] shrink-0">
                  <Icon name="hotel" className="text-[18px]" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3.5" aria-label="Groups">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1a100c]">
              Groups
            </p>
            <p className="text-[12px] text-[#7a6f62] mt-0.5 font-semibold">
              Wedding-wide · same for every event
            </p>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={openAddGroup}
              disabled={!creatingGroup && groups.length >= MAX_GUEST_GROUPS}
              className={cn(
                "inline-flex items-center gap-0.5 h-8 px-2.5 rounded-full shrink-0",
                "text-[12px] font-bold text-[#c45a3a]",
                "bg-transparent",
                "active:opacity-70 transition-opacity",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c45a3a]/35",
                "disabled:opacity-40",
              )}
            >
              <Icon name="add" className="text-[16px]" />
              Add
            </button>
          ) : null}
        </div>

        {groups.length ? (
          <div
            className={cn(
              "grid gap-3",
              groups.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {groups.map((group, index) => (
              <div
                key={group.id}
                className={groups.length === 1 ? "min-h-[9.5rem]" : "min-h-[6.75rem]"}
              >
                <GuestGroupTile
                  group={group}
                  members={guestsInGroup(state.guests, group.id)}
                  people={groupPeopleCount(state.guests, group.id)}
                  compact={groups.length > 1}
                  active={viewingGroupActive && viewingGroupId === group.id}
                  readOnly={!canEdit}
                  groupCount={groups.length}
                  surface="clay"
                  toneIndex={index}
                  onOpen={() => toggleGroupView(group.id)}
                  onRequestDelete={() => setPendingDeleteGroup(group)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[rgba(26,16,12,0.12)] bg-white/70 px-4 py-8 text-center">
            <p className="text-[16px] font-extrabold text-[#1a100c]">No groups yet</p>
            <p className="text-[12px] text-[#7a6f62] mt-1.5 font-semibold">
              Cluster families for seating and coordination.
            </p>
          </div>
        )}
      </section>
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
                    onOpenGuest={canEdit ? (guestId) => setExpandedId(guestId) : undefined}
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
              : "bottom-[calc(5.1rem+env(safe-area-inset-bottom))]",
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
        dayLabel={dayLabel}
        toolbar={listToolbar}
      >
        {guestCards}
      </GuestListSheet>

      <InviteTrackerSheet
        open={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        guests={visibleGuests}
        dayLabel={dayLabel}
        onToggleInvite={canEdit ? handleToggleInvite : undefined}
        onOpenGuest={
          canEdit
            ? (guestId) => {
                setInviteSheetOpen(false);
                setExpandedId(guestId);
              }
            : undefined
        }
      />

      <GroupMemberSheet
        open={Boolean(viewingGroupActive && viewingGroup)}
        group={viewingGroup}
        guests={state.guests}
        onClose={closeGroupView}
        onEdit={() => {
          if (viewingGroup) setEditingGroupId(viewingGroup.id);
        }}
        onRename={canEdit ? handleRenameGroup : undefined}
        onDelete={
          canEdit
            ? (id) => {
                const group = groups.find((row) => row.id === id) || null;
                if (!group) return;
                closeGroupView();
                setPendingDeleteGroup(group);
              }
            : undefined
        }
        onOpenGuest={(guestId) => {
          setExpandedId(guestId);
        }}
      />

      {/* Open contact card from group / invite without requiring Guest list sheet */}
      {expandedId && !listSheetOpen ? (
        <div className="fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden>
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
        groups={groups}
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
