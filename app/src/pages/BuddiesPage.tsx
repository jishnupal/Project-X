import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import {
  buddyInviteUrl,
  guestInviteUrl,
} from "../domain/access/accessApi";
import { MODULE_IDS, MODULE_LABELS } from "../domain/access/permissions";
import {
  type ModuleGrants,
  type ModuleId,
} from "../domain/access/types";
import { getOrCreateDeviceId } from "../domain/access/deviceLocal";
import { ProfileAvatarBadge } from "../components/access/ProfileAvatarPicker";
import { Icon } from "../components/ui/Icon";
import { ConfirmDangerDialog } from "../components/ui/ConfirmDangerDialog";
import { SessionLoading } from "../components/layout/SessionLoading";

function PinInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="block">
      <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        maxLength={4}
        placeholder="••••"
        className="mt-1.5 w-full h-12 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-4 text-center tracking-[0.5em] text-lg text-primary outline-none focus:border-[#cca730]"
      />
    </label>
  );
}

export function BuddiesPage() {
  const { syncCode, showToast } = useWeddingState();
  const {
    snapshot,
    profile,
    session,
    isAdmin,
    adminUnlocked,
    unlockProfile,
    saveBuddyGrants,
    loadInviteLinks,
    removeDevice,
    canManage,
  } = useAccess();

  const [unlockPin, setUnlockPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [guestLink, setGuestLink] = useState("");
  const [buddyLink, setBuddyLink] = useState("");
  const [buddyDrafts, setBuddyDrafts] = useState<Record<string, ModuleGrants>>({});

  const thisDeviceId = useMemo(() => getOrCreateDeviceId(), []);

  useEffect(() => {
    if (!isAdmin || !adminUnlocked) return;
    void loadInviteLinks()
      .then((links) => {
        setGuestLink(guestInviteUrl(links.guest));
        setBuddyLink(buddyInviteUrl(links.buddy));
      })
      .catch(() => undefined);
  }, [isAdmin, adminUnlocked, loadInviteLinks]);

  const buddies = useMemo(
    () => (snapshot?.profiles || []).filter((p) => p.role === "buddy"),
    [snapshot],
  );

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

  if (!syncCode || !session) return <SessionLoading />;

  if (!canManage) {
    return <Navigate to="/command-center" replace />;
  }

  return (
    <div className="max-w-lg mx-auto py-4 lg:py-6 px-1 space-y-4 lg:space-y-6">
      <div>
        <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">People</p>
        <h1 className="font-headline-md text-primary text-[26px] mt-1">Buddies</h1>
        <p className="text-[13px] text-secondary mt-2">
          Invite helpers and choose what each Buddy can edit.
        </p>
      </div>

      {isAdmin && !adminUnlocked ? (
        <section className="space-y-3 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-[#fff8f0] p-4">
          <p className="font-headline-md text-primary text-[16px]">Unlock Admin</p>
          <p className="text-[12px] text-secondary">Enter your PIN to manage Buddies and invite links.</p>
          <PinInput value={unlockPin} onChange={setUnlockPin} label="4-digit PIN" />
          <button
            type="button"
            disabled={busy || unlockPin.length !== 4 || !profile}
            onClick={() => void run(() => unlockProfile(profile!.id, unlockPin))}
            className="w-full h-11 rounded-full bg-primary text-on-primary font-button text-[13px] disabled:opacity-40"
          >
            Unlock
          </button>
        </section>
      ) : null}

      {isAdmin && adminUnlocked ? (
        <>
          <section className="space-y-3 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-4">
            <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Invite links</p>
            <p className="text-[12px] text-secondary">
              Guest link opens BUZZ (view-only). Buddy link lets helpers join with a PIN.
            </p>
            {guestLink ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-secondary font-label-caps tracking-wider">Guest · BUZZ</p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(guestLink).then(() => showToast("Guest link copied"))}
                  className="w-full text-left rounded-xl border border-[rgba(128,0,32,0.12)] px-3 py-2 text-[11px] text-primary break-all"
                >
                  {guestLink}
                </button>
              </div>
            ) : null}
            {buddyLink ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-secondary font-label-caps tracking-wider">Buddy</p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(buddyLink).then(() => showToast("Buddy link copied"))}
                  className="w-full text-left rounded-xl border border-[rgba(128,0,32,0.12)] px-3 py-2 text-[11px] text-primary break-all"
                >
                  {buddyLink}
                </button>
              </div>
            ) : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-4">
            <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Your Buddies</p>
            {buddies.length === 0 ? (
              <p className="text-[12px] text-secondary">No Buddies yet. Share the Buddy invite link.</p>
            ) : (
              <ul className="space-y-3">
                {buddies.map((buddy) => {
                  const draft = buddyDrafts[buddy.id] ?? buddy.moduleGrants;
                  return (
                    <li key={buddy.id} className="rounded-xl bg-[rgba(128,0,32,0.04)] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <ProfileAvatarBadge avatarId={buddy.avatarId} size={36} />
                        <p className="text-[14px] text-primary font-medium">{buddy.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {MODULE_IDS.filter((m) => m !== "access").map((moduleId) => (
                          <label key={moduleId} className="flex items-center gap-2 text-[11px] text-secondary">
                            <input
                              type="checkbox"
                              checked={(draft[moduleId] || "none") === "edit" || (draft[moduleId] || "none") === "view"}
                              onChange={(e) => {
                                const next: ModuleGrants = {
                                  ...draft,
                                  [moduleId]: e.target.checked ? "edit" : "none",
                                };
                                setBuddyDrafts((prev) => ({ ...prev, [buddy.id]: next }));
                              }}
                            />
                            {MODULE_LABELS[moduleId as ModuleId]}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(() => saveBuddyGrants(buddy.id, buddyDrafts[buddy.id] ?? buddy.moduleGrants))
                        }
                        className="h-9 px-3 rounded-full border border-[rgba(128,0,32,0.18)] text-[11px] text-primary font-button"
                      >
                        Save access
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-4">
            <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Devices (24h)</p>
            <ul className="space-y-2">
              {(snapshot?.devices || []).map((device) => {
                const owner = snapshot?.profiles.find((p) => p.id === device.profileId);
                const mine = device.deviceId === thisDeviceId;
                return (
                  <li
                    key={device.deviceId}
                    className="flex items-center gap-3 rounded-xl bg-[rgba(128,0,32,0.04)] px-3 py-2.5"
                  >
                    <Icon name="smartphone" className="text-primary text-[20px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-primary font-medium truncate">
                        {device.label}
                        {mine ? " · this device" : ""}
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        {owner?.name || "Unknown"} · {new Date(device.lastSeenAt).toLocaleString()}
                      </p>
                    </div>
                    {!mine ? (
                      <button
                        type="button"
                        onClick={() => setPendingRevoke(device.deviceId)}
                        className="text-[11px] text-error font-button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}

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
  );
}
