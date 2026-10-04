import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyWeddingSchedule,
  buildFunctionScheduleDraft,
  isRealEventDate,
  resolveDayName,
  type FunctionScheduleDraft,
} from "../../domain/functions";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { MobileSheet } from "../ui/MobileSheet";
import { MAX_MOBILE_EVENTS } from "../ui/MobileEventButtons";
import { cn } from "../../design-system/cn";
import { EventDayCalendar, type CalendarMark } from "./EventDayCalendar";
import { BigDayPreview } from "./BigDayPreview";
import { HostSignOut } from "../access/HostSignOut";

type WeddingScheduleModalProps = {
  open: boolean;
  onClose: () => void;
};

const BANDS = ["peach", "sky", "mint", "gold", "blush", "sand"] as const;

function nextDraftId(fns: FunctionScheduleDraft[]): number {
  const used = new Set(fns.map((fn) => fn.id));
  let nextId = 1;
  while (used.has(nextId)) nextId += 1;
  return nextId;
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayAfter(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  date.setDate(date.getDate() + 1);
  return toLocalIso(date);
}

function cleanDate(iso: string | undefined | null): string {
  return isRealEventDate(iso) ? String(iso).trim() : "";
}

function monthFromIso(iso: string): Date {
  const clean = cleanDate(iso);
  const date = clean ? new Date(`${clean}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sortDraft(a: FunctionScheduleDraft, b: FunctionScheduleDraft): number {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date.localeCompare(b.date);
}

function fixtureParts(iso: string) {
  if (!cleanDate(iso)) {
    return { day: "—", weekday: "SET", month: "DATE", monthLong: "Pick a day" };
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { day: "—", weekday: "SET", month: "DATE", monthLong: "Pick a day" };
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    monthLong: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
  };
}

export function WeddingScheduleModal({ open, onClose }: WeddingScheduleModalProps) {
  const { state, saveState, showToast, scheduleFocusId } = useWeddingState();
  const { canEdit } = useAccess();

  const [startDate, setStartDate] = useState(cleanDate(state.event.startDate));
  const [functions, setFunctions] = useState<FunctionScheduleDraft[]>(() =>
    buildFunctionScheduleDraft(state),
  );
  const [pickingId, setPickingId] = useState<number | null>(null);
  const [pendingAdd, setPendingAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [month, setMonth] = useState(() => monthFromIso(cleanDate(state.event.startDate)));
  const stateRef = useRef(state);
  const focusRef = useRef(scheduleFocusId);
  stateRef.current = state;
  focusRef.current = scheduleFocusId;

  useEffect(() => {
    if (!open) {
      setPickingId(null);
      setPendingAdd(false);
      setNewName("");
      setDraftDate("");
      return;
    }
    const current = stateRef.current;
    const draft = buildFunctionScheduleDraft(current);
    const focus = focusRef.current;
    const focused = focus != null && focus > 0 ? draft.find((fn) => fn.id === focus) : null;
    const lastDate =
      [...draft].reverse().find((fn) => cleanDate(fn.date))?.date ||
      cleanDate(current.event.startDate);
    const wantsAdd = focus === -1;
    const addDate = wantsAdd && lastDate ? dayAfter(lastDate) : "";
    setStartDate(cleanDate(current.event.startDate));
    setFunctions(draft);
    setPickingId(focused ? focused.id : null);
    setPendingAdd(wantsAdd || (draft.length === 0 && canEdit));
    setNewName("");
    setDraftDate(addDate);
    setMonth(
      monthFromIso(
        cleanDate(focused?.date) || addDate || cleanDate(current.event.startDate) || "",
      ),
    );
  }, [open, canEdit]);

  const pickingFn = functions.find((fn) => fn.id === pickingId) || null;
  const picking = Boolean(pickingFn || pendingAdd);
  const selectedIso = pendingAdd ? draftDate : pickingFn?.date || "";
  const eventTitle = pendingAdd
    ? newName.trim() || "New day"
    : pickingFn
      ? pickingFn.name || resolveDayName(state, pickingFn.id)
      : "Big day";
  const hasDatedDay = functions.some((fn) => cleanDate(fn.date));
  const canAddDay = canEdit && functions.length < MAX_MOBILE_EVENTS;

  const marks: CalendarMark[] = useMemo(
    () =>
      functions
        .filter((fn) => cleanDate(fn.date) && fn.id !== pickingId)
        .map((fn) => ({
          iso: fn.date,
          label: fn.name || resolveDayName(state, fn.id),
        })),
    [functions, pickingId, state],
  );

  if (!open) return null;

  const applyPickedDate = (iso: string) => {
    if (pendingAdd) {
      setDraftDate(iso);
      return;
    }
    if (!pickingFn) return;
    if (!cleanDate(startDate) || iso < startDate) setStartDate(iso);
    setFunctions((current) =>
      current.map((fn) => (fn.id === pickingFn.id ? { ...fn, date: iso } : fn)),
    );
  };

  const confirmPickedDate = () => {
    if (!selectedIso) {
      showToast("Pick a day on the calendar");
      return;
    }
    if (pendingAdd) {
      const name = newName.trim();
      if (!name) {
        showToast("Enter an event name");
        return;
      }
      if (functions.length >= MAX_MOBILE_EVENTS) {
        showToast(`Maximum ${MAX_MOBILE_EVENTS} events`);
        return;
      }
      if (!cleanDate(startDate) || selectedIso < startDate) setStartDate(selectedIso);
      setFunctions((current) =>
        [...current, { id: nextDraftId(current), name, date: selectedIso, custom: true }].sort(
          sortDraft,
        ),
      );
      setPendingAdd(false);
      setNewName("");
      setDraftDate("");
      return;
    }
    setPickingId(null);
  };

  const handleSave = () => {
    if (!canEdit) {
      showToast("You don't have permission to edit dates");
      return;
    }
    if (!functions.length) {
      saveState(applyWeddingSchedule(state, "", []));
      showToast("Dates cleared");
      onClose();
      return;
    }
    const missing = functions.find((fn) => !cleanDate(fn.date) || !fn.name.trim());
    if (missing) {
      showToast(
        !missing.name.trim()
          ? "Name every event day"
          : `Set a date for ${missing.name || resolveDayName(state, missing.id)}`,
      );
      return;
    }
    const effectiveStart =
      cleanDate(startDate) ||
      cleanDate([...functions].sort(sortDraft)[0]?.date);
    if (!effectiveStart) {
      showToast("Pick when celebrations begin");
      return;
    }
    saveState(applyWeddingSchedule(state, effectiveStart, functions));
    showToast("Event dates saved");
    onClose();
  };

  const openEvent = (id: number) => {
    const fn = functions.find((row) => row.id === id);
    setPickingId(id);
    setPendingAdd(false);
    setMonth(monthFromIso(cleanDate(fn?.date) || cleanDate(startDate)));
  };

  const startAddDay = () => {
    const last =
      [...functions].reverse().find((fn) => cleanDate(fn.date))?.date || cleanDate(startDate);
    setPendingAdd(true);
    setPickingId(null);
    setDraftDate(last ? dayAfter(last) : "");
    setMonth(monthFromIso(last));
    setNewName("");
  };

  const closeOrBack = () => {
    if (picking) {
      if (pendingAdd && functions.length === 0) {
        onClose();
        return;
      }
      setPickingId(null);
      setPendingAdd(false);
      return;
    }
    onClose();
  };

  const removePickedDay = () => {
    if (!canEdit || !pickingFn || pendingAdd) return;
    const name = pickingFn.name || resolveDayName(state, pickingFn.id);
    const next = functions.filter((fn) => fn.id !== pickingFn.id);
    const nextStart =
      [...next].filter((fn) => cleanDate(fn.date)).sort(sortDraft)[0]?.date || "";
    setFunctions(next);
    setStartDate(nextStart);
    setPickingId(null);
    showToast(`Removed ${name}`);
  };

  const selectedParts = fixtureParts(selectedIso);

  return (
    <MobileSheet
      open={open}
      onClose={closeOrBack}
      title={picking ? "Set the day" : "The big days"}
      height="full"
      headerAction={picking ? "back" : "close"}
      headerExtra={<HostSignOut />}
      zIndexClass="z-[85]"
      panelClassName="bg-[#fff8f5] wedding-dates-sheet !bg-[#fff8f5]"
      bodyClassName="overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col">
        {picking ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="big-day-hero shrink-0 px-4 pt-1 pb-3">
              <p className="big-day-hero__kicker">Your event</p>
              <h3 className="big-day-hero__title">
                <span>The</span>
                <span>{eventTitle}</span>
                <span>day</span>
              </h3>
            </div>

            {pendingAdd ? (
              <label className="shrink-0 px-4 pb-3">
                <span className="sr-only">Event name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Dinner, Launch, Day 1…"
                  autoFocus
                  className="big-day-name"
                />
              </label>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
              <EventDayCalendar
                month={month}
                selected={selectedIso}
                marks={marks}
                onMonthChange={setMonth}
                onSelect={applyPickedDate}
              />
              <div className="big-day-kick">
                <p className="big-day-kick__time">{selectedParts.day}</p>
                <div>
                  <p className="big-day-kick__event">{eventTitle}</p>
                  <p className="big-day-kick__meta">{selectedParts.monthLong}</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 space-y-2 px-4 py-3 border-t border-[rgba(87,0,19,0.08)]">
              <button
                type="button"
                onClick={confirmPickedDate}
                disabled={!canEdit}
                className="big-day-cta"
              >
                {pendingAdd ? "Add this day" : "Set this day"}
              </button>
              {!pendingAdd && pickingFn && canEdit ? (
                <button
                  type="button"
                  onClick={removePickedDay}
                  className="h-11 w-full rounded-full text-[13px] font-extrabold text-[#9a3b2f] active:scale-[0.98]"
                >
                  Remove this day
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="big-day-hero shrink-0 px-4 pt-1 pb-3">
              <p className="big-day-hero__kicker">Your event</p>
              <h3 className="big-day-hero__title">
                <span>The</span>
                <span>big</span>
                <span>days</span>
              </h3>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="big-day-list">
                {functions.map((fn, index) => {
                  const name = fn.name || resolveDayName(state, fn.id);
                  const parts = fixtureParts(fn.date);
                  return (
                    <button
                      key={fn.id}
                      type="button"
                      data-testid={`big-day-row-${fn.id}`}
                      className={cn("big-day-row", `is-${BANDS[index % BANDS.length]}`)}
                      onClick={() => openEvent(fn.id)}
                    >
                      <span className="big-day-row__kick">
                        <span className="big-day-row__day">{parts.day}</span>
                        <span className="big-day-row__mon">{parts.month}</span>
                      </span>
                      <span className="big-day-row__body">
                        <span className="big-day-row__name">{name}</span>
                        <span className="big-day-row__sub">{parts.monthLong}</span>
                      </span>
                      <span className="big-day-row__side">{parts.weekday}</span>
                    </button>
                  );
                })}
              </div>

              {canAddDay ? (
                <button type="button" className="big-day-add" onClick={startAddDay}>
                  {hasDatedDay ? "+ Add another day" : "+ Add a day"}
                </button>
              ) : null}

              <BigDayPreview
                functions={functions}
                nameOf={(fn) => fn.name || resolveDayName(state, fn.id)}
              />
            </div>

            <div className="shrink-0 flex items-center gap-3 border-t border-[rgba(87,0,19,0.08)] bg-[#fff8f5] px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-full text-[13px] font-extrabold text-[#7a6f62] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canEdit}
                className="h-11 flex-[1.4] rounded-full bg-[#1a100c] text-white text-[13px] font-extrabold active:scale-[0.98] disabled:opacity-45"
              >
                {functions.length ? "Save dates" : "Clear dates"}
              </button>
            </div>
          </>
        )}
      </div>
    </MobileSheet>
  );
}
