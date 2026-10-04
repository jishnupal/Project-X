import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import { clearAccessSession } from "../../domain/access/sessionLocal";
import { PROFILE_AVATARS, type ProfileAvatarId } from "../../domain/access/types";
import { ProfileAvatarBadge } from "./ProfileAvatarPicker";
import { Icon } from "../ui/Icon";

function savedAvatar(profileId: string | undefined): ProfileAvatarId | null {
  if (!profileId) return null;
  try {
    const saved = localStorage.getItem(`biyeflow.profilePhoto:${profileId}`);
    const match = PROFILE_AVATARS.find((avatar) => avatar.id === saved);
    return match ? match.id : null;
  } catch {
    return null;
  }
}

export function HostSignOut() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAccess();
  const { user, memberships, renameEvent, deleteEvent } = useAuth();
  const { syncCode, refreshFromCloud, showToast } = useWeddingState();
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = useState<{ top: number; right: number } | null>(null);
  const avatarId = savedAvatar(profile?.id);
  const photo = user?.avatarUrl || "";
  const name = profile?.name || user?.name || "Account";
  const current =
    memberships.find((row) => row.eventCode === syncCode) ||
    (memberships.length === 1 ? memberships[0] : null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const menu = menuRef.current;
    const keepOpen = (event: Event) => event.stopPropagation();
    menu?.addEventListener("mousedown", keepOpen);
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      menu?.removeEventListener("mousedown", keepOpen);
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openManage = () => {
    setOpen(false);
    setDraft(current?.eventName || "");
    setDeleteStep(0);
    setError("");
    setManageOpen(true);
  };

  const saveName = async () => {
    const next = draft.trim();
    if (!current || busy || !next || next === current.eventName) return;
    setBusy(true);
    setError("");
    try {
      await renameEvent(current.eventId, next);
      await refreshFromCloud();
      showToast("Event name saved");
      setManageOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename this event");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteEvent(current.eventId);
      clearAccessSession();
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this event");
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        onClick={() => {
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) setMenuBox({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
          setOpen((value) => !value);
        }}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
      >
        {avatarId ? (
          <ProfileAvatarBadge avatarId={avatarId} size={28} />
        ) : photo ? (
          <img src={photo} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ece7e2] text-[13px] font-bold text-black">
            {name.trim().slice(0, 1).toUpperCase() || <Icon name="person" className="text-[15px]" />}
          </span>
        )}
      </button>
      {open && menuBox
        ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menuBox.top, right: menuBox.right }}
          className="fixed z-[80] w-52 rounded-[20px] bg-[#fff8f5] p-2 text-left text-black shadow-[0_18px_40px_rgba(30,27,24,0.18)]"
        >
          <p className="truncate px-3 py-2 text-[14px] font-extrabold tracking-[-0.03em]">{name}</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              clearAccessSession();
              window.location.assign("/dashboard");
            }}
            className="flex h-11 w-full items-center rounded-full px-3 text-left text-[14px] font-semibold"
          >
            Your events
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex h-11 w-full items-center rounded-full px-3 text-left text-[14px] font-semibold"
          >
            Profile
          </button>
          {isAdmin ? (
            <button
              type="button"
              role="menuitem"
              data-testid="manage-events"
              onClick={openManage}
              className="flex h-11 w-full items-center rounded-full px-3 text-left text-[14px] font-semibold"
            >
              Manage this event
            </button>
          ) : null}
        </div>,
            document.body,
          )
        : null}
      {manageOpen && current
        ? createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-3 pb-3"
          role="presentation"
          onClick={() => {
            if (!busy) setManageOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="manage-events-title"
            className="w-full max-w-sm rounded-[24px] bg-[#fff8f5] px-5 py-5 text-left text-black"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="manage-events-title" className="text-[22px] font-extrabold tracking-[-0.04em]">
              Manage Events
            </h2>
            {deleteStep === 0 ? (
              <>
                <label className="mt-4 block text-[13px] font-semibold text-[#584141]" htmlFor="manage-event-name">
                  Event name
                </label>
                <input
                  id="manage-event-name"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="mt-2 h-12 w-full rounded-full border-0 bg-white px-4 text-[16px] font-semibold outline-none"
                />
                <button
                  type="button"
                  disabled={busy || !draft.trim() || draft.trim() === current.eventName}
                  onClick={() => void saveName()}
                  className="mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black disabled:opacity-70"
                >
                  {busy ? "Saving…" : "Save name"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
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
                  disabled={busy}
                  onClick={() => {
                    if (deleteStep === 1) setDeleteStep(2);
                    else void confirmDelete();
                  }}
                  className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#424242] text-[16px] font-semibold text-white disabled:opacity-70"
                >
                  {deleteStep === 1 ? "Continue" : busy ? "Deleting…" : "Delete"}
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
            {error ? (
              <p className="mt-3 text-[13px] text-[#ba1a1a]" role="alert">
                {error}
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
