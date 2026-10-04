import { useEffect, useState } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import {
  DAY_BLOCK_KINDS,
  createDayBlock,
} from "../../domain/dayPlan";
import { PlacePickerSheet } from "./PlacePickerSheet";
import type { DayBlockKind, DayPlanBlock } from "../../domain/types";

type DayPlace = { label: string; mapsUrl?: string };

type DayBlockEditorSheetProps = {
  open: boolean;
  initial?: DayPlanBlock | null;
  /** Day-level place — used as default “leaving from” on new travel legs. */
  dayPlace?: DayPlace | null;
  onClose: () => void;
  onSave: (block: DayPlanBlock) => void;
  onDelete?: () => void;
};

type PickerTarget = "destination" | "from" | null;

export function DayBlockEditorSheet({
  open,
  initial,
  dayPlace = null,
  onClose,
  onSave,
  onDelete,
}: DayBlockEditorSheetProps) {
  const [title, setTitle] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [kind, setKind] = useState<DayBlockKind | undefined>(undefined);
  const [place, setPlace] = useState("");
  const [mapsUrl, setMapsUrl] = useState<string | undefined>(undefined);
  const [fromPlace, setFromPlace] = useState("");
  const [fromMapsUrl, setFromMapsUrl] = useState<string | undefined>(undefined);
  const [showFrom, setShowFrom] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  useEffect(() => {
    if (!open) return;
    const isNew = !initial;
    const destLabel = initial?.place || initial?.toPlace || "";

    setTitle(initial?.title || "");
    setTimeStart(initial?.timeStart || "");
    setKind(initial?.kind);
    setPlace(destLabel);
    setMapsUrl(initial?.mapsUrl);
    setFromPlace(initial?.fromPlace || (isNew ? dayPlace?.label || "" : ""));
    setFromMapsUrl(undefined);
    setShowFrom(Boolean(initial?.fromPlace) || Boolean(isNew && dayPlace?.label));
    setNotes(initial?.notes || "");
    setShowNotes(Boolean(initial?.notes));
    setPickerTarget(null);
  }, [open, initial, dayPlace?.label]);

  const setKindSafe = (next: DayBlockKind | undefined) => {
    setKind(next);
    if (next === "travel" && !initial && dayPlace?.label && !fromPlace) {
      setFromPlace(dayPlace.label);
      setShowFrom(true);
    }
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const isTravel = kind === "travel";
    const dest = place.trim();
    const base = createDayBlock({
      title: trimmed,
      kind,
      timeStart: timeStart || undefined,
      place: dest || undefined,
      mapsUrl: mapsUrl || undefined,
      fromPlace: isTravel ? fromPlace.trim() || undefined : undefined,
      toPlace: isTravel ? dest || undefined : undefined,
      notes: notes || undefined,
      order: initial?.order ?? 0,
    });
    onSave(initial ? { ...base, id: initial.id } : base);
    onClose();
  };

  const destinationLabel = kind === "travel" ? "Destination" : "Place";
  const pickerInitial =
    pickerTarget === "from"
      ? fromPlace
        ? { label: fromPlace, mapsUrl: fromMapsUrl }
        : dayPlace || null
      : place
        ? { label: place, mapsUrl }
        : null;

  return (
    <>
      <MobileSheet
        open={open}
        onClose={onClose}
        title={initial ? "Edit beat" : "Add a beat"}
        height="content"
        headerAction="back"
        zIndexClass="z-[85]"
        panelClassName="bg-[#fff8f5]"
      >
        <div className="space-y-4 px-4 pb-8">
          <label className="block">
            <span className="text-[13px] font-medium text-[#584141]">What happens</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                kind === "travel"
                  ? "Drive, flight, cab…"
                  : "Getting ready, dinner, stop…"
              }
              className="mt-2 h-12 w-full rounded-full bg-white px-4 text-[16px] font-semibold outline-none placeholder:text-[#b5a9a4]"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-[#584141]">Time</span>
            <input
              type="time"
              value={timeStart}
              onChange={(event) => setTimeStart(event.target.value)}
              className="mt-2 h-12 w-full rounded-full bg-white px-4 text-[16px] font-semibold outline-none"
            />
          </label>

          <div>
            <p className="text-[13px] font-medium text-[#584141]">Kind</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_BLOCK_KINDS.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    setKindSafe(kind === row.id ? undefined : row.id)
                  }
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold",
                    kind === row.id ? "bg-[#feca43] text-black" : "bg-white text-[#584141]",
                  )}
                >
                  <Icon name={row.icon} className="text-[16px]" />
                  {row.label}
                </button>
              ))}
            </div>
          </div>

          {kind === "travel" && showFrom ? (
            <div className="flex w-full items-center gap-2 rounded-[22px] bg-white px-2 py-2">
              <button
                type="button"
                onClick={() => setPickerTarget("from")}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-2 py-2 text-left"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff8f5] text-[#584141]">
                  <Icon name="trip_origin" className="text-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[#584141]">Leaving from</span>
                  <span className="mt-0.5 block text-[15px] font-semibold text-black">
                    {fromPlace || "Find on map"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Clear leaving from"
                onClick={() => {
                  setFromPlace("");
                  setFromMapsUrl(undefined);
                  setShowFrom(false);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#584141]"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
          ) : kind === "travel" ? (
            <button
              type="button"
              onClick={() => {
                if (dayPlace?.label && !fromPlace) {
                  setFromPlace(dayPlace.label);
                }
                setShowFrom(true);
              }}
              className="text-[14px] font-semibold text-[#584141]"
            >
              {dayPlace?.label ? `+ Leaving from ${dayPlace.label}` : "+ Leaving from…"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setPickerTarget("destination")}
            className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-3.5 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff8f5] text-[#584141]">
              <Icon
                name={kind === "travel" ? "flag" : place ? "location_on" : "map"}
                className="text-[18px]"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[#584141]">
                {destinationLabel}
              </span>
              <span className="mt-0.5 block text-[15px] font-semibold text-black">
                {place || "Find on map"}
              </span>
            </span>
            <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
          </button>

          {showNotes ? (
            <label className="block">
              <span className="text-[13px] font-medium text-[#584141]">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Anything the team should know"
                className="mt-2 w-full resize-none rounded-[20px] bg-white px-4 py-3 text-[14px] font-medium outline-none"
              />
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="block text-[14px] font-semibold text-[#584141]"
            >
              + Add notes
            </button>
          )}

          <button
            type="button"
            disabled={!title.trim()}
            onClick={save}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#feca43] text-[15px] font-extrabold text-black disabled:opacity-40"
          >
            {initial ? "Save beat" : "Add beat"}
          </button>

          {initial && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="h-11 w-full text-[14px] font-semibold text-[#584141]"
            >
              Remove beat
            </button>
          ) : null}
        </div>
      </MobileSheet>

      <PlacePickerSheet
        open={pickerTarget != null}
        initial={pickerInitial}
        onClose={() => setPickerTarget(null)}
        onDone={(picked) => {
          if (pickerTarget === "from") {
            setFromPlace(picked.label);
            setFromMapsUrl(picked.mapsUrl);
            setShowFrom(true);
          } else {
            setPlace(picked.label);
            setMapsUrl(picked.mapsUrl);
          }
        }}
        onClear={() => {
          if (pickerTarget === "from") {
            setFromPlace("");
            setFromMapsUrl(undefined);
            setShowFrom(false);
          } else {
            setPlace("");
            setMapsUrl(undefined);
          }
        }}
        zIndexClass="z-[95]"
      />
    </>
  );
}
