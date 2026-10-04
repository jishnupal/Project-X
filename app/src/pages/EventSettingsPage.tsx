import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAccess } from "../hooks/useAccess";
import { useAuth } from "../hooks/useAuth";
import { useWeddingState } from "../hooks/useWeddingState";
import { fetchCohost } from "../domain/access/cohostApi";
import { getOrCreateDeviceId } from "../domain/access/deviceLocal";
import { clearAccessSession } from "../domain/access/sessionLocal";
import { normalizeRole, roleLabel } from "../domain/access/types";
import { BroadcastPanel } from "../components/access/BroadcastPanel";
import { CoHostSection } from "../components/access/CoHostSection";
import { ConfirmDangerDialog } from "../components/ui/ConfirmDangerDialog";
import { SessionLoading } from "../components/layout/SessionLoading";
import { cn } from "../design-system/cn";

type Visibility = "invite" | "public";

export function EventSettingsPage() {
  const { syncCode, showToast, refreshFromCloud, state, setState } = useWeddingState();
  const { memberships, renameEvent, deleteEvent } = useAuth();
  const { snapshot, profile, session, canManage, removeDevice } = useAccess();

  const [seatLabel, setSeatLabel] = useState(roleLabel(profile?.role || "guest"));
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("invite");
  const [visBusy, setVisBusy] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState("");
  const thisDeviceId = useMemo(() => getOrCreateDeviceId(), []);
  const leaving = useRef(false);

  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === (syncCode || "").toUpperCase(),
  );
  const eventName = membership?.eventName || state.event?.name || "This event";

  useEffect(() => {
    const role = profile?.role || "guest";
    if (normalizeRole(role) !== "admin") {
      setSeatLabel(roleLabel(role));
      return;
    }
    if (!syncCode) return;
    setSeatLabel("Host");
    let cancelled = false;
    void fetchCohost(syncCode)
      .then((row) => {
        if (!cancelled && row && !row.isOwner) setSeatLabel("Co-host");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profile?.role, syncCode]);

  useEffect(() => {
    if (!membership?.eventId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(membership.eventId)}`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { config?: { visibility?: string } };
        const next = data.config?.visibility === "public" ? "public" : "invite";
        if (!cancelled) setVisibility(next);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membership?.eventId]);

  if (!syncCode || !session) return <SessionLoading />;

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const saveVisibility = async (next: Visibility) => {
    if (!membership?.eventId || visBusy || next === visibility) return;
    setVisBusy(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(membership.eventId)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateConfig", config: { visibility: next } }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save");
      setVisibility(next);
      showToast(next === "public" ? "Buzz set to public" : "Invite-only");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save");
    } finally {
      setVisBusy(false);
    }
  };

  const openManage = () => {
    setDraft(eventName);
    setDeleteStep(0);
    setManageError("");
    setManageOpen(true);
  };

  const saveEventName = async () => {
    const next = draft.trim();
    if (!membership || manageBusy || !next || next === membership.eventName) return;
    setManageBusy(true);
    setManageError("");
    try {
      await renameEvent(membership.eventId, next);
      await refreshFromCloud();
      showToast("Event name saved");
      setManageOpen(false);
    } catch (error) {
      setManageError(error instanceof Error ? error.message : "Could not rename this event");
    } finally {
      setManageBusy(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!membership || manageBusy) return;
    setManageBusy(true);
    setManageError("");
    try {
      await deleteEvent(membership.eventId);
      leaving.current = true;
      clearAccessSession();
      window.location.assign("/dashboard");
    } catch (error) {
      setManageError(error instanceof Error ? error.message : "Could not delete this event");
      setManageBusy(false);
    }
  };

  const leaveEvent = () => {
    leaving.current = true;
    clearAccessSession();
    window.location.assign("/dashboard");
  };

  if (!canManage) {
    return (
      <div className="clay-module-page mx-auto max-w-lg bg-transparent text-black lg:space-y-6 lg:px-1 lg:py-6">
        <div className="clay-module-page__frame profile-beige">
          <div className="clay-module-page__scroll space-y-5">
            <header className="pt-2">
              <p className="text-[13px] text-[#584141]">{seatLabel}</p>
              <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.04em]">
                {eventName}
              </h1>
              <p className="mt-2 text-[14px] text-[#584141]">
                Your place in this event. Host controls live with the host.
              </p>
            </header>
            <button
              type="button"
              onClick={leaveEvent}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black"
            >
              Leave event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="clay-module-page mx-auto max-w-lg bg-transparent text-black lg:space-y-6 lg:px-1 lg:py-6">
      <div className="clay-module-page__frame profile-beige">
        <div className="clay-module-page__scroll space-y-5">
          <header className="pt-2">
            <p className="text-[13px] text-[#584141]">{seatLabel}</p>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.04em]">
              {eventName}
            </h1>
            <p className="mt-2 text-[14px] text-[#584141]">Event settings for this celebration.</p>
          </header>

          <div className="border-t border-[#ece7e2]">
            <Fold
              title="This event"
              open={openSection === "this"}
              onToggle={() => setOpenSection((c) => (c === "this" ? null : "this"))}
            >
              <p className="text-[13px] text-[#584141] mb-3">Rename or remove this event.</p>
              <button
                type="button"
                onClick={openManage}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-white px-4 text-left"
              >
                <span className="min-w-0 truncate text-[14px] font-bold">{eventName}</span>
                <span className="shrink-0 text-[13px] font-semibold text-[#584141]">Edit</span>
              </button>
            </Fold>

            <Fold
              title="Visibility"
              open={openSection === "visibility"}
              onToggle={() => setOpenSection((c) => (c === "visibility" ? null : "visibility"))}
            >
              <p className="text-[13px] text-[#584141] mb-3">
                Invite-only for personal events. Public discoverability comes with Pro.
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={visBusy}
                  onClick={() => void saveVisibility("invite")}
                  className={cn(
                    "h-10 flex-1 rounded-full text-[12px] font-semibold border",
                    visibility === "invite"
                      ? "border-[#3D8AE8] bg-[#3D8AE8] text-white"
                      : "border-[#cfe3fb] bg-white text-[#1A6FD4]",
                  )}
                >
                  Invite only
                </button>
                <button
                  type="button"
                  disabled
                  aria-disabled
                  title="Upgrade to Pro"
                  className="flex h-10 flex-1 flex-col items-center justify-center gap-0 rounded-full border border-[#e5e1dc] bg-[#ececec] px-2 text-center opacity-60"
                >
                  <span className="text-[12px] font-semibold leading-none text-[#8a837c]">Public</span>
                  <span className="mt-0.5 text-[9px] font-bold leading-none tracking-[0.02em] text-[#1A6FD4]">
                    Upgrade to Pro
                  </span>
                </button>
              </div>
            </Fold>

            <Fold
              title="Broadcast"
              open={openSection === "broadcast"}
              onToggle={() => setOpenSection((c) => (c === "broadcast" ? null : "broadcast"))}
            >
              <BroadcastPanel untitled className="border-0 bg-transparent p-0 shadow-none rounded-none" />
            </Fold>

            <Fold
              title="Co-host"
              open={openSection === "cohost"}
              onToggle={() => setOpenSection((c) => (c === "cohost" ? null : "cohost"))}
            >
              <CoHostSection untitled />
            </Fold>

            <Fold
              title="Home modules"
              open={openSection === "modules"}
              onToggle={() => setOpenSection((c) => (c === "modules" ? null : "modules"))}
            >
              <p className="text-[13px] text-[#584141] mb-3">
                Add Stay or Menu to Home when you need them. Turn off anytime — Invitations, Contacts,
                and Buzz stay.
              </p>
              <div className="space-y-2">
                {(
                  [
                    {
                      key: "stay" as const,
                      title: "Stay",
                      line: "Rooms and who needs a place to sleep",
                    },
                    {
                      key: "menu" as const,
                      title: "Menu",
                      line: "Food boards for the days",
                    },
                  ] as const
                ).map((mod) => {
                  const on = Boolean(state.modules?.[mod.key]);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          modules: {
                            stay: mod.key === "stay" ? !on : Boolean(prev.modules?.stay),
                            menu: mod.key === "menu" ? !on : Boolean(prev.modules?.menu),
                            asked: true,
                          },
                        }));
                        showToast(
                          on
                            ? `${mod.title} removed from Home`
                            : `${mod.title} is on Home`,
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-black">{mod.title}</span>
                        <span className="block text-[12px] font-medium text-[#584141]">{mod.line}</span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                          on ? "bg-[#feca43] text-black" : "bg-[#fff8f5] text-[#584141]",
                        )}
                      >
                        {on ? "On" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Fold>

            <Fold
              title="Devices"
              open={openSection === "devices"}
              onToggle={() => setOpenSection((c) => (c === "devices" ? null : "devices"))}
            >
              {(snapshot?.devices || []).length === 0 ? (
                <p className="text-[13px] text-[#584141]">No devices connected yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(snapshot?.devices || []).map((device) => {
                    const owner = snapshot?.profiles.find((p) => p.id === device.profileId);
                    const mine = device.deviceId === thisDeviceId;
                    return (
                      <li
                        key={device.deviceId}
                        className="flex items-center gap-3 rounded-full bg-white px-4 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold">
                            {device.label}
                            {mine ? " · this device" : ""}
                          </p>
                          <p className="truncate text-[12px] text-[#584141]">
                            {owner?.name || "Unknown"}
                          </p>
                        </div>
                        {!mine ? (
                          <button
                            type="button"
                            onClick={() => setPendingRevoke(device.deviceId)}
                            className="text-[13px] font-semibold text-[#584141]"
                          >
                            Remove
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Fold>
          </div>

          <button
            type="button"
            onClick={leaveEvent}
            className="mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black"
          >
            Back to your events
          </button>

          {pendingRevoke ? (
            <ConfirmDangerDialog
              title="Remove this device?"
              message="It will stop syncing until someone joins again."
              confirmLabel="Remove device"
              cancelLabel="Keep"
              onCancel={() => setPendingRevoke(null)}
              onConfirm={() => {
                const id = pendingRevoke;
                setPendingRevoke(null);
                void run(() => removeDevice(id));
              }}
            />
          ) : null}
        </div>
      </div>

      {manageOpen && membership
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-3 pb-3"
              role="presentation"
              onClick={() => {
                if (!manageBusy) setManageOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal
                aria-labelledby="event-manage-title"
                className="w-full max-w-sm rounded-[24px] bg-[#fff8f5] px-5 py-5 text-left text-black"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="event-manage-title" className="text-[22px] font-extrabold tracking-[-0.04em]">
                  This event
                </h2>
                {deleteStep === 0 ? (
                  <>
                    <label
                      className="mt-4 block text-[13px] font-semibold text-[#584141]"
                      htmlFor="event-settings-name"
                    >
                      Event name
                    </label>
                    <input
                      id="event-settings-name"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="mt-2 h-12 w-full rounded-full border-0 bg-white px-4 text-[16px] font-semibold outline-none"
                    />
                    <button
                      type="button"
                      disabled={manageBusy || !draft.trim() || draft.trim() === membership.eventName}
                      onClick={() => void saveEventName()}
                      className="mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black disabled:opacity-70"
                    >
                      {manageBusy ? "Saving…" : "Save name"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManageError("");
                        setDeleteStep(1);
                      }}
                      className="mt-3 h-11 w-full text-[14px] font-semibold text-[#584141]"
                    >
                      Delete event
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-[18px] font-extrabold tracking-[-0.03em]">
                      {deleteStep === 1 ? "Delete this event?" : "Remove it for a day?"}
                    </p>
                    <p className="mt-2 text-[14px] text-[#584141]">
                      {deleteStep === 1
                        ? "This is the event you are in."
                        : "It leaves your list now. You can restore it for a day."}
                    </p>
                    <button
                      type="button"
                      disabled={manageBusy}
                      onClick={() => {
                        if (deleteStep === 1) setDeleteStep(2);
                        else void confirmDeleteEvent();
                      }}
                      className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#424242] text-[16px] font-semibold text-white disabled:opacity-70"
                    >
                      {deleteStep === 1 ? "Continue" : manageBusy ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(0)}
                      className="mt-3 h-11 w-full text-[14px] font-semibold text-[#584141]"
                    >
                      Keep it
                    </button>
                  </>
                )}
                {manageError ? (
                  <p className="mt-3 text-[13px] text-[#ba1a1a]" role="alert">
                    {manageError}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Fold({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#ece7e2]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[16px] font-bold tracking-[-0.02em]">{title}</span>
        <span className="text-[18px] leading-none text-[#584141]" aria-hidden>
          {open ? "–" : "+"}
        </span>
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}
