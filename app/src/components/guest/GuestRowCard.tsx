import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  applyFieldCountChange,
  applyStayToggle,
  assignGuestToGroup,
  parseCount,
  setGuestDayCount,
  suggestGroupHeadcount,
} from "../../domain/guest";
import { GuestDayPlan } from "./GuestDayPlan";
import type { GuestGroup, GuestRow, WeddingState } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { useExpandableSheet } from "../ui/useExpandableSheet";
import { GroupHeadcountConfirm } from "./GroupHeadcountConfirm";
import { guestContactInitials, guestContactTone } from "./guestContactLook";
import { useWeddingState } from "../../hooks/useWeddingState";
import { createContactInvite, type ContactInvitePayload } from "../../domain/contactInvite";
import { SendInviteSheet } from "./SendInviteSheet";

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

function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function ContactDetailSheet({
  row,
  state,
  groups,
  showGroupControls,
  onClose,
  onUpdate,
  onDelete,
}: {
  row: GuestRow;
  state: WeddingState;
  groups: GuestGroup[];
  showGroupControls: boolean;
  onClose: () => void;
  onUpdate: (row: GuestRow) => void;
  onDelete: () => void;
}) {
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [adjustingHeadcount, setAdjustingHeadcount] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendInvite, setSendInvite] = useState<ContactInvitePayload | null>(null);
  const { syncCode, showToast } = useWeddingState();
  const sheet = useExpandableSheet({
    open: true,
    onClose,
    midRatio: 0.92,
    expandedRatio: 0.96,
    initialSnap: "expanded",
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const memberCount = parseCount(row.count);
  const groupName = groups.find((group) => group.id === row.groupId)?.name;
  const pendingGroup = groups.find((group) => group.id === pendingGroupId);
  const overlayHeight = sheet.viewportBox.height || undefined;
  const label = row.name || "Guest not set";

  const setDay = (dayId: number, value: number) => {
    onUpdate(setGuestDayCount(row, dayId, String(Math.max(0, value))));
  };

  const openSendInvite = () => {
    if (!syncCode || sendBusy || !row.name.trim()) return;
    setSendBusy(true);
    void (async () => {
      try {
        const payload = await createContactInvite({
          code: syncCode,
          guestId: row.id,
          role: row.isBuddy ? "buddy" : "guest",
        });
        setSendInvite({ ...payload, name: payload.name || row.name.trim() });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not create the invite");
      } finally {
        setSendBusy(false);
      }
    })();
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

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-x-0 z-[90] flex items-end sm:items-center justify-center px-0 sm:px-5 group-sheet-backdrop"
          style={{
            top: sheet.viewportBox.top || 0,
            height: overlayHeight,
            bottom: overlayHeight ? undefined : 0,
            backgroundColor: `rgba(0,0,0,${sheet.backdropOpacity.toFixed(3)})`,
          }}
          role="dialog"
          aria-modal
          aria-labelledby={`guest-edit-${row.id}`}
          onClick={onClose}
        >
          <div
            className={cn(
              "guest-edit-sheet relative w-full overflow-hidden flex flex-col",
              "max-w-none sm:max-w-[640px]",
              "rounded-t-[28px] sm:rounded-[26px]",
              "bg-[#fff8f5] border border-[rgba(128,0,32,0.12)]",
              "shadow-[0_-22px_56px_-18px_rgba(87,0,19,0.4)] sm:shadow-2xl",
              !sheet.dragging && "expandable-sheet-panel",
            )}
            style={{
              height: sheet.height || undefined,
              maxHeight: "100%",
              transition: sheet.dragging
                ? "none"
                : "height 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(120%_90%_at_10%_0%,rgba(196,90,58,0.16),transparent_65%)]"
              aria-hidden
            />

            <div
              className="relative shrink-0 flex justify-center items-center min-h-11 touch-none cursor-grab active:cursor-grabbing select-none sm:hidden"
              {...sheet.handleBind}
              role="button"
              tabIndex={0}
              aria-expanded={sheet.expanded}
              aria-label={sheet.expanded ? "Shrink contact card" : "Expand contact card"}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  sheet.toggleExpanded();
                }
              }}
            >
              <span
                className={cn(
                  "rounded-full bg-[rgba(128,0,32,0.22)] transition-[width,height,background-color] duration-200",
                  sheet.dragging ? "h-1.5 w-14 bg-[rgba(128,0,32,0.35)]" : "h-1 w-9",
                )}
                aria-hidden
              />
            </div>

            <header
              className="relative shrink-0 px-4 sm:px-5 pb-3.5 flex items-start gap-3 border-b border-[rgba(128,0,32,0.08)] touch-none"
              {...sheet.chromeBind}
            >
              <span className="mt-0.5 h-12 w-12 rounded-2xl bg-[linear-gradient(145deg,#c45a3a,#e08a5a)] text-white shadow-[0_10px_20px_-12px_rgba(196,90,58,0.7)] flex items-center justify-center shrink-0 font-headline-md text-[15px]">
                {contactInitials(label)}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-label-caps text-[9px] tracking-[0.16em] text-[#7a6f62]">
                  Contact
                </p>
                <h2
                  id={`guest-edit-${row.id}`}
                  className="font-headline-md text-[#1a100c] text-[20px] sm:text-[22px] leading-tight truncate mt-1"
                >
                  {label}
                </h2>
                <p className="text-[12px] text-[#7a6f62] font-semibold tabular-nums mt-1.5">
                  {memberCount} {memberCount === 1 ? "person" : "people"}
                  {groupName ? ` · ${groupName}` : ""}
                  {row.invitationSent ? " · Invite sent" : " · Invite pending"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                onPointerDown={(event) => event.stopPropagation()}
                className="h-10 w-10 rounded-full border border-[rgba(128,0,32,0.12)] bg-white text-primary flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </header>

            <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="space-y-3.5 px-4 pb-4 pt-3.5 sm:px-5">
                <label className="block">
                  <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                    Family name
                  </span>
                  <input
                    value={row.name}
                    onChange={(e) => onUpdate({ ...row, name: e.target.value })}
                    placeholder="Family name"
                    autoComplete="off"
                    className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 font-headline-md text-[#1a100c] text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-[#c45a3a]/35 focus-visible:border-[#c45a3a]/50"
                  />
                </label>

                <GuestDayPlan
                  state={state}
                  total={memberCount}
                  counts={row}
                  needsStay={row.needsStay}
                  accent="maroon"
                  onTotalChange={(value) => onUpdate(applyFieldCountChange(row, "count", String(value)))}
                  onDayChange={setDay}
                  onStayToggle={(on) => onUpdate(applyStayToggle(row, on))}
                  onStayCountChange={(value) =>
                    onUpdate(applyFieldCountChange(row, "stayCount", String(value)))
                  }
                />

                {showGroupControls && groups.length ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                        Group
                      </span>
                      <select
                        value={row.groupId || ""}
                        onChange={(e) => onGroupSelect(e.target.value)}
                        className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(128,0,32,0.14)] bg-white px-3 text-[13px] font-semibold text-[#1a100c] outline-none focus-visible:ring-2 focus-visible:ring-[#c45a3a]/30"
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
                        className="w-full h-11 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white px-3.5 flex items-center justify-between text-left"
                      >
                        <span className="text-[12px] text-[#7a6f62] font-semibold">
                          People in group
                        </span>
                        <span className="font-headline-md text-[#1a100c] text-[15px] tabular-nums">
                          {parseCount(row.groupCount) || memberCount} of {memberCount}
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {row.invitationSent ? (
                    <span className="inline-flex h-10 items-center rounded-full bg-tertiary-container px-4 text-[11px] font-button text-on-tertiary-container">
                      Invite sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...row,
                          invitationSent: true,
                          inviteStatus: "Sent",
                        })
                      }
                      className="h-10 px-4 rounded-full text-[11px] font-button border border-[rgba(128,0,32,0.14)] text-primary bg-white"
                    >
                      Mark invite
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openSendInvite}
                    disabled={sendBusy || !row.name.trim()}
                    className="h-10 px-4 rounded-full text-[11px] font-button border border-[rgba(128,0,32,0.14)] text-primary bg-white disabled:opacity-60"
                  >
                    {sendBusy ? "Preparing…" : row.invitationSent ? "Resend" : "Send invite"}
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="h-10 px-4 rounded-full text-[11px] font-button text-[#8a1f2b] border border-[rgba(128,0,32,0.14)] bg-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div className="relative shrink-0 border-t border-[rgba(128,0,32,0.08)] bg-[#fff8f5] px-4 sm:px-5 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-[280px] h-12 rounded-full bg-primary text-on-primary font-button text-[13px] shadow-[0_14px_28px_-12px_rgba(128,0,32,0.55)] active:scale-[0.98] transition-transform"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {pendingGroup ? (
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

      <SendInviteSheet
        open={Boolean(sendInvite)}
        invite={sendInvite}
        defaultNote={state.buzz?.invitationNote || ""}
        letterBase={{
          templateId: "classic",
          eventName: state.event?.name || "Your event",
          welcomeTitle: state.buzz?.welcomeTitle || "",
          welcomeMessage: state.buzz?.welcomeMessage || "",
          venueName: state.buzz?.venueName || "",
        }}
        onClose={() => setSendInvite(null)}
        onSent={() => onUpdate({ ...row, invitationSent: true, inviteStatus: "Sent" })}
        showToast={showToast}
      />
    </>
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
  const memberCount = parseCount(row.count);
  const stayCount = parseCount(row.stayCount || row.count);
  const groupName = groups.find((group) => group.id === row.groupId)?.name;
  const inGroupPartial =
    Boolean(row.groupId) &&
    parseCount(row.groupCount) > 0 &&
    parseCount(row.groupCount) < memberCount;

  const label = row.name || "Guest not set";
  const glance = [
    `${memberCount} ${memberCount === 1 ? "person" : "people"}`,
    showGroupControls && groupName
      ? `${groupName}${
          inGroupPartial ? ` (${parseCount(row.groupCount)} of ${memberCount})` : ""
        }`
      : null,
    row.needsStay ? `Stay ${stayCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const cardBody = (
    <>
      <span
        className={cn(
          "relative h-12 w-12 rounded-full flex items-center justify-center shrink-0",
          "font-headline-md text-[14px] tracking-wide ring-2 ring-white shadow-sm",
          guestContactTone(row.id + label),
        )}
        aria-hidden
      >
        {guestContactInitials(label)}
        {row.invitationSent ? (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#30d158] ring-2 ring-white" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="font-headline-md text-[15px] lg:text-[16px] leading-[1.25] text-[#1a100c] truncate">
          {label}
        </h4>
        <p className="text-[11px] text-[#7a6f62] font-semibold mt-0.5 truncate">{glance}</p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[11px] font-extrabold",
          row.invitationSent ? "text-emerald-700" : "text-[#7a6f62]",
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
      <article className="guest-row-card guest-contact-row relative z-[1] h-auto overflow-hidden">
        {readOnly ? (
          <div className="relative z-[1] w-full px-3 py-2.5 flex items-center gap-3 text-left">
            {cardBody}
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="relative z-[1] w-full px-3 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            {cardBody}
          </button>
        )}
      </article>

      {!readOnly && expanded ? (
        <ContactDetailSheet
          row={row}
          state={state}
          groups={groups}
          showGroupControls={showGroupControls}
          onClose={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ) : null}
    </>
  );
}
