import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  formatGuestPlan,
  guestsByFunctionDay,
  guestMatchesFilter,
  guestMetrics,
  isReceptionFilter,
  syncEventGuestCount,
  touchGuestRow,
} from "../../domain/guest";
import {
  canRemoveWeddingFunction,
  functionIds,
  removeWeddingFunction,
  resolveDayName,
  resolveFunctionDateLabel,
} from "../../domain/functions";
import { roomMetrics } from "../../domain/rooms";
import type { GuestRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { DayPill } from "../menu/DayPill";
import { MobileEventButtons, MAX_MOBILE_EVENTS } from "../ui/MobileEventButtons";
import { GuestRowCard } from "./GuestRowCard";
import { GuestStatDial } from "./GuestStatDial";
import { GuestMetricCards } from "./GuestMetricCards";
import { GuestListSheet } from "./GuestListSheet";
import { ViewerBanner } from "../access/ViewerBanner";
import { useNavigateInsideEvent } from "../../navigation/eventHistory";

export function GuestBoard() {
  const navigate = useNavigate();
  const go = useNavigateInsideEvent();
  const { state, setState, showToast, setNewEventModalOpen } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("guests", "edit");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDay, setActiveDay] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [headcountOpen, setHeadcountOpen] = useState(false);
  const [guestPortalOpening, setGuestPortalOpening] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [removingDayId, setRemovingDayId] = useState<number | null>(null);
  const portalOpenTimer = useRef(0);

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
    const next = new URLSearchParams(searchParams);
    next.delete("invites");
    setSearchParams(next, { replace: true });
    go("/people/invites");
  }, [searchParams, setSearchParams, go]);

  const receptionView = isReceptionFilter(activeDay);

  const metrics = useMemo(
    () => guestMetrics(state.guests, activeDay || undefined),
    [state.guests, activeDay],
  );
  const stayRoomMetrics = useMemo(
    () => roomMetrics(state, activeDay || undefined),
    [state, activeDay],
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

  const openGuestListSheet = () => {
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
    "bg-white text-black",
    "bg-[#82b1db] text-black",
    "bg-[#1e1b18] text-white",
  ] as const;
  const peekInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?";

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
        "guest-list-grid grid-cols-1 gap-2 lg:grid-cols-2",
      )}
    >
      {listGuests.length ? (
        listGuests.map((row) => (
          <GuestRowCard
            key={row.id}
            row={row}
            state={state}
            groups={groups}
            showGroupControls={false}
            readOnly={!canEdit}
            expanded={false}
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
              : "Add people from Contacts."}
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
    <div className="lg:hidden flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-clip px-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] space-y-6 pt-2 people-bg-airy people-stage-touch font-[Manrope,sans-serif] text-black">
      <GuestMetricCards
        variant="stage"
        stayTotal={metrics.stayTotal}
        headTotal={metrics.headTotal}
        inviteSentTotal={metrics.inviteSentTotal}
        familyCount={metrics.familyCount}
        onOpen={() => setHeadcountOpen(true)}
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
        <p className="text-[18px] font-extrabold tracking-[-0.02em] text-black px-0.5">
          Guests & menu
        </p>

        <div className="people-masonry">
          <button
            type="button"
            onClick={openGuestListSheet}
            aria-label="Open full guest list"
            className={cn(
              "people-masonry__guest text-left relative overflow-hidden",
              "rounded-[26px] bg-[#feca43] px-4 pt-4 pb-4 text-black",
              "shadow-[0_10px_24px_rgba(30,27,24,0.06)]",
              "active:scale-[0.985] transition-transform",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
              guestPortalOpening && "is-opening",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/55">
              This event · {dayLabel}
            </p>
            <p className="mt-2 text-[20px] font-extrabold tracking-[-0.02em] text-black leading-none">
              Guest list
            </p>
            <p className="mt-2 text-[12px] font-semibold text-[#584141] tabular-nums">
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
                <span className="-ml-2 h-8 px-2 rounded-full grid place-items-center text-[10px] font-extrabold bg-white/80 text-black border-2 border-white">
                  +{visibleGuests.length - 3}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/70 text-[10px] font-bold text-black">
                <Icon name="mark_email_read" className="text-[12px]" />
                {metrics.inviteSentTotal} sent
              </span>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/70 text-[10px] font-bold text-black">
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
                "w-full text-left relative overflow-hidden text-black",
                "rounded-[26px] bg-[#82b1db] px-4 py-4 min-h-[7.5rem]",
                "shadow-[0_10px_24px_rgba(30,27,24,0.06)]",
                "active:scale-[0.985] transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/55">
                Plan meals
              </p>
              <p className="mt-1.5 text-[18px] font-extrabold tracking-[-0.02em] text-black leading-none">
                Menu
              </p>
              <p className="mt-2 text-[11px] font-semibold text-[#1e1b18]/70">
                Courses · caterers
              </p>
              <Icon
                name="north_east"
                className="absolute top-4 right-4 text-[18px] text-black/55"
              />
            </button>

            <button
              type="button"
              onClick={() => navigate(`/people/rooms${activeDay ? `?day=${activeDay}` : ""}`)}
              aria-label="Go to Rooms"
              className={cn(
                "w-full text-left relative overflow-hidden text-black",
                "rounded-[26px] bg-[#fffdf8] px-4 py-3.5",
                "shadow-[0_10px_24px_rgba(30,27,24,0.06)]",
                "active:scale-[0.985] transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[18px] font-extrabold tracking-[-0.02em] text-black leading-none">
                    Rooms
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#584141] tabular-nums">
                    {metrics.stayTotal === 0
                      ? "No stay guests"
                      : stayRoomMetrics.unassignedGuests > 0
                        ? `${stayRoomMetrics.unassignedGuests} waiting · ${stayRoomMetrics.totalRooms} ${stayRoomMetrics.totalRooms === 1 ? "room" : "rooms"}`
                        : `${stayRoomMetrics.assignedGuests} mapped · ${stayRoomMetrics.totalRooms} ${stayRoomMetrics.totalRooms === 1 ? "room" : "rooms"}`}
                  </p>
                </div>
                <span className="h-9 w-9 rounded-full bg-[#feca43] grid place-items-center text-black shrink-0">
                  <Icon name="hotel" className="text-[18px]" />
                </span>
              </div>
            </button>
          </div>
        </div>
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
      </div>

      <div className="hidden lg:flex flex-1 min-h-0 p-0 lg:p-4 xl:p-5 bg-transparent lg:bg-surface-container-low relative overflow-hidden lg:overflow-hidden flex-col">
        <div className="hidden lg:block absolute inset-0 menu-cards-radial pointer-events-none" />
        <div className="relative z-10 min-h-0 flex flex-1 flex-col gap-2 overflow-hidden lg:h-full lg:gap-3">
          {guestListPane}
        </div>
      </div>

      {headcountOpen ? (
        <HeadcountSheet
          headTotal={metrics.headTotal}
          familyCount={metrics.familyCount}
          inviteSentTotal={metrics.inviteSentTotal}
          stayTotal={metrics.stayTotal}
          onClose={() => setHeadcountOpen(false)}
          onGuestList={() => {
            setHeadcountOpen(false);
            openGuestListSheet();
          }}
          onInvites={() => {
            setHeadcountOpen(false);
            go("/people/invites");
          }}
          onRooms={() => {
            setHeadcountOpen(false);
            navigate(`/people/rooms${activeDay ? `?day=${activeDay}` : ""}`);
          }}
        />
      ) : null}

      <GuestListSheet
        open={listSheetOpen}
        onClose={() => {
          setListSheetOpen(false);
          setExpandedId(null);
        }}
        guests={listGuests}
        dayLabel={dayLabel}
        toolbar={listToolbar}
      >
        {guestCards}
      </GuestListSheet>

      {/* Contact card portals itself — keep the row mounted whenever one is open */}
      {expandedId ? (
        <div className="fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden>
          {(() => {
            const row = state.guests.find((guest) => guest.id === expandedId);
            if (!row) return null;
            return (
              <GuestRowCard
                row={row}
                state={state}
                groups={groups}
                showGroupControls={false}
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

    </div>
  );
}

function HeadcountSheet({
  headTotal,
  familyCount,
  inviteSentTotal,
  stayTotal,
  onClose,
  onGuestList,
  onInvites,
  onRooms,
}: {
  headTotal: number;
  familyCount: number;
  inviteSentTotal: number;
  stayTotal: number;
  onClose: () => void;
  onGuestList: () => void;
  onInvites: () => void;
  onRooms: () => void;
}) {
  const titleId = useId();
  const families = familyCount || 0;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const rows = [
    {
      label: "Guest list",
      hint: `${headTotal} ${headTotal === 1 ? "person" : "people"} · ${families} ${families === 1 ? "family" : "families"}`,
      icon: "groups",
      onClick: onGuestList,
    },
    {
      label: "Invites",
      hint: inviteSentTotal === 1 ? "1 sent" : `${inviteSentTotal} sent`,
      icon: "mark_email_read",
      onClick: onInvites,
    },
    {
      label: "Rooms",
      hint: stayTotal === 0 ? "No stay guests" : stayTotal === 1 ? "1 needs a stay" : `${stayTotal} need a stay`,
      icon: "hotel",
      onClick: onRooms,
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 font-[Manrope,sans-serif]"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-t-[28px] bg-[#fff8f5] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_40px_rgba(30,27,24,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-[20px] font-extrabold tracking-[-0.03em] text-black">
            Headcount
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-[0_6px_16px_rgba(30,27,24,0.06)]"
            aria-label="Close"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={row.onClick}
              className="flex w-full items-center gap-3 rounded-[20px] bg-[#fffdf8] px-3.5 py-3 text-left text-black shadow-[0_10px_24px_rgba(30,27,24,0.06)] active:scale-[0.985]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#feca43]">
                <Icon name={row.icon} className="text-[20px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-extrabold leading-none tracking-[-0.02em]">{row.label}</span>
                <span className="mt-1 block text-[13px] font-semibold text-[#584141]">{row.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
