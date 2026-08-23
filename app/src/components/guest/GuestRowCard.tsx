import {
  applyFieldCountChange,
  applyStayToggle,
  guestEventLabelList,
  parseCount,
} from "../../domain/guest";
import { resolveDayName } from "../../domain/functions";
import type { GuestRow, WeddingState } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { CounterStepper } from "./CounterStepper";
import { StatusPill } from "./StatusPill";

type GuestRowCardProps = {
  row: GuestRow;
  state: WeddingState;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (row: GuestRow) => void;
  onDelete: () => void;
};

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function GuestRowCard({
  row,
  state,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: GuestRowCardProps) {
  const memberCount = parseCount(row.count);
  const stayCount = parseCount(row.stayCount || row.count);
  const eventLabels = guestEventLabelList(row, state);
  const max = memberCount;

  const counterFields = [
    { field: "count" as const, label: "Total Count", min: 1 },
    { field: "receptionCount" as const, label: resolveDayName(state, 3), min: 0 },
    { field: "sangeetCount" as const, label: resolveDayName(state, 1), min: 0 },
    { field: "biyebariCount" as const, label: resolveDayName(state, 2), min: 0 },
    { field: "borjatriCount" as const, label: resolveDayName(state, 4), min: 0 },
    { field: "stayCount" as const, label: "Stay (Beds)", min: 0 },
  ];

  const setCount = (field: keyof GuestRow, value: number) => {
    onUpdate(applyFieldCountChange(row, field, String(value)));
  };

  const stayLabel = row.needsStay
    ? `${stayCount} Stay ${row.invitationSent ? "Confirmed" : "Required"}`
    : null;

  if (expanded) {
    return (
      <article className="rounded-3xl border-2 border-primary/20 overflow-hidden premium-card-shadow">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded
          className="w-full px-6 md:px-8 py-5 md:py-6 bg-surface-container-low/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left cursor-pointer group"
        >
          <div className="flex items-center gap-4 md:gap-8 grow min-w-0">
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary font-display text-xl font-bold shrink-0">
              {avatarInitial(row.name)}
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-lg font-bold text-primary truncate">
                {row.name || "Guest not set"}
              </h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant/70">
                  <Icon name="groups" className="text-[16px]" />
                  {memberCount} {memberCount === 1 ? "Member" : "Members"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 flex-wrap">
            {stayLabel ? (
              <StatusPill variant="stay-on">{stayLabel}</StatusPill>
            ) : null}
            <StatusPill variant={row.invitationSent ? "invite-sent" : "invite-pending"}>
              {row.invitationSent ? "Invited" : "Pending Invite"}
            </StatusPill>
            <Icon name="expand_less" className="text-primary font-black" />
          </div>
        </button>

        <div className="p-6 md:p-8 bg-white border-t border-outline-variant/10">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {counterFields.map((item) => (
              <CounterStepper
                key={item.field}
                label={item.label}
                value={
                  item.field === "receptionCount"
                    ? parseCount(row.receptionCount || row.count)
                    : parseCount(row[item.field])
                }
                min={item.min}
                max={item.field === "count" ? undefined : max}
                onChange={(value) => setCount(item.field, value)}
                variant="premium"
              />
            ))}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pt-8 border-t border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-widest text-primary">
                  Need Stay?
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.needsStay}
                  onClick={() => onUpdate(applyStayToggle(row, !row.needsStay))}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-all",
                    row.needsStay ? "bg-primary" : "bg-outline-variant",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all",
                      row.needsStay ? "right-1" : "left-1",
                    )}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...row,
                    invitationSent: !row.invitationSent,
                    inviteStatus: row.invitationSent ? "Pending" : "Sent",
                  })
                }
                className="px-6 md:px-8 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 bg-primary text-white hover:scale-[1.02] transition-all shadow-md"
              >
                <Icon name="send" className="text-[18px]" />
                {row.invitationSent ? "Invite Sent" : "Send Digital Invite"}
              </button>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center gap-2 text-error/60 hover:text-error transition-colors px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              <Icon name="delete_sweep" className="text-[20px]" />
              Remove Group
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className="glass-row px-6 md:px-8 py-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4 md:gap-8 grow min-w-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-xl font-bold shrink-0">
          {avatarInitial(row.name)}
        </div>
        <div className="min-w-0">
          <h4 className="font-display text-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">
            {row.name || "Guest not set"}
          </h4>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant/70">
              <Icon name="groups" className="text-[16px]" />
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </span>
            {eventLabels ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30 hidden sm:block" />
                <span className="text-[11px] font-medium text-on-surface-variant/50 truncate">
                  {eventLabels}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-6 flex-wrap sm:flex-nowrap">
        {row.needsStay ? (
          <StatusPill variant="stay-on">{stayCount} Stay Required</StatusPill>
        ) : null}
        <StatusPill variant={row.invitationSent ? "invite-sent" : "invite-pending"}>
          {row.invitationSent ? "Invited" : "Pending Invite"}
        </StatusPill>
        <Icon
          name="chevron_right"
          className="text-on-surface-variant/30 group-hover:text-primary transition-all hidden sm:block"
        />
      </div>
    </article>
  );
}
