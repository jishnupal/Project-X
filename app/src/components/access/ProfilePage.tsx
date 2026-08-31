import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import {
  formatFunctionDateFull,
  formatWeddingScheduleSummary,
  weddingScheduleNeedsSetup,
} from "../../domain/functions";
import {
  roleLabel,
  type ProfileAvatarId,
} from "../../domain/access/types";
import { ProfileAvatarBadge, ProfileAvatarPicker } from "./ProfileAvatarPicker";
import { cn } from "../../design-system/cn";

export function ProfilePage() {
  const navigate = useNavigate();
  const { syncCode, unlinkWedding, showToast, state, setScheduleModalOpen } = useWeddingState();
  const {
    profile,
    session,
    deviceCount,
    isGuest,
    canEdit,
    saveProfile,
    clearLocalAccess,
    refreshAccess,
  } = useAccess();

  const [name, setName] = useState(profile?.name || "");
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>(
    (profile?.avatarId as ProfileAvatarId) || "lotus",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!syncCode || !session) {
      navigate("/auth", { replace: true });
    }
  }, [syncCode, session, navigate]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!syncCode || !session) return null;

  return (
    <div className="max-w-lg mx-auto py-4 lg:py-6 px-1 space-y-4 lg:space-y-6">
      <div className="flex items-start gap-2.5 lg:gap-3">
        <ProfileAvatarBadge avatarId={profile?.avatarId} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-label-caps text-[8px] lg:text-[9px] tracking-[0.16em] text-secondary">
            {roleLabel(profile?.role || "guest")}
          </p>
          <h1 className="font-headline-md text-primary text-[20px] lg:text-[24px] truncate mt-0.5 tracking-[-0.01em]">
            {profile?.name || "Profile"}
          </h1>
          {!isGuest ? (
            <p className="text-[11px] lg:text-[12px] text-secondary mt-1 tabular-nums">
              {deviceCount} device{deviceCount === 1 ? "" : "s"} active · last 24h
            </p>
          ) : null}
        </div>
      </div>

      <section className="space-y-2.5 lg:space-y-3 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-3.5 lg:p-4">
        <p className="font-label-caps text-[8px] lg:text-[9px] tracking-[0.14em] text-primary">Your profile</p>
        <input
          value={name || profile?.name || ""}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] px-3.5 text-primary outline-none"
        />
        <ProfileAvatarPicker
          value={(avatarId || profile?.avatarId || "lotus") as ProfileAvatarId}
          onChange={setAvatarId}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(() =>
              saveProfile({
                name: (name || profile?.name || "").trim(),
                avatarId,
              }),
            )
          }
          className="w-full h-11 rounded-full bg-tertiary-container text-on-tertiary-container font-button text-[13px]"
        >
          Save profile
        </button>
      </section>

      {!isGuest ? (
        <section className="space-y-2.5 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-3.5 lg:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-label-caps text-[8px] lg:text-[9px] tracking-[0.14em] text-primary">
              Wedding schedule
            </p>
            {weddingScheduleNeedsSetup(state) ? (
              <span className="rounded-full bg-[rgba(204,167,48,0.14)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#8a6f12]">
                Needs dates
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-secondary leading-relaxed">
            {formatWeddingScheduleSummary(state)}
          </p>
          <ul className="space-y-1.5">
            {[...state.functions]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((fn) => (
                <li
                  key={fn.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-[#fff8f5] px-3 py-2 text-[11px]"
                >
                  <span className="font-medium text-primary">{fn.name}</span>
                  <span className="text-secondary tabular-nums">{formatFunctionDateFull(fn.date)}</span>
                </li>
              ))}
          </ul>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setScheduleModalOpen(true)}
            className={cn(
              "w-full h-11 rounded-full font-button text-[13px]",
              canEdit
                ? "bg-primary text-on-primary"
                : "bg-[rgba(128,0,32,0.06)] text-secondary",
            )}
          >
            Edit wedding dates
          </button>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => {
          clearLocalAccess();
          navigate("/auth");
        }}
        className="w-full h-11 rounded-full bg-[#f3e0e4] text-primary font-button text-[13px]"
      >
        Sign out
      </button>

      <button
        type="button"
        onClick={() => {
          clearLocalAccess();
          unlinkWedding();
          navigate("/auth");
        }}
        className="w-full h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
      >
        Disconnect wedding code
      </button>

      {!isGuest ? (
        <button
          type="button"
          onClick={() => void refreshAccess()}
          className="w-full h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
        >
          Refresh
        </button>
      ) : null}
    </div>
  );
}
