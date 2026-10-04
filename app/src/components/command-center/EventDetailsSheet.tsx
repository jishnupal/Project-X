import { useEffect, useMemo, useState } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { WeekFeel } from "../wedding/BigDayPreview";
import { DayBlockEditorSheet } from "../wedding/DayBlockEditorSheet";
import { PlacePickerSheet } from "../wedding/PlacePickerSheet";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { isRealEventDate, type FunctionScheduleDraft } from "../../domain/functions";
import {
  blockKindMeta,
  dayFeelLine,
  formatBeatTime,
  getDayPlan,
  upsertDayPlan,
} from "../../domain/dayPlan";
import { openMapsUrl, resolveMapsUrl } from "../../domain/maps";
import type { PickedPlace } from "../../domain/placeSearch";
import type { DayPlanBlock, WeddingState } from "../../domain/types";

type EventDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  dateLine: string;
  functions: FunctionScheduleDraft[];
  nameOf: (fn: FunctionScheduleDraft) => string;
  state: WeddingState;
  onChangeState: (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => void;
  onOpenDates: () => void;
};

function dayLabel(fn: FunctionScheduleDraft): string {
  if (!isRealEventDate(fn.date)) return "";
  const date = new Date(`${fn.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function DayItineraryBody({
  day,
  dayIndex,
  dayTotal,
  title,
  plan,
  onOpenPlacePicker,
  onAddBeat,
  onEditBeat,
}: {
  day: FunctionScheduleDraft;
  dayIndex: number;
  dayTotal: number;
  title: string;
  plan: ReturnType<typeof getDayPlan>;
  onOpenPlacePicker: () => void;
  onAddBeat: () => void;
  onEditBeat: (block: DayPlanBlock) => void;
}) {
  const dayMapHref = resolveMapsUrl(plan.place?.mapsUrl, plan.place?.label);

  return (
    <div className="space-y-3 px-1 pb-10 pt-2 text-black">
      <div className="px-1">
        <p className="text-[13px] font-bold tracking-[0.08em] text-[#584141]">ITINERARY</p>
        <h3 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em]">{title}</h3>
        <p className="mt-1 text-[14px] font-medium text-[#584141]">
          {dayLabel(day)}
          {dayIndex >= 0 ? ` · ${dayFeelLine(dayIndex, dayTotal)}` : ""}
        </p>
      </div>

      {plan.place?.label ? (
        <div className="rounded-[22px] bg-[#fffdf8] px-4 py-3">
          <button type="button" onClick={onOpenPlacePicker} className="flex w-full items-start gap-3 text-left">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff8f5] text-[#584141]">
              <Icon name="location_on" className="text-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-[#584141]">Place</span>
              <span className="mt-0.5 block text-[15px] font-semibold text-black">{plan.place.label}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-[#584141]">
                <Icon name="map" className="text-[16px]" />
                Find on map
              </span>
            </span>
            <Icon name="chevron_right" className="mt-1 text-[18px] text-[#584141]" />
          </button>
          {dayMapHref ? (
            <button
              type="button"
              onClick={() => openMapsUrl(dayMapHref)}
              className="mt-2 px-1 text-[13px] font-semibold text-[#584141]"
            >
              Open in Maps
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPlacePicker}
          className="flex w-full items-center gap-3 rounded-[22px] bg-[#fffdf8] px-4 py-3.5 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff8f5] text-[#584141]">
            <Icon name="map" className="text-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-black">Place</span>
            <span className="mt-0.5 block text-[13px] font-medium text-[#584141]">
              Find on map and tag it here
            </span>
          </span>
          <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
        </button>
      )}

      {plan.blocks.length === 0 ? (
        <div className="rounded-[22px] bg-[#fffdf8] px-4 py-10 text-center">
          <p className="text-[20px] font-extrabold tracking-[-0.03em]">No plan yet</p>
          <p className="mt-2 text-[14px] font-medium text-[#584141]">
            Add the first beat for this day.
          </p>
          <button
            type="button"
            onClick={onAddBeat}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#feca43] px-5 text-[15px] font-semibold text-black"
          >
            Add a beat
          </button>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[22px] bg-[#fffdf8]">
          {plan.blocks.map((block) => {
            const meta = blockKindMeta(block.kind);
            const placeLine =
              block.kind === "travel"
                ? [block.fromPlace, block.place || block.toPlace].filter(Boolean).join(" → ")
                : block.place;
            const mapHref = resolveMapsUrl(block.mapsUrl, block.place);
            return (
              <li key={block.id} className="border-t border-[#ece7e2] first:border-t-0">
                <div className="flex w-full items-start gap-2 px-3.5 py-3.5">
                  <button
                    type="button"
                    onClick={() => onEditBeat(block)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left active:opacity-80"
                  >
                    <span className="w-14 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums text-[#584141]">
                      {formatBeatTime(block.timeStart) || "—"}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff8f5] text-[#584141]",
                      )}
                    >
                      <Icon name={meta.icon} className="text-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold text-black">{block.title}</span>
                      {placeLine ? (
                        <span className="mt-0.5 block text-[13px] font-medium text-[#584141]">
                          {placeLine}
                        </span>
                      ) : null}
                      {block.notes ? (
                        <span className="mt-0.5 block text-[12px] font-medium text-[#b5a9a4]">
                          {block.notes}
                        </span>
                      ) : null}
                    </span>
                    <Icon name="chevron_right" className="mt-1 text-[18px] text-[#584141]" />
                  </button>
                  {mapHref ? (
                    <button
                      type="button"
                      aria-label="Open map"
                      onClick={() => openMapsUrl(mapHref)}
                      className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff8f5] text-[#584141]"
                    >
                      <Icon name="map" className="text-[18px]" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {plan.blocks.length > 0 ? (
        <button
          type="button"
          onClick={onAddBeat}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#feca43] text-[15px] font-extrabold text-black"
        >
          <Icon name="add" className="text-[18px]" />
          Add a beat
        </button>
      ) : null}
    </div>
  );
}

export function EventDetailsSheet({
  open,
  onClose,
  eventName,
  dateLine,
  functions,
  nameOf,
  state,
  onChangeState,
  onOpenDates,
}: EventDetailsSheetProps) {
  const dated = useMemo(
    () =>
      functions
        .filter((fn) => isRealEventDate(fn.date) && fn.name?.trim())
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [functions],
  );

  const oneDay = dated.length === 1;
  const [daySheetId, setDaySheetId] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<DayPlanBlock | null | undefined>(undefined);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDaySheetId(null);
      setEditingBlock(undefined);
      setPlacePickerOpen(false);
      return;
    }
    if (oneDay && dated[0]) {
      setDaySheetId(null);
    }
  }, [open, oneDay, dated]);

  const activeDayId = oneDay ? dated[0]?.id ?? null : daySheetId;
  const selected = dated.find((fn) => fn.id === activeDayId) || null;
  const selectedIndex = selected ? dated.findIndex((fn) => fn.id === selected.id) : -1;
  const plan = selected ? getDayPlan(state, selected.id) : null;
  const daySheetOpen = !oneDay && daySheetId != null && Boolean(selected && plan);

  const savePickedPlace = (picked: PickedPlace | null) => {
    if (!selected) return;
    onChangeState((prev) => {
      const current = getDayPlan(prev, selected.id);
      return upsertDayPlan(prev, {
        dayId: selected.id,
        place: picked ? { label: picked.label, mapsUrl: picked.mapsUrl } : undefined,
        blocks: current.blocks,
      });
    });
  };

  const itineraryProps =
    selected && plan
      ? {
          day: selected,
          dayIndex: selectedIndex,
          dayTotal: dated.length,
          title: nameOf(selected),
          plan,
          onOpenPlacePicker: () => setPlacePickerOpen(true),
          onAddBeat: () => setEditingBlock(null),
          onEditBeat: (block: DayPlanBlock) => setEditingBlock(block),
        }
      : null;

  return (
    <>
      <MobileSheet
        open={open}
        onClose={onClose}
        title="The Plot"
        height="full"
        headerAction="back"
        panelClassName="bg-[#fff8f5]"
        bodyClassName="overflow-y-auto"
      >
        <div className="space-y-6 px-1 pb-10 pt-2 text-black">
          <header>
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">{eventName}</h2>
            {dateLine ? (
              <p className="mt-2 text-[15px] font-medium text-[#584141]">{dateLine}</p>
            ) : (
              <p className="mt-2 text-[15px] font-medium text-[#584141]">Itinerary still open</p>
            )}
            {state.destination?.label ? (
              <p className="mt-1 text-[13px] font-semibold text-[#584141]">
                {state.destination.label}
              </p>
            ) : null}
          </header>

          {!dated.length ? (
            <div className="rounded-[22px] bg-[#fffdf8] px-4 py-8 text-center">
              <p className="text-[18px] font-extrabold tracking-[-0.03em]">No days yet</p>
              <p className="mt-2 text-[14px] font-medium text-[#584141]">
                Add your days on Dates — a weekend, a trip, a night out.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDates();
                }}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#feca43] px-5 text-[15px] font-semibold text-black"
              >
                Open Dates
              </button>
            </div>
          ) : oneDay && itineraryProps ? (
            <DayItineraryBody {...itineraryProps} />
          ) : (
            <section>
              <p className="px-1 text-[13px] font-bold tracking-[0.08em] text-[#584141]">
                THE LINEUP
              </p>
              <p className="mt-1 px-1 text-[14px] font-medium text-[#584141]">
                Tap a day to open its itinerary.
              </p>
              <div className="mt-2">
                <WeekFeel
                  functions={dated}
                  nameOf={nameOf}
                  selectedId={daySheetId}
                  onOpen={(id) => setDaySheetId(id)}
                />
              </div>
            </section>
          )}
        </div>
      </MobileSheet>

      <MobileSheet
        open={daySheetOpen}
        onClose={() => setDaySheetId(null)}
        title={selected ? nameOf(selected) : "Itinerary"}
        height="full"
        headerAction="back"
        zIndexClass="z-[80]"
        panelClassName="bg-[#fff8f5]"
        bodyClassName="overflow-y-auto"
      >
        {itineraryProps && !oneDay ? <DayItineraryBody {...itineraryProps} /> : null}
      </MobileSheet>

      <PlacePickerSheet
        open={placePickerOpen}
        initial={plan?.place || null}
        onClose={() => setPlacePickerOpen(false)}
        onDone={(picked) => savePickedPlace(picked)}
        onClear={() => savePickedPlace(null)}
      />

      <DayBlockEditorSheet
        open={editingBlock !== undefined}
        initial={editingBlock || null}
        dayPlace={plan?.place || null}
        onClose={() => setEditingBlock(undefined)}
        onSave={(block) => {
          if (!selected) return;
          onChangeState((prev) => {
            const current = getDayPlan(prev, selected.id);
            const exists = current.blocks.some((row) => row.id === block.id);
            const nextBlocks = exists
              ? current.blocks.map((row) => (row.id === block.id ? block : row))
              : [...current.blocks, block];
            return upsertDayPlan(prev, {
              dayId: selected.id,
              place: current.place,
              blocks: nextBlocks,
            });
          });
        }}
        onDelete={
          editingBlock
            ? () => {
                if (!selected) return;
                onChangeState((prev) => {
                  const current = getDayPlan(prev, selected.id);
                  return upsertDayPlan(prev, {
                    dayId: selected.id,
                    place: current.place,
                    blocks: current.blocks.filter((row) => row.id !== editingBlock.id),
                  });
                });
              }
            : undefined
        }
      />
    </>
  );
}
