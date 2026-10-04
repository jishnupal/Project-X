import { useEffect, useMemo, useRef, useState } from "react";
import type { GuestRow } from "../../domain/types";
import { MobileSheet, type MobileSheetHeight } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { InviteFluidBar } from "../ui/InviteFluidBar";
import { cn } from "../../design-system/cn";

type InviteTrackerSheetProps = {
  open: boolean;
  onClose: () => void;
  guests: GuestRow[];
  dayLabel: string;
  onToggleInvite?: (guestId: string, sent: boolean) => void;
  onSendInvite?: (guestId: string) => void;
  sendBusyGuestId?: string | null;
  /** Scroll/highlight this guest after send or deep-link. */
  focusGuestId?: string | null;
  onFocusGuestHandled?: () => void;
  onOpenGuest?: (guestId: string) => void;
  onAddGuests?: () => void;
  height?: MobileSheetHeight;
  headerAction?: "close" | "back";
};

function parseCount(v: string | number | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

const TONE_SENT = [
  "bg-[#dcfce7] text-[#166534]",
  "bg-[#d1fae5] text-[#065f46]",
  "bg-[#cffafe] text-[#155e75]",
] as const;

const TONE_PENDING = [
  "bg-[#fef3c7] text-[#92400e]",
  "bg-[#ffedd5] text-[#9a3412]",
  "bg-[#fce7f3] text-[#9d174d]",
] as const;

export function InviteTrackerSheet({
  open,
  onClose,
  guests,
  dayLabel,
  onToggleInvite,
  onSendInvite,
  sendBusyGuestId = null,
  focusGuestId = null,
  onFocusGuestHandled,
  onOpenGuest,
  onAddGuests,
  height = "tall",
  headerAction = "close",
}: InviteTrackerSheetProps) {
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !focusGuestId) return;
    setHighlightId(focusGuestId);
    const frame = window.requestAnimationFrame(() => {
      focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    const clear = window.setTimeout(() => {
      setHighlightId(null);
      onFocusGuestHandled?.();
    }, 2200);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clear);
    };
  }, [open, focusGuestId, onFocusGuestHandled]);

  const { sent, pending } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? guests.filter((g) => g.name.toLowerCase().includes(q))
      : guests;
    const sentList: GuestRow[] = [];
    const pendingList: GuestRow[] = [];
    for (const g of filtered) {
      if (g.invitationSent) sentList.push(g);
      else pendingList.push(g);
    }
    sentList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    pendingList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return { sent: sentList, pending: pendingList };
  }, [guests, search]);

  const total = guests.length;
  const sentCount = guests.filter((g) => g.invitationSent).length;
  const pendingCount = total - sentCount;
  const pct = total > 0 ? Math.min(100, Math.round((sentCount / total) * 100)) : 0;

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Invite Tracker"
      height={height}
      headerAction={headerAction}
      zIndexClass="z-[80]"
      panelClassName="bg-[#fffbf0] invite-tracker-sheet"
      bodyClassName="overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col">
      {/* Summary hero */}
      <div className="invite-tracker-hero shrink-0 mx-4 mb-3 rounded-2xl overflow-hidden border border-[rgba(204,167,48,0.3)] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8a6f12]/70 mb-0.5">
              {dayLabel}
            </p>
            <p className="font-display text-[2rem] font-black leading-none text-[#5c4a0a] tabular-nums">
              {sentCount}
              <span className="text-lg text-[#8a6f12]/55 font-bold"> / {total}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="h-[44px] w-[44px] rounded-[14px] grid place-items-center bg-white/45 text-[#8a6f12] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.6)]">
              <Icon name="mark_email_read" filled className="text-[24px]" />
            </span>
            <p className="text-[11px] font-bold text-[#8a6f12] tabular-nums">{pct}% done</p>
          </div>
        </div>

        <InviteFluidBar value={sentCount} max={total} live />

        <div className="flex gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#166534]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            {sentCount} Invited
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#92400e]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pb-2">
        <div className="relative">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search families…"
            autoComplete="off"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[rgba(128,0,32,0.12)] bg-white text-[13px] outline-none focus:border-[#cca730]/50 focus-visible:ring-2 focus-visible:ring-[#cca730]/30"
          />
        </div>
        {onAddGuests ? (
          <button
            type="button"
            onClick={onAddGuests}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-[#feca43] px-5 text-[15px] font-semibold text-black"
          >
            Contacts
          </button>
        ) : null}
      </div>

      {/* Lists */}
      <div className="invite-tracker-list flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {/* Pending section */}
        {pending.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#fffbf0] py-1.5 z-[1]">
              <span className="h-6 w-6 rounded-full bg-[#fef3c7] grid place-items-center">
                <Icon name="schedule_send" className="text-[14px] text-[#92400e]" />
              </span>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#92400e]">
                Pending · {pending.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {pending.map((guest, i) => (
                <div
                  key={guest.id}
                  ref={guest.id === focusGuestId || guest.id === highlightId ? focusRef : undefined}
                  className={cn(
                    "invite-tracker-row flex items-center gap-2.5 rounded-2xl border border-[#f59e0b]/20 bg-[#fffbeb] px-3 py-2.5",
                    "shadow-[0_2px_8px_-4px_rgba(245,158,11,0.12)]",
                    onOpenGuest && "active:scale-[0.99] transition-transform",
                    highlightId === guest.id && "ring-2 ring-[#feca43] ring-offset-2 ring-offset-[#fffbf0]",
                  )}
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <button
                    type="button"
                    disabled={!onOpenGuest}
                    onClick={() => onOpenGuest?.(guest.id)}
                    className="min-w-0 flex-1 flex items-center gap-2.5 text-left disabled:pointer-events-none"
                  >
                    <span
                      className={cn(
                        "h-[34px] w-[34px] rounded-xl grid place-items-center text-[11px] font-extrabold border border-white/60 shrink-0",
                        TONE_PENDING[i % TONE_PENDING.length],
                      )}
                    >
                      {initials(guest.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1c1917] truncate">
                        {guest.name || "Unnamed"}
                      </p>
                      <p className="text-[10px] text-[#78716c] font-semibold">
                        {parseCount(guest.count)}{" "}
                        {parseCount(guest.count) === 1 ? "person" : "people"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 h-[26px] px-2 rounded-full bg-[#fde68a] text-[9px] font-extrabold text-[#92400e] border border-[#f59e0b]/25 shrink-0">
                      <Icon name="hourglass_top" className="text-[12px]" />
                      Pending
                    </span>
                  </button>
                  {onSendInvite ? (
                    <button
                      type="button"
                      data-testid="tracker-send-invite"
                      disabled={sendBusyGuestId === guest.id || !guest.name.trim()}
                      onClick={() => onSendInvite(guest.id)}
                      aria-label={`Send invite to ${guest.name}`}
                      className="h-[30px] shrink-0 rounded-xl px-2.5 text-[10px] font-extrabold bg-[#feca43] text-[#2c2419] border border-[#e6b93a] active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {sendBusyGuestId === guest.id ? "…" : "Send"}
                    </button>
                  ) : null}
                  {onToggleInvite ? (
                    <button
                      type="button"
                      onClick={() => onToggleInvite(guest.id, true)}
                      aria-label={`Mark ${guest.name} as invited`}
                      className="h-[30px] w-[30px] rounded-xl grid place-items-center bg-[#22c55e]/15 text-[#166534] border border-[#22c55e]/25 shrink-0 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
                    >
                      <Icon name="check" className="text-[16px]" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invited section */}
        {sent.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#fffbf0] py-1.5 z-[1]">
              <span className="h-6 w-6 rounded-full bg-[#dcfce7] grid place-items-center">
                <Icon name="check_circle" filled className="text-[14px] text-[#166534]" />
              </span>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#166534]">
                Invited · {sent.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {sent.map((guest, i) => (
                <div
                  key={guest.id}
                  ref={guest.id === focusGuestId || guest.id === highlightId ? focusRef : undefined}
                  className={cn(
                    "invite-tracker-row flex items-center gap-2.5 rounded-2xl border border-[#22c55e]/20 bg-[#f0fdf4] px-3 py-2.5",
                    "shadow-[0_2px_8px_-4px_rgba(34,197,94,0.12)]",
                    onOpenGuest && "active:scale-[0.99] transition-transform",
                    highlightId === guest.id && "ring-2 ring-[#feca43] ring-offset-2 ring-offset-[#fffbf0]",
                  )}
                  style={{ animationDelay: `${Math.min(pending.length + i, 10) * 45}ms` }}
                >
                  <button
                    type="button"
                    disabled={!onOpenGuest}
                    onClick={() => onOpenGuest?.(guest.id)}
                    className="min-w-0 flex-1 flex items-center gap-2.5 text-left disabled:pointer-events-none"
                  >
                    <span
                      className={cn(
                        "h-[34px] w-[34px] rounded-xl grid place-items-center text-[11px] font-extrabold border border-white/60 shrink-0",
                        TONE_SENT[i % TONE_SENT.length],
                      )}
                    >
                      {initials(guest.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1c1917] truncate">
                        {guest.name || "Unnamed"}
                      </p>
                      <p className="text-[10px] text-[#78716c] font-semibold">
                        {parseCount(guest.count)}{" "}
                        {parseCount(guest.count) === 1 ? "person" : "people"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 h-[26px] px-2 rounded-full bg-[#bbf7d0] text-[9px] font-extrabold text-[#166534] border border-[#22c55e]/25 shrink-0">
                      <Icon name="check_circle" filled className="text-[12px]" />
                      Invited
                    </span>
                  </button>
                  {onSendInvite ? (
                    <button
                      type="button"
                      data-testid="tracker-resend-invite"
                      disabled={sendBusyGuestId === guest.id || !guest.name.trim()}
                      onClick={() => onSendInvite(guest.id)}
                      aria-label={`Resend invite to ${guest.name}`}
                      className="h-[30px] shrink-0 rounded-xl px-2.5 text-[10px] font-extrabold bg-white text-[#2c2419] border border-[#d8cfc8] active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {sendBusyGuestId === guest.id ? "…" : "Resend"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {sent.length === 0 && pending.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[rgba(128,0,32,0.15)] bg-white/60 px-4 py-8 text-center mt-4">
            <Icon name="mark_email_read" className="text-[32px] text-secondary/40 mb-2" />
            <p className="font-headline-md text-primary text-[18px]">
              {guests.length === 0 ? "No guests yet" : "No guests found"}
            </p>
            <p className="text-[12px] text-secondary mt-1">
              {guests.length === 0
            ? "Add people, then come back to see who said yes."
                : "Try a different search."}
            </p>
            {guests.length === 0 && onAddGuests ? (
              <button
                type="button"
                onClick={onAddGuests}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#feca43] px-5 text-[15px] font-semibold text-black"
              >
                Open contacts
              </button>
            ) : null}
          </div>
        )}
      </div>
      </div>
    </MobileSheet>
  );
}
