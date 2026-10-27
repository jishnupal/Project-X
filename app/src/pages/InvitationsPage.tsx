import { useMemo, useState } from "react";
import { InviteGuestRows, type InviteListMode } from "../components/guest/InviteGuestRows";
import { InviteFluidBar } from "../components/ui/InviteFluidBar";
import { Icon } from "../components/ui/Icon";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";
import type { GuestRow } from "../domain/types";

const TAB_META: Record<
  InviteListMode,
  { label: string; empty: string; tabClass: string }
> = {
  pending: {
    label: "To send",
    empty: "Everyone has a pass queued — nice.",
    tabClass: "invites-tab--send",
  },
  sent: {
    label: "Sent",
    empty: "No passes sent yet.",
    tabClass: "invites-tab--sent",
  },
  claimed: {
    label: "Claimed",
    empty: "Nobody has claimed yet.",
    tabClass: "invites-tab--claimed",
  },
};

export function InvitationsPage() {
  const go = useNavigateInsideEvent();
  const { state, setState, showToast, syncCode } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("guests", "edit");
  const [listMode, setListMode] = useState<InviteListMode>("pending");
  const [query, setQuery] = useState("");
  const [focusGuestId, setFocusGuestId] = useState<string | null>(null);

  const guests = state.guests || [];

  const { pending, sentOnly, claimed, sentCount, claimedCount, total, pct } = useMemo(() => {
    const pendingList: GuestRow[] = [];
    const sentList: GuestRow[] = [];
    const claimedList: GuestRow[] = [];
    for (const g of guests) {
      if (g.inviteStatus === "Claimed") claimedList.push(g);
      else if (g.invitationSent) sentList.push(g);
      else pendingList.push(g);
    }
    const byName = (a: GuestRow, b: GuestRow) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    pendingList.sort(byName);
    sentList.sort(byName);
    claimedList.sort(byName);
    const all = guests.length;
    const sent = sentList.length + claimedList.length;
    return {
      pending: pendingList,
      sentOnly: sentList,
      claimed: claimedList,
      sentCount: sent,
      claimedCount: claimedList.length,
      total: all,
      pct: all > 0 ? Math.min(100, Math.round((sent / all) * 100)) : 0,
    };
  }, [guests]);

  const tabCounts: Record<InviteListMode, number> = {
    pending: pending.length,
    sent: sentOnly.length,
    claimed: claimed.length,
  };

  const listGuests = useMemo(() => {
    const source =
      listMode === "pending" ? pending : listMode === "sent" ? sentOnly : claimed;
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((g) => g.name.toLowerCase().includes(q));
  }, [listMode, pending, sentOnly, claimed, query]);

  const openSendInvite = (guestId: string) => {
    if (!canEdit) return;
    const row = guests.find((guest) => guest.id === guestId);
    if (!row?.name.trim()) return;
    if (!syncCode) {
      showToast("Open an event first");
      return;
    }
    go(`/people/letter?send=${encodeURIComponent(guestId)}`);
  };

  const markInvited = (guestId: string, sent: boolean) => {
    if (!canEdit || !sent) return;
    setState((prev) => ({
      ...prev,
      guests: prev.guests.map((row) =>
        row.id === guestId
          ? { ...row, invitationSent: true, inviteStatus: "Sent" as const }
          : row,
      ),
    }));
    showToast("Marked as invited");
  };

  const hasGuests = guests.length > 0;
  const needsContactsSetup = !hasGuests;

  return (
    <div className="invites-desk font-[Manrope,sans-serif] mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col bg-[#fff8f5] text-black">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-1">
        <header className="scene-keeper scene-keeper--invites">
          {needsContactsSetup ? (
            <button
              type="button"
              className="scene-keeper__card"
              onClick={() => canEdit && go("/people/contacts")}
              aria-label="Add contacts to start inviting"
            >
              <span className="text-[12px] font-semibold text-[#584141]">Invites</span>
              <span className="mt-1.5 block text-[22px] font-extrabold leading-[1.1] tracking-[-0.04em] text-black">
                Add contacts first
              </span>
              <span className="mt-1.5 block text-[13px] font-semibold leading-snug text-[#584141]">
                People on the list → then send.
              </span>
            </button>
          ) : (
            <div
              className="scene-keeper__card"
              aria-label={`Invites, ${sentCount} of ${total} sent, ${pct}% done`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="invites-tracker__label">Invites</span>
                <span className="invites-tracker__label tabular-nums">{pct}%</span>
              </span>
              <span className="invites-tracker__count">
                {sentCount}
                <span className="invites-tracker__count-total">/{total}</span>
              </span>
              <span className="invites-tracker__meta">
                {sentCount === 1 ? "1 invited" : `${sentCount} invited`}
                <span className="text-black/25"> · </span>
                {claimedCount === 1 ? "1 claimed" : `${claimedCount} claimed`}
              </span>
              <div className="invites-tracker__bar">
                <InviteFluidBar value={sentCount} max={total} live />
              </div>
            </div>
          )}
          <div className="scene-keeper__figure">
            <div className="scene-keeper__sway">
              <img src="/home/invites-keeper.png" alt="" />
            </div>
          </div>
        </header>

        <button
          type="button"
          onClick={() => go("/people/preview")}
          className="invite-guest-door mt-2.5"
          data-testid="invite-preview-box"
          aria-label="Open guest preview"
        >
          <span className="invite-guest-door__stage" aria-hidden>
            <span className="invite-guest-door__pass" />
            <span className="invite-guest-door__letter" />
          </span>
          <span className="invite-guest-door__copy">
            <span className="invite-guest-door__kicker">Try it yourself</span>
            <span className="invite-guest-door__title">Open as a guest</span>
            <span className="invite-guest-door__meta">
              Walk through the pass and letter before you send.
            </span>
          </span>
          <span className="invite-guest-door__go">
            Open
            <Icon name="arrow_forward" className="text-[16px]" />
          </span>
        </button>

        <div className="invite-craft-modules mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => canEdit && go("/people/film")}
            disabled={!canEdit}
            className="invite-craft-module invite-craft-module--film disabled:opacity-50"
            aria-label="Set host film"
          >
            <span className="invite-craft-module__kicker">Craft</span>
            <span className="invite-craft-module__title">Film</span>
            <span className="invite-craft-module__meta">
              Host video · streams for every guest
            </span>
          </button>
          <button
            type="button"
            onClick={() => canEdit && go("/people/letter")}
            disabled={!canEdit}
            className="invite-craft-module invite-craft-module--note disabled:opacity-50"
            aria-label="Set host note"
          >
            <span className="invite-craft-module__kicker">Craft</span>
            <span className="invite-craft-module__title">Note</span>
            <span className="invite-craft-module__meta">
              Postcard title &amp; message
            </span>
          </button>
        </div>

        {needsContactsSetup ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => go("/people/contacts")}
              disabled={!canEdit}
              className="buddies-invite disabled:opacity-50"
            >
              <Icon name="person_add" className="text-[22px]" />
              <span className="buddies-invite__copy">
                <span className="buddies-invite__title">Add contacts</span>
                <span className="buddies-invite__meta">
                  Build the guest list — then come back to invite.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="invites-list-panel mt-3">
            <div className="invites-tabs" role="tablist" aria-label="Invite lists">
              {(
                [
                  ["pending", tabCounts.pending],
                  ["sent", tabCounts.sent],
                  ["claimed", tabCounts.claimed],
                ] as const
              ).map(([id, count]) => {
                const active = listMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`invites-tab ${TAB_META[id].tabClass}${active ? " is-active" : ""}`}
                    onClick={() => {
                      setQuery("");
                      setListMode(id);
                    }}
                  >
                    <span className="invites-tab__label">{TAB_META[id].label}</span>
                    <span className="invites-tab__count">{count}</span>
                  </button>
                );
              })}
            </div>

            <label className="invites-search mt-2.5 flex h-10 items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_6px_16px_rgba(90,62,8,0.05)]">
              <Icon name="search" className="text-[18px] text-[#584141]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${TAB_META[listMode].label.toLowerCase()}`}
                className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-[#b5a9a4]"
              />
            </label>

            <InviteGuestRows
              guests={listGuests}
              mode={listMode}
              onSendInvite={
                canEdit && listMode !== "claimed" ? openSendInvite : undefined
              }
              onToggleInvite={canEdit && listMode === "pending" ? markInvited : undefined}
              focusGuestId={focusGuestId}
              onFocusGuestHandled={() => setFocusGuestId(null)}
              emptyLabel={query ? "No matches." : TAB_META[listMode].empty}
            />
          </div>
        )}
      </div>
    </div>
  );
}
