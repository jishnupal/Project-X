import { useState } from "react";
import { createPortal } from "react-dom";
import {
  applyFieldCountChange,
  applyStayToggle,
  assignGuestToGroup,
  parseCount,
  suggestGroupHeadcount,
} from "../../domain/guest";
import { functionIds, resolveDayName } from "../../domain/functions";
import type { GuestGroup, GuestRow, WeddingState } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { GroupHeadcountConfirm } from "./GroupHeadcountConfirm";

type GuestRowCardProps = {
  row: GuestRow;
  state: WeddingState;
  groups: GuestGroup[];
  showGroupControls: boolean;
  readOnly?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (row: GuestRow) => void;
  onDelete: () => void;
};

type CountField =
  | "count"
  | "sangeetCount"
  | "biyebariCount"
  | "borjatriCount"
  | "receptionCount"
  | "stayCount";

const DAY_COUNT_FIELD: Record<number, CountField> = {
  1: "sangeetCount",
  2: "biyebariCount",
  3: "receptionCount",
  4: "borjatriCount",
};

const DAY_ICON: Record<number, string> = {
  1: "music_note",
  2: "favorite",
  3: "celebration",
  4: "event",
};

function eventCountFields(state: WeddingState): Array<{
  field: CountField;
  label: string;
  icon: string;
  day: number;
}> {
  return functionIds(state)
    .map((day) => {
      const field = DAY_COUNT_FIELD[day];
      if (!field) return null;
      return {
        day,
        field,
        label: resolveDayName(state, day),
        icon: DAY_ICON[day] || "event",
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function fieldValue(row: GuestRow, field: CountField): number {
  if (field === "receptionCount") return parseCount(row.receptionCount || row.count);
  return parseCount(row[field]);
}

function MiniStepper({
  label,
  value,
  min,
  max,
  onChange,
  icon,
  priority = false,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  onChange: (next: number) => void;
  icon?: string;
  priority?: boolean;
}) {
  const limit = max ?? Infinity;
  const step = (delta: number) => onChange(Math.max(min, Math.min(limit, value + delta)));

  return (
    <div
      className={cn(
        "rounded-2xl border min-w-0",
        priority
          ? "border-[rgba(128,0,32,0.2)] bg-gradient-to-br from-white to-[#f8ecef] px-4 py-3 shadow-[0_10px_24px_-14px_rgba(128,0,32,0.35)]"
          : "border-[rgba(128,0,32,0.1)] bg-white px-3 py-2.5",
      )}
    >
      <div className="flex items-center gap-1.5 mb-2 min-w-0">
        {icon ? (
          <Icon
            name={icon}
            className={cn("text-primary shrink-0", priority ? "text-[18px]" : "text-[15px]")}
          />
        ) : null}
        <p
          className={cn(
            "font-label-caps tracking-[0.12em] text-primary truncate",
            priority ? "text-[10px]" : "text-[9px]",
          )}
        >
          {label}
        </p>
        {priority ? (
          <span className="ml-auto font-label-caps text-[8px] tracking-[0.14em] text-primary/45">
            Primary
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className={cn(
            "rounded-full bg-[#f6e4e8] text-primary flex items-center justify-center disabled:opacity-35 active:scale-95 transition-transform",
            priority ? "h-10 w-10" : "h-8 w-8",
          )}
        >
          <Icon name="remove" className={priority ? "text-[18px]" : "text-[16px]"} />
        </button>
        <span
          className={cn(
            "font-headline-md text-primary tabular-nums leading-none",
            priority ? "text-[28px]" : "text-[20px]",
          )}
        >
          {String(value).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= limit}
          aria-label={`Increase ${label}`}
          className={cn(
            "rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-35 active:scale-95 transition-transform shadow-sm",
            priority ? "h-10 w-10" : "h-8 w-8",
          )}
        >
          <Icon name="add" className={priority ? "text-[18px]" : "text-[16px]"} />
        </button>
      </div>
    </div>
  );
}

export function GuestRowCard({
  row,
  state,
  groups,
  showGroupControls,
  readOnly = false,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: GuestRowCardProps) {
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [adjustingHeadcount, setAdjustingHeadcount] = useState(false);
  const memberCount = parseCount(row.count);
  const stayCount = parseCount(row.stayCount || row.count);
  const groupName = groups.find((group) => group.id === row.groupId)?.name;
  const pendingGroup = groups.find((group) => group.id === pendingGroupId);
  const eventFields = eventCountFields(state);
  /** Event / stay counters are capped by Total. Total itself can always reduce to 1. */
  const otherMax = memberCount;
  const inGroupPartial =
    Boolean(row.groupId) &&
    parseCount(row.groupCount) > 0 &&
    parseCount(row.groupCount) < memberCount;

  const setCount = (field: CountField, value: number) => {
    if (field === "count" || field === "receptionCount") {
      // Total ↔ Reception stay linked; min 1.
      onUpdate(applyFieldCountChange(row, field, String(Math.max(1, value))));
      return;
    }
    onUpdate(applyFieldCountChange(row, field, String(Math.max(0, Math.min(otherMax, value)))));
  };

  const onGroupSelect = (nextGroupId: string) => {
    if (!nextGroupId) {
      onUpdate(assignGuestToGroup(row, ""));
      return;
    }
    if (memberCount <= 1) {
      onUpdate(assignGuestToGroup(row, nextGroupId, 1));
      return;
    }
    setPendingGroupId(nextGroupId);
  };

  const cardBody = (
    <>
      <div className="min-w-0 flex-1">
        <h4 className="font-headline-md text-[15px] lg:text-[16px] leading-[1.25] text-primary truncate">
          {row.name || "Guest not set"}
        </h4>
        <p className="text-[11px] lg:font-label-caps lg:text-[10px] lg:tracking-[0.12em] text-secondary/80 mt-0.5 truncate">
          {memberCount} {memberCount === 1 ? "guest" : "guests"}
          {showGroupControls && groupName
            ? ` · ${groupName}${
                inGroupPartial
                  ? ` (${parseCount(row.groupCount)} of ${memberCount})`
                  : ""
              }`
            : ""}
          {row.needsStay ? ` · Stay ${stayCount}` : ""}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[11px] lg:font-label-caps lg:text-[9px] lg:tracking-[0.12em]",
          row.invitationSent ? "text-emerald-700" : "text-secondary",
        )}
      >
        {row.invitationSent ? "Sent" : "Pending"}
      </span>
      {!readOnly ? (
        <Icon name="chevron_right" className="text-[18px] text-primary/35 shrink-0" />
      ) : null}
    </>
  );

  return (
    <>
      <article
        className={cn(
          "guest-row-card mini-meal-card relative z-[1] h-auto overflow-hidden rounded-xl",
          "min-h-[56px] lg:min-h-[72px] lg:p-0",
        )}
      >
        {readOnly ? (
          <div className="relative z-[1] w-full px-3.5 py-3 lg:py-3 flex items-center gap-2.5 text-left min-h-[56px] lg:min-h-0">
            {cardBody}
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="relative z-[1] w-full px-3.5 py-3 flex items-center gap-2.5 text-left min-h-[56px] lg:min-h-0 active:bg-[rgba(128,0,32,0.04)] lg:active:bg-transparent"
          >
            {cardBody}
          </button>
        )}
      </article>

      {!readOnly && pendingGroup ? (
        <GroupHeadcountConfirm
          row={row}
          groupName={pendingGroup.name}
          onCancel={() => setPendingGroupId(null)}
          onConfirm={(people) => {
            onUpdate(assignGuestToGroup(row, pendingGroup.id, people));
            setPendingGroupId(null);
          }}
        />
      ) : null}

      {adjustingHeadcount && row.groupId && groupName ? (
        <GroupHeadcountConfirm
          row={row}
          groupName={groupName}
          initialPeople={parseCount(row.groupCount) || suggestGroupHeadcount(row)}
          confirmLabel="Save"
          onCancel={() => setAdjustingHeadcount(false)}
          onConfirm={(people) => {
            onUpdate(assignGuestToGroup(row, row.groupId, people));
            setAdjustingHeadcount(false);
          }}
        />
      ) : null}

      {!readOnly && expanded
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-5 add-guest-backdrop"
              role="dialog"
              aria-modal
              aria-labelledby={`guest-edit-${row.id}`}
              onClick={onToggle}
            >
              <div
                className={cn(
                  "guest-edit-sheet w-full overflow-hidden flex flex-col",
                  "max-lg:max-w-[420px] max-lg:h-[min(72dvh,560px)] max-lg:max-h-[72dvh]",
                  "max-lg:rounded-t-[24px] max-lg:border max-lg:border-[rgba(128,0,32,0.14)] max-lg:border-b-0",
                  "sm:max-w-[920px] sm:max-h-[min(78vh,640px)] sm:rounded-[24px] sm:border sm:border-[rgba(204,167,48,0.28)]",
                  "bg-[#faf6f0] shadow-[0_-18px_48px_-16px_rgba(87,0,19,0.32)] sm:shadow-2xl",
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="sm:hidden shrink-0 flex justify-center pt-2.5 pb-0.5" aria-hidden>
                  <span className="h-1 w-9 rounded-full bg-[rgba(128,0,32,0.18)]" />
                </div>

                <div className="shrink-0 px-4 sm:px-5 pt-2 sm:pt-5 pb-2.5 sm:pb-3 flex items-start gap-3 border-b border-[rgba(128,0,32,0.08)] bg-[#faf6f0]">
                  <div className="min-w-0 flex-1">
                    <p className="font-label-caps text-[9px] tracking-[0.18em] text-primary/55">
                      Edit guest
                    </p>
                    <h2
                      id={`guest-edit-${row.id}`}
                      className="font-headline-md text-primary text-[17px] sm:text-[18px] leading-tight truncate mt-0.5"
                    >
                      {row.name || "Guest not set"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onToggle}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-primary/55 hover:text-primary hover:bg-[rgba(128,0,32,0.06)] flex items-center justify-center shrink-0"
                    aria-label="Close"
                  >
                    <Icon name="close" className="text-[20px] sm:text-[22px]" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <div className="grid md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.4fr)] min-h-0">
                    <aside className="relative px-4 sm:px-5 pt-3 pb-3 sm:pt-5 sm:pb-5 border-b md:border-b-0 md:border-r border-[rgba(128,0,32,0.08)] bg-gradient-to-br from-[#fffaf5] to-[#f6e8ea]">
                      <label className="block">
                        <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                          Guest name
                        </span>
                        <input
                          value={row.name}
                          onChange={(e) => onUpdate({ ...row, name: e.target.value })}
                          placeholder="Family name"
                          autoComplete="off"
                          className="mt-1.5 w-full h-10 sm:h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 font-headline-md text-primary text-[16px] sm:text-[17px] outline-none focus:border-[#cca730] focus:shadow-[0_0_0_3px_rgba(204,167,48,0.18)]"
                        />
                      </label>

                      {showGroupControls && groups.length ? (
                        <div className="mt-3 sm:mt-4 space-y-2">
                          <label className="block">
                            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                              Group
                            </span>
                            <select
                              value={row.groupId || ""}
                              onChange={(e) => onGroupSelect(e.target.value)}
                              className="mt-1.5 w-full h-9 sm:h-10 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3 text-sm outline-none focus:border-[#cca730]"
                            >
                              <option value="">Unassigned</option>
                              {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          {row.groupId && memberCount > 1 ? (
                            <button
                              type="button"
                              onClick={() => setAdjustingHeadcount(true)}
                              className="w-full h-9 sm:h-10 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3 flex items-center justify-between text-left"
                            >
                              <span className="text-[12px] text-secondary">
                                People in group
                              </span>
                              <span className="font-headline-md text-primary text-[14px] tabular-nums">
                                {parseCount(row.groupCount) || memberCount} of {memberCount}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-3 sm:mt-4 rounded-2xl bg-[#f3e0e4] px-3.5 py-2.5 sm:py-3 flex items-center gap-3">
                        <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white text-primary flex items-center justify-center shrink-0 shadow-sm">
                          <Icon name="hotel" className="text-[18px] sm:text-[20px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-headline-md text-primary text-[13px] sm:text-[14px] leading-tight">
                            Stay needed
                          </p>
                          <p className="text-[10px] text-primary/50 mt-0.5">Accommodation</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.needsStay}
                          onClick={() => onUpdate(applyStayToggle(row, !row.needsStay))}
                          className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
                            row.needsStay ? "bg-primary" : "bg-[rgba(128,0,32,0.18)]",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200",
                              row.needsStay && "translate-x-5",
                            )}
                          />
                        </button>
                      </div>

                      <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate({
                              ...row,
                              invitationSent: !row.invitationSent,
                              inviteStatus: row.invitationSent ? "Pending" : "Sent",
                            })
                          }
                          className={cn(
                            "h-9 px-3.5 rounded-full font-label-caps text-[10px] tracking-[0.12em]",
                            row.invitationSent
                              ? "bg-tertiary-container text-on-tertiary-container"
                              : "border border-[rgba(128,0,32,0.18)] text-primary bg-white",
                          )}
                        >
                          {row.invitationSent ? "Invite sent" : "Mark invite"}
                        </button>
                        <button
                          type="button"
                          onClick={onDelete}
                          className="h-9 px-3.5 rounded-full font-label-caps text-[10px] tracking-[0.12em] text-error hover:bg-error/10"
                        >
                          Remove
                        </button>
                      </div>
                    </aside>

                    <section className="px-4 sm:px-5 pt-3 pb-3 sm:pt-5 sm:pb-5">
                      <p className="font-label-caps text-[9px] tracking-[0.16em] text-primary mb-2.5 sm:mb-3">
                        Guest counts
                      </p>

                      <div className="mb-2.5 sm:mb-3">
                        <MiniStepper
                          label="Total"
                          icon="groups"
                          value={memberCount}
                          min={1}
                          onChange={(value) => setCount("count", value)}
                          priority
                        />
                      </div>

                      {eventFields.length || row.needsStay ? (
                        <>
                          <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary/55 mb-2">
                            Events · Reception mirrors Total
                          </p>
                          <div
                            className={cn(
                              "grid gap-2 sm:gap-2.5 grid-cols-2",
                              eventFields.length + (row.needsStay ? 1 : 0) >= 3 && "sm:grid-cols-3",
                            )}
                          >
                            {eventFields.map((item) => (
                              <MiniStepper
                                key={item.field}
                                label={item.label}
                                icon={item.icon}
                                value={fieldValue(row, item.field)}
                                min={item.field === "receptionCount" ? 1 : 0}
                                max={item.field === "receptionCount" ? undefined : otherMax}
                                onChange={(value) => setCount(item.field, value)}
                              />
                            ))}
                            {row.needsStay ? (
                              <MiniStepper
                                label="Stay"
                                icon="hotel"
                                value={stayCount}
                                min={0}
                                max={otherMax}
                                onChange={(value) => setCount("stayCount", value)}
                              />
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[rgba(128,0,32,0.08)] bg-[#faf6f0] px-4 sm:px-5 pt-2.5 sm:pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] flex justify-center">
                  <button
                    type="button"
                    onClick={onToggle}
                    className="add-guest-confirm relative w-full max-w-[280px] h-11 sm:h-12 rounded-full bg-primary text-on-primary font-label-caps text-[12px] tracking-[0.14em] overflow-hidden shadow-[0_14px_28px_-12px_rgba(128,0,32,0.55)] hover:brightness-110 active:scale-[0.98] transition-[transform,filter]"
                  >
                    <span className="relative z-[1]">Done</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
