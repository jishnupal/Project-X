import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useAuth, type EventMembership } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import { clearAccessSession } from "../../domain/access/sessionLocal";
import { PROFILE_AVATARS, type ProfileAvatarId } from "../../domain/access/types";
import { Icon } from "../ui/Icon";

type PhotoChoice = "google" | ProfileAvatarId;

function photoKey(profileId: string) {
  return `biyeflow.profilePhoto:${profileId}`;
}

function readPhotoChoice(profileId: string | undefined): PhotoChoice {
  if (!profileId) return "google";
  try {
    const saved = localStorage.getItem(photoKey(profileId));
    if (saved === "google") return "google";
    if (PROFILE_AVATARS.some((avatar) => avatar.id === saved)) return saved as ProfileAvatarId;
  } catch {
    /* ignore */
  }
  return "google";
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { syncCode, showToast, refreshFromCloud } = useWeddingState();
  const { memberships, user, status, removed, restoreEvent, renameEvent, deleteEvent } = useAuth();
  const { profile, saveProfile } = useAccess();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [photoChoice, setPhotoChoice] = useState<PhotoChoice>("google");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [manageEvent, setManageEvent] = useState<EventMembership | null>(null);
  const [draft, setDraft] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [manageBusy, setManageBusy] = useState(false);
  const [manageError, setManageError] = useState("");
  const signingOut = useRef(false);

  useEffect(() => {
    setPhotoChoice(readPhotoChoice(profile?.id));
  }, [profile?.id]);

  useEffect(() => {
    if (!photoOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhotoOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoOpen]);

  useEffect(() => {
    if (signingOut.current) return;
    if (status === "anon") navigate("/login", { replace: true });
  }, [status, navigate]);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const openManage = (event: EventMembership) => {
    setManageEvent(event);
    setDraft(event.eventName);
    setDeleteStep(0);
    setManageError("");
  };

  const saveEventName = async () => {
    const next = draft.trim();
    if (!manageEvent || manageBusy || !next || next === manageEvent.eventName) return;
    setManageBusy(true);
    setManageError("");
    try {
      await renameEvent(manageEvent.eventId, next);
      if (manageEvent.eventCode === syncCode) await refreshFromCloud();
      showToast("Event name saved");
      setManageEvent(null);
    } catch (error) {
      setManageError(error instanceof Error ? error.message : "Could not rename this event");
    } finally {
      setManageBusy(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!manageEvent || manageBusy) return;
    const removingCurrent = manageEvent.eventCode === syncCode;
    setManageBusy(true);
    setManageError("");
    try {
      await deleteEvent(manageEvent.eventId);
      if (removingCurrent) {
        signingOut.current = true;
        clearAccessSession();
        window.location.assign("/dashboard");
        return;
      }
      setManageEvent(null);
    } catch (error) {
      setManageError(error instanceof Error ? error.message : "Could not delete this event");
      setManageBusy(false);
    }
  };

  if (status !== "authenticated" || !user) return null;

  const ownedEvents = memberships.filter((event) => event.role === "admin" && event.owner);
  const googlePhoto = user?.avatarUrl || "";
  const chosenAvatar = photoChoice === "google" ? null : PROFILE_AVATARS.find((avatar) => avatar.id === photoChoice);

  const choosePhoto = (next: PhotoChoice) => {
    setPhotoChoice(next);
    if (profile?.id) {
      try {
        localStorage.setItem(photoKey(profile.id), next);
      } catch {
        /* ignore */
      }
    }
    if (next !== "google") {
      void run(() => saveProfile({ avatarId: next }));
    }
  };

  return (
    <div className="clay-module-page mx-auto max-w-lg bg-transparent text-black lg:space-y-6 lg:px-1 lg:py-6">
      <div className="clay-module-page__frame profile-beige">
        <div className="clay-module-page__scroll space-y-5">
      <section className="flex flex-col items-center text-center">
        <button
          type="button"
          aria-label="View profile photo"
          onClick={() => setPhotoOpen(true)}
          className="grid h-[132px] w-[132px] place-items-center rounded-full bg-[#feca43] p-1.5"
        >
          <Portrait
            googlePhoto={googlePhoto}
            avatar={chosenAvatar}
            name={profile?.name || user?.name || ""}
            size={120}
          />
        </button>
        <p className="mt-5 text-[13px] text-[#584141]">{user.email}</p>
        <h1 className="mt-1 text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em]">
          {user.name || "Profile"}
        </h1>
        {memberships.length === 1 ? (
          <p className="mt-2 text-[15px] text-[#584141]">{memberships[0].eventName}</p>
        ) : memberships.length > 1 ? (
          <p className="mt-2 text-[15px] text-[#584141]">{memberships.length} events</p>
        ) : null}
      </section>

      <BuzzMeter />

      {ownedEvents.length > 0 || removed.length > 0 ? (
        <div className="border-t border-[#ece7e2]">
          {ownedEvents.length > 0 ? (
            <Fold
              title="Manage Events"
              open={openSection === "manage"}
              onToggle={() => setOpenSection((current) => (current === "manage" ? null : "manage"))}
            >
              <ul className="space-y-2">
                {ownedEvents.map((event) => (
                  <li key={event.eventId}>
                    <button
                      type="button"
                      onClick={() => openManage(event)}
                      className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-white px-4 text-left"
                    >
                      <span className="min-w-0 truncate text-[14px] font-bold">{event.eventName}</span>
                      <span className="shrink-0 text-[13px] font-semibold text-[#584141]">Edit</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Fold>
          ) : null}
          {removed.length > 0 ? (
            <Fold
              title="Restore"
              open={openSection === "restore"}
              onToggle={() => setOpenSection((current) => (current === "restore" ? null : "restore"))}
            >
              <p className="text-[13px] text-[#584141]">Removed · 1 day</p>
              <ul className="mt-3 space-y-2">
                {removed.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-full bg-white px-4 py-2"
                  >
                    <span className="min-w-0 truncate text-[14px] font-bold">{event.eventName}</span>
                    <button
                      type="button"
                      disabled={restoringId !== null}
                      onClick={() => {
                        setRestoringId(event.eventId);
                        setRestoreError("");
                        void restoreEvent(event.eventId)
                          .catch((error) => {
                            setRestoreError(
                              error instanceof Error ? error.message : "Could not restore this event",
                            );
                          })
                          .finally(() => setRestoringId(null));
                      }}
                      className="shrink-0 rounded-full bg-[#feca43] px-3 py-1 text-[13px] font-semibold text-black disabled:opacity-70"
                    >
                      {restoringId === event.eventId ? "Restoring…" : "Restore"}
                    </button>
                  </li>
                ))}
              </ul>
              {restoreError ? (
                <p className="mt-2 text-[13px] text-[#584141]" role="alert">
                  {restoreError}
                </p>
              ) : null}
            </Fold>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          signingOut.current = true;
          clearAccessSession();
          window.location.assign("/dashboard");
        }}
        className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black"
      >
        Your events
      </button>
        </div>
      </div>
      {manageEvent
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-3 pb-3"
              role="presentation"
              onClick={() => {
                if (!manageBusy) setManageEvent(null);
              }}
            >
              <div
                role="dialog"
                aria-modal
                aria-labelledby="profile-manage-events-title"
                className="w-full max-w-sm rounded-[24px] bg-[#fff8f5] px-5 py-5 text-left text-black"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="profile-manage-events-title" className="text-[22px] font-extrabold tracking-[-0.04em]">
                  Manage Events
                </h2>
                {deleteStep === 0 ? (
                  <>
                    <label className="mt-4 block text-[13px] font-semibold text-[#584141]" htmlFor="profile-event-name">
                      Event name
                    </label>
                    <input
                      id="profile-event-name"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="mt-2 h-12 w-full rounded-full border-0 bg-white px-4 text-[16px] font-semibold outline-none"
                    />
                    <button
                      type="button"
                      disabled={manageBusy || !draft.trim() || draft.trim() === manageEvent.eventName}
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
                        ? manageEvent.eventCode === syncCode
                          ? "This is the event you are in."
                          : "This is one of your events."
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
      {photoOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-3 pb-3 sm:items-center"
              role="presentation"
              onClick={() => setPhotoOpen(false)}
            >
              <div
                role="dialog"
                aria-modal
                aria-labelledby="profile-photo-title"
                className="max-h-[min(640px,90vh)] w-full max-w-sm overflow-y-auto rounded-[28px] bg-[#fff8f5] px-5 pb-6 pt-5 text-center"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="profile-photo-title" className="text-[22px] font-extrabold tracking-[-0.04em]">
                  Your photo
                </h2>
                <div className="mx-auto mt-4 grid h-40 w-40 place-items-center rounded-full bg-[#feca43] p-1.5">
                  <Portrait
                    googlePhoto={googlePhoto}
                    avatar={chosenAvatar}
                    name={profile?.name || user?.name || ""}
                    size={148}
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    aria-pressed={photoChoice === "google"}
                    onClick={() => choosePhoto("google")}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 ${
                      photoChoice === "google" ? "border-[#feca43] bg-[#fff4cc]" : "border-transparent bg-white"
                    }`}
                  >
                    <Portrait googlePhoto={googlePhoto} avatar={null} name={user?.name || ""} size={44} />
                    <span className="text-[11px] font-semibold">Google</span>
                  </button>
                  {PROFILE_AVATARS.map((avatar) => {
                    const selected = photoChoice === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        aria-pressed={selected}
                        aria-label={avatar.label}
                        onClick={() => choosePhoto(avatar.id)}
                        className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 ${
                          selected ? "border-[#feca43] bg-[#fff4cc]" : "border-transparent bg-white"
                        }`}
                      >
                        <span
                          className="grid h-11 w-11 place-items-center rounded-full text-white"
                          style={{ background: avatar.tint }}
                        >
                          <Icon name={avatar.icon} className="text-[20px]" />
                        </span>
                        <span className="text-[11px] font-semibold">{avatar.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoOpen(false)}
                  className="mt-4 text-[13px] font-semibold text-[#584141]"
                >
                  Close
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Portrait({
  googlePhoto,
  avatar,
  name,
  size,
}: {
  googlePhoto: string;
  avatar: (typeof PROFILE_AVATARS)[number] | null | undefined;
  name: string;
  size: number;
}) {
  if (avatar) {
    return (
      <span
        className="grid place-items-center rounded-full text-white"
        style={{ width: size, height: size, background: avatar.tint }}
      >
        <Icon name={avatar.icon} className={size >= 80 ? "text-[42px]" : "text-[20px]"} />
      </span>
    );
  }
  if (googlePhoto) {
    return (
      <img
        src={googlePhoto}
        alt=""
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const letter = name.trim().slice(0, 1).toUpperCase() || "B";
  return (
    <span
      className="grid place-items-center rounded-full bg-[#fff8f5] font-extrabold text-black"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {letter}
    </span>
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

type EarnRow = { action: string; label: string; points: number };

function BuzzMeter() {
  const { user } = useAuth();
  const { showToast } = useWeddingState();
  const [points, setPoints] = useState(user?.buzzPoints || 0);
  const [earnTable, setEarnTable] = useState<EarnRow[]>([]);
  const [recent, setRecent] = useState<Array<{ action: string; points: number }>>([]);
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/points", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          buzzPoints?: number;
          earnTable?: EarnRow[];
          recent?: Array<{ action: string; points: number }>;
        };
        setPoints(data.buzzPoints || 0);
        setEarnTable(data.earnTable || []);
        setRecent(data.recent || []);
      } catch {
        /* ignore */
      }
    })();
  }, [user?.id]);

  const linkGoogle = async () => {
    setLinking(true);
    try {
      const res = await fetch("/api/auth/link-google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/profile" }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start Google link");
      window.location.href = data.url;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not link Google");
      setLinking(false);
    }
  };

  const meterPct = Math.min(100, Math.round((points / 500) * 100));

  return (
    <section className="rounded-[24px] bg-white px-4 py-4 text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
            Buzz meter
          </p>
          <p className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">{points}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[13px] font-semibold text-[#584141]"
        >
          {open ? "Hide" : "How to earn"}
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ece7e2]">
        <div className="h-full rounded-full bg-[#e11d3a]" style={{ width: `${meterPct}%` }} />
      </div>
      {user?.provisional ? (
        <div className="mt-4 space-y-2">
          <p className="text-[13px] font-medium text-[#584141]">
            Save your Buzz on Profile — link Google so points travel with you.
          </p>
          <button
            type="button"
            disabled={linking}
            onClick={() => void linkGoogle()}
            className="h-10 w-full rounded-full bg-[#1a100c] text-[13px] font-extrabold text-white disabled:opacity-50"
          >
            {linking ? "Opening Google…" : "Save Buzz with Google"}
          </button>
        </div>
      ) : null}
      {open ? (
        <ul className="mt-4 space-y-2 border-t border-[#ece7e2] pt-3">
          {earnTable.map((row) => (
            <li key={row.action} className="flex justify-between text-[13px] font-semibold">
              <span className="text-[#584141]">{row.label}</span>
              <span className="text-[#9a5a38]">+{row.points}</span>
            </li>
          ))}
          {recent.length ? (
            <li className="pt-2 text-[12px] font-bold uppercase tracking-wide text-[#7a6f62]">
              Recent · {recent.slice(0, 5).map((r) => `+${r.points}`).join(" · ")}
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
