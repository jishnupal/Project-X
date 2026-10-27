import { useEffect, useRef, useState } from "react";
import type { GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

function parseCount(v: string | number | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function peopleLabel(count: string | number | undefined) {
  const n = parseCount(count);
  return n === 1 ? "1 person" : `${n} people`;
}

export type InviteListMode = "pending" | "sent" | "claimed";

export type InviteGuestRowsProps = {
  guests: GuestRow[];
  mode: InviteListMode;
  onSendInvite?: (guestId: string) => void;
  onToggleInvite?: (guestId: string, sent: boolean) => void;
  sendBusyGuestId?: string | null;
  focusGuestId?: string | null;
  onFocusGuestHandled?: () => void;
  emptyLabel: string;
};

export function InviteGuestRows({
  guests,
  mode,
  onSendInvite,
  onToggleInvite,
  sendBusyGuestId = null,
  focusGuestId = null,
  onFocusGuestHandled,
  emptyLabel,
}: InviteGuestRowsProps) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!focusGuestId) return;
    if (!guests.some((g) => g.id === focusGuestId)) return;
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
  }, [focusGuestId, guests, onFocusGuestHandled]);

  if (guests.length === 0) {
    return <p className="mt-4 px-0.5 text-[14px] font-medium text-[#584141]">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-2.5 space-y-2">
      {guests.map((guest) => {
        const focused = guest.id === focusGuestId || guest.id === highlightId;
        return (
          <li
            key={guest.id}
            ref={focused ? focusRef : undefined}
            className={cn(
              "rounded-[18px] bg-[#fffdf8] px-3 py-3 shadow-[0_8px_20px_rgba(90,62,8,0.06)]",
              highlightId === guest.id && "ring-2 ring-[#feca43]/70",
            )}
          >
            <div className="flex w-full items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-extrabold tracking-[-0.02em]">
                  {guest.name || "Unnamed"}
                </span>
                <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#584141]">
                  {peopleLabel(guest.count)}
                </span>
              </span>

              {mode === "pending" ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  {onSendInvite ? (
                    <button
                      type="button"
                      data-testid="tracker-send-invite"
                      disabled={sendBusyGuestId === guest.id || !guest.name.trim()}
                      onClick={() => onSendInvite(guest.id)}
                      className="h-9 rounded-full bg-[#feca43] px-3.5 text-[13px] font-extrabold text-black disabled:opacity-50"
                    >
                      {sendBusyGuestId === guest.id ? "…" : "Send pass"}
                    </button>
                  ) : null}
                  {onToggleInvite ? (
                    <button
                      type="button"
                      onClick={() => onToggleInvite(guest.id, true)}
                      aria-label={`Mark ${guest.name} as invited`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-[#ece7e2] text-[#166534]"
                    >
                      <Icon name="check" className="text-[18px]" />
                    </button>
                  ) : null}
                </span>
              ) : null}

              {mode === "sent" ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-extrabold text-[#166534]">
                    Sent
                  </span>
                  {onSendInvite ? (
                    <button
                      type="button"
                      data-testid="tracker-resend-invite"
                      disabled={sendBusyGuestId === guest.id || !guest.name.trim()}
                      onClick={() => onSendInvite(guest.id)}
                      className="h-9 rounded-full bg-[#ece7e2] px-3 text-[13px] font-extrabold text-black disabled:opacity-50"
                    >
                      {sendBusyGuestId === guest.id ? "…" : "Resend"}
                    </button>
                  ) : null}
                </span>
              ) : null}

              {mode === "claimed" ? (
                <span className="rounded-full bg-[#ffe0e6] px-2.5 py-1 text-[11px] font-extrabold text-[#e11d3a]">
                  Claimed
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
