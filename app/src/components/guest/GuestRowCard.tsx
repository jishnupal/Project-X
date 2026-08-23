import {
  applyFieldCountChange,
  applyStayToggle,
  assignGuestToGroup,
  parseCount,
} from "../../domain/guest";
import { functionIds, resolveDayName } from "../../domain/functions";
import type { GuestGroup, GuestRow, WeddingState } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GuestRowCardProps = {
  row: GuestRow;
  state: WeddingState;
  groups: GuestGroup[];
  showGroupControls: boolean;
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
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: GuestRowCardProps) {
  const memberCount = parseCount(row.count);
  const stayCount = parseCount(row.stayCount || row.count);
  const groupName = groups.find((group) => group.id === row.groupId)?.name;
  const eventFields = eventCountFields(state);
  /** Event / stay counters are capped by Total. Total itself can always reduce to 1. */
  const otherMax = memberCount;

  const setCount = (field: CountField, value: number) => {
    if (field === "count" || field === "receptionCount") {
      // Total ↔ Reception stay linked; min 1.
      onUpdate(applyFieldCountChange(row, field, String(Math.max(1, value))));
      return;
    }
    onUpdate(applyFieldCountChange(row, field, String(Math.max(0, Math.min(otherMax, value)))));
  };

  return (
    <>
      <article className="mini-meal-card relative z-[1] h-auto min-h-[72px] rounded-xl p-0 overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="relative z-[1] w-full px-3.5 py-3 flex items-center gap-2.5 text-left"
        >
          <div className="min-w-0 flex-1">
            <h4 className="font-headline-md text-[16px] leading-[1.2] text-primary truncate">
              {row.name || "Guest not set"}
            </h4>
            <p className="font-label-caps text-[10px] tracking-[0.12em] text-secondary/70 mt-0.5 truncate">
              {memberCount} {memberCount === 1 ? "guest" : "guests"}
              {showGroupControls && groupName ? ` · ${groupName}` : ""}
              {row.needsStay ? ` · Stay ${stayCount}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 font-label-caps text-[9px] tracking-[0.12em]",
              row.invitationSent ? "text-emerald-700" : "text-secondary",
            )}
          >
            {row.invitationSent ? "Sent" : "Pending"}
          </span>
          <Icon name="chevron_right" className="text-[16px] text-primary opacity-40 shrink-0" />
        </button>
      </article>

      {expanded ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 sm:p-5 add-guest-backdrop"
          role="dialog"
          aria-modal
          aria-labelledby={`guest-edit-${row.id}`}
          onClick={onToggle}
        >
          <div
            className="guest-edit-sheet w-full max-w-[920px] overflow-hidden rounded-[24px] bg-[#faf6f0] shadow-2xl border border-[rgba(204,167,48,0.28)] flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.4fr)] min-h-0">
              <aside className="relative px-5 pt-5 pb-4 md:pt-6 md:pb-5 border-b md:border-b-0 md:border-r border-[rgba(128,0,32,0.08)] bg-gradient-to-br from-[#fffaf5] to-[#f6e8ea]">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-label-caps text-[9px] tracking-[0.18em] text-primary/55">
                      Edit guest
                    </p>
                    <h2 id={`guest-edit-${row.id}`} className="sr-only">
                      {row.name || "Guest not set"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onToggle}
                    className="h-9 w-9 rounded-full text-primary/55 hover:text-primary hover:bg-[rgba(128,0,32,0.06)] flex items-center justify-center shrink-0 md:hidden"
                    aria-label="Close"
                  >
                    <Icon name="close" className="text-[20px]" />
                  </button>
                </div>

                <label className="block mt-3">
                  <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                    Guest name
                  </span>
                  <input
                    value={row.name}
                    onChange={(e) => onUpdate({ ...row, name: e.target.value })}
                    placeholder="Family name"
                    autoComplete="off"
                    className="mt-1.5 w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 font-headline-md text-primary text-[17px] outline-none focus:border-[#cca730] focus:shadow-[0_0_0_3px_rgba(204,167,48,0.18)]"
                  />
                </label>

                {showGroupControls && groups.length ? (
                  <label className="block mt-4">
                    <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                      Group
                    </span>
                    <select
                      value={row.groupId || ""}
                      onChange={(e) => onUpdate(assignGuestToGroup(row, e.target.value))}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3 text-sm outline-none focus:border-[#cca730]"
                    >
                      <option value="">Unassigned</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="mt-4 rounded-2xl bg-[#f3e0e4] px-3.5 py-3 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-white text-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Icon name="hotel" className="text-[20px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-headline-md text-primary text-[14px] leading-tight">
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

                <div className="mt-4 flex flex-wrap items-center gap-2">
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

              <section className="px-5 pt-5 pb-4 md:pt-6 md:pb-5 relative">
                <button
                  type="button"
                  onClick={onToggle}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full text-primary/55 hover:text-primary hover:bg-[rgba(128,0,32,0.06)] hidden md:flex items-center justify-center"
                  aria-label="Close"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>

                <p className="font-label-caps text-[9px] tracking-[0.16em] text-primary mb-3">
                  Guest counts
                </p>

                <div className="mb-3">
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
                        "grid gap-2.5 grid-cols-2",
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

                <p className="text-[11px] text-primary/45 mt-4 leading-snug">
                  Total and Reception move together. Other events stay within Total.
                </p>
              </section>
            </div>

            <div className="shrink-0 border-t border-[rgba(128,0,32,0.08)] bg-[#faf6f0] px-5 py-4 flex justify-center">
              <button
                type="button"
                onClick={onToggle}
                className="add-guest-confirm relative w-full max-w-[280px] h-12 rounded-full bg-primary text-on-primary font-label-caps text-[12px] tracking-[0.14em] overflow-hidden shadow-[0_14px_28px_-12px_rgba(128,0,32,0.55)] hover:brightness-110 active:scale-[0.98] transition-[transform,filter]"
              >
                <span className="relative z-[1]">Done</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
