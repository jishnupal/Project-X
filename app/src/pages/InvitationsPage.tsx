import { useMemo, useState } from "react";
import { InviteGuestRows } from "../components/guest/InviteGuestRows";
import { SendInviteSheet } from "../components/guest/SendInviteSheet";
import { InviteFluidBar } from "../components/ui/InviteFluidBar";
import { Icon } from "../components/ui/Icon";
import { createContactInvite, type ContactInvitePayload } from "../domain/contactInvite";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";
import type { GuestRow } from "../domain/types";

type Section = "pending" | "invited";

export function InvitationsPage() {
  const go = useNavigateInsideEvent();
  const { state, setState, showToast, syncCode } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("guests", "edit");
  const [section, setSection] = useState<Section>("pending");
  const [query, setQuery] = useState("");
  const [sendBusyGuestId, setSendBusyGuestId] = useState<string | null>(null);
  const [sendInvite, setSendInvite] = useState<ContactInvitePayload | null>(null);
  const [focusGuestId, setFocusGuestId] = useState<string | null>(null);

  const guests = state.guests || [];

  const { pending, invited, sentCount, total, pct } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? guests.filter((g) => g.name.toLowerCase().includes(q))
      : guests;
    const pendingList: GuestRow[] = [];
    const invitedList: GuestRow[] = [];
    for (const g of filtered) {
      if (g.invitationSent) invitedList.push(g);
      else pendingList.push(g);
    }
    pendingList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    invitedList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    const sent = guests.filter((g) => g.invitationSent).length;
    const all = guests.length;
    return {
      pending: pendingList,
      invited: invitedList,
      sentCount: sent,
      total: all,
      pct: all > 0 ? Math.min(100, Math.round((sent / all) * 100)) : 0,
    };
  }, [guests, query]);

  const openSendInvite = (guestId: string) => {
    if (!canEdit) return;
    const row = guests.find((guest) => guest.id === guestId);
    if (!row?.name.trim()) return;
    if (!syncCode) {
      showToast("Open an event first");
      return;
    }
    if (sendBusyGuestId) return;
    setSendBusyGuestId(guestId);
    void (async () => {
      try {
        const payload = await createContactInvite({
          code: syncCode,
          guestId: row.id,
          role: row.isBuddy ? "buddy" : "guest",
        });
        setSendInvite({ ...payload, name: payload.name || row.name.trim() });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not prepare invite");
      } finally {
        setSendBusyGuestId(null);
      }
    })();
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

  const list = section === "pending" ? pending : invited;
  const hasGuests = guests.length > 0;
  const needsContactsSetup = !hasGuests;

  return (
    <div className="font-[Manrope,sans-serif] mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col bg-[#fff8f5] text-black">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-2">
        <header className="scene-keeper scene-keeper--invites">
          {needsContactsSetup ? (
            <button
              type="button"
              className="scene-keeper__card"
              onClick={() => canEdit && go("/people/contacts")}
              aria-label="Add contacts to start inviting"
            >
              <span className="text-[13px] font-semibold text-[#584141]">Invites</span>
              <span className="mt-2.5 block text-[28px] font-extrabold leading-[1.1] tracking-[-0.04em] text-black">
                Add contacts first
              </span>
              <span className="mt-2.5 block text-[15px] font-semibold leading-snug text-[#584141]">
                You need people on the list before you can send invites.
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="scene-keeper__card"
              aria-label={`Invites, ${sentCount} of ${total} sent, ${pct}% done`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#584141]">Invites</span>
                <span className="text-[13px] font-bold tabular-nums text-[#584141]">{pct}%</span>
              </span>
              <span className="mt-2.5 block text-[52px] font-extrabold leading-none tracking-[-0.045em] text-black tabular-nums">
                {sentCount}
                <span className="text-[28px] font-bold text-black/35">/{total}</span>
              </span>
              <span className="mt-2.5 block text-[15px] font-semibold leading-snug text-[#584141]">
                {sentCount === 1 ? "1 invited" : `${sentCount} invited`}
                <span className="text-black/25"> · </span>
                {total - sentCount === 1 ? "1 pending" : `${Math.max(0, total - sentCount)} pending`}
              </span>
              <div className="mt-3">
                <InviteFluidBar value={sentCount} max={total} live />
              </div>
            </button>
          )}
          <div className="scene-keeper__figure">
            <div className="scene-keeper__sway">
              <img src="/home/invites-keeper.png" alt="" />
            </div>
          </div>
        </header>

        {needsContactsSetup ? (
          <div className="mt-5 space-y-3">
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
            <button
              type="button"
              onClick={() => go("/people/letter")}
              className="invite-preview-entry"
            >
              <span className="invite-preview-entry__icon" aria-hidden>
                <Icon name="visibility" className="text-[22px]" />
              </span>
              <span className="buddies-invite__copy">
                <span className="buddies-invite__title">See your invite</span>
                <span className="buddies-invite__meta">
                  Open it like a guest — letter, photo, note &amp; Buzz teaser.
                </span>
              </span>
              <Icon name="chevron_right" className="text-[22px] text-[#584141]" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => go("/people/letter")}
              className="invite-preview-entry mt-4"
            >
              <span className="invite-preview-entry__icon" aria-hidden>
                <Icon name="visibility" className="text-[22px]" />
              </span>
              <span className="buddies-invite__copy">
                <span className="buddies-invite__title">See your invite</span>
                <span className="buddies-invite__meta">
                  Check the full guest experience before you send.
                </span>
              </span>
              <Icon name="chevron_right" className="text-[22px] text-[#584141]" />
            </button>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[#ece7e2] p-1">
              {(
                [
                  ["pending", "Pending"],
                  ["invited", "Invited"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={`h-10 rounded-full text-[15px] font-semibold ${
                    section === id ? "bg-[#feca43] text-black" : "text-[#584141]"
                  }`}
                >
                  {label}
                  <span className="ml-1 tabular-nums opacity-70">
                    {id === "pending" ? pending.length : invited.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="flex h-11 items-center gap-2 rounded-full bg-white px-3.5">
                <Icon name="search" className="text-[18px] text-[#584141]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={section === "pending" ? "Search pending" : "Search invited"}
                  className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#b5a9a4]"
                />
              </label>

              <InviteGuestRows
                guests={list}
                mode={section}
                onSendInvite={canEdit ? openSendInvite : undefined}
                onToggleInvite={canEdit ? markInvited : undefined}
                sendBusyGuestId={sendBusyGuestId}
                focusGuestId={focusGuestId}
                onFocusGuestHandled={() => setFocusGuestId(null)}
                emptyLabel={
                  section === "pending"
                    ? query
                      ? "No pending matches."
                      : "Everyone is invited."
                    : query
                      ? "No invited matches."
                      : "Nobody invited yet."
                }
              />
            </div>
          </>
        )}
      </div>

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
        onSent={(guestId) => {
          setState((prev) => ({
            ...prev,
            guests: prev.guests.map((row) =>
              row.id === guestId
                ? { ...row, invitationSent: true, inviteStatus: "Sent" as const }
                : row,
            ),
          }));
          setSection("invited");
          setFocusGuestId(guestId);
        }}
        showToast={showToast}
      />
    </div>
  );
}
