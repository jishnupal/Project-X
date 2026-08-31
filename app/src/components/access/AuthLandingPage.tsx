import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProfileAvatarBadge, ProfileAvatarPicker } from "./ProfileAvatarPicker";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { pullWedding } from "../../domain/storage/sync";
import { loadRecentAccess, type RecentAccessEntry } from "../../domain/access/deviceLocal";
import type { ProfileAvatarId } from "../../domain/access/types";
import { cn } from "../../design-system/cn";
import { PublicPageShell, isLocalDevHost } from "../layout/PublicPageShell";

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
        autoComplete="one-time-code"
        maxLength={4}
        placeholder="••••"
        className="mt-1.5 w-full h-12 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-4 text-center tracking-[0.5em] text-lg text-primary outline-none focus:border-[#cca730]"
      />
    </label>
  );
}

type AuthStep = "choose" | "adminSetup" | "adminSignIn" | "guestJoin" | "forgotPin";

export function AuthLandingPage() {
  const navigate = useNavigate();
  const {
    syncCode,
    joinWeddingLink,
    showToast,
    unlinkWedding,
  } = useWeddingState();
  const {
    snapshot,
    session,
    setupAdmin,
    unlockProfile,
    joinGuest,
    resetForgottenPin,
    restoreRecentSession,
    refreshAccess,
    clearLocalAccess,
  } = useAccess();

  const [recent, setRecent] = useState<RecentAccessEntry[]>(() => loadRecentAccess());
  const [step, setStep] = useState<AuthStep>("choose");
  const [staleLink, setStaleLink] = useState(false);
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>("lotus");
  const [guestAvatarId, setGuestAvatarId] = useState<ProfileAvatarId>("marigold");
  const [pin, setPin] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setRecent(loadRecentAccess());
  }, [syncCode, session]);

  useEffect(() => {
    if (!syncCode) {
      setAccessReady(true);
      return;
    }
    setAccessReady(false);
    const timeout = window.setTimeout(() => setAccessReady(true), 6000);
    void refreshAccess()
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeout);
        setAccessReady(true);
      });
    return () => window.clearTimeout(timeout);
  }, [syncCode, refreshAccess]);

  useEffect(() => {
    if (!syncCode) {
      navigate("/", { replace: true });
    }
  }, [syncCode, navigate]);

  useEffect(() => {
    if (!syncCode) {
      setStaleLink(false);
      return;
    }
    let cancelled = false;
    void pullWedding(syncCode)
      .then((remote) => {
        if (cancelled) return;
        setStaleLink(!remote);
      })
      .catch(() => {
        if (!cancelled) setStaleLink(false);
      });
    return () => {
      cancelled = true;
    };
  }, [syncCode]);

  const disconnectWedding = () => {
    unlinkWedding();
    clearLocalAccess();
    setStaleLink(false);
    setFormError("");
    navigate("/", { replace: true });
  };

  const adminProfile = useMemo(
    () => snapshot?.profiles.find((p) => p.role === "admin") || null,
    [snapshot],
  );

  const hasAdmin = Boolean(adminProfile);

  useEffect(() => {
    if (!syncCode || !accessReady || session) return;
    if (!hasAdmin) setStep("adminSetup");
    else if (step === "adminSetup") setStep("choose");
  }, [syncCode, accessReady, hasAdmin, session, step]);

  if (session && session.role !== "guest") {
    return <NavigateTo dest="/command-center" />;
  }

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setFormError(message);
      showToast(message);
    } finally {
      setBusy(false);
    }
  };

  const onRecentTap = (entry: RecentAccessEntry) => {
    void run(async () => {
      if (syncCode !== entry.weddingCode) {
        await joinWeddingLink(entry.weddingCode);
      }
      await restoreRecentSession({
        weddingCode: entry.weddingCode,
        profileId: entry.profileId,
        role: entry.role,
      });
      navigate(entry.role === "guest" ? "/buzz" : "/command-center");
    });
  };

  if (!syncCode) {
    return null;
  }

  if (step === "adminSetup" && syncCode && !hasAdmin) {
    return (
      <PublicPageShell narrow>
        <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-secondary hover:text-primary mb-6">
          Home
        </Link>
        <div className="space-y-5 landing-fade-in">
          <div>
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">Client Admin</p>
            <h1 className="font-headline-md text-primary text-[28px] mt-1">Set up your wedding</h1>
            <p className="text-[13px] text-secondary mt-2">
              Wedding <span className="font-medium text-primary tracking-wider">{syncCode}</span> is linked.
              Create your Admin profile and 4-digit PIN.
            </p>
          </div>
          <label className="block">
            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 text-primary outline-none"
            />
          </label>
          <ProfileAvatarPicker value={avatarId} onChange={setAvatarId} />
          <PinInput value={pin} onChange={setPin} label="4-digit PIN" />
          {formError ? (
            <p className="text-[12px] text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || pin.length !== 4 || !name.trim()}
            onClick={() =>
              void run(async () => {
                await setupAdmin({ name: name.trim(), avatarId, pin });
                navigate("/command-center");
              })
            }
            className="w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40"
          >
            {busy ? "Saving…" : "Create Admin profile"}
          </button>
        </div>
      </PublicPageShell>
    );
  }

  if (step === "adminSignIn" && adminProfile) {
    return (
      <PublicPageShell narrow>
        <button
          type="button"
          onClick={() => {
            setStep("choose");
            setUnlockPin("");
            setFormError("");
          }}
          className="inline-flex items-center gap-1 text-[13px] text-secondary hover:text-primary mb-6"
        >
          ← Back
        </button>
        <div className="space-y-5 landing-fade-in">
          <div>
            <h1 className="font-headline-md text-primary text-[28px]">Admin sign in</h1>
            <p className="text-[13px] text-secondary mt-2">
              Wedding <span className="font-medium text-primary tracking-wider">{syncCode}</span> · enter your PIN
            </p>
          </div>
          <div
            className={cn(
              "w-full flex items-center gap-3 rounded-2xl border px-3 py-3",
              "border-primary bg-[rgba(128,0,32,0.06)]",
            )}
          >
            <ProfileAvatarBadge avatarId={adminProfile.avatarId} />
            <div>
              <p className="font-headline-md text-primary text-[16px]">{adminProfile.name}</p>
              <p className="text-[11px] text-secondary">Admin</p>
            </div>
          </div>
          <PinInput value={unlockPin} onChange={setUnlockPin} label="Admin PIN" />
          {formError ? (
            <p className="text-[12px] text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || unlockPin.length !== 4 || staleLink}
            onClick={() =>
              void run(async () => {
                await unlockProfile(adminProfile.id, unlockPin);
                navigate("/command-center");
              })
            }
            className="w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40"
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setNewPin("");
              setConfirmPin("");
              setStep("forgotPin");
            }}
            className="w-full h-10 text-[13px] text-primary font-button"
            data-testid="auth-forgot-pin"
          >
            Forgot PIN? Reset it
          </button>
          <button
            type="button"
            onClick={disconnectWedding}
            className="w-full h-10 text-[13px] text-secondary"
          >
            Use a different wedding
          </button>
        </div>
      </PublicPageShell>
    );
  }

  if (step === "forgotPin" && adminProfile) {
    return (
      <PublicPageShell narrow>
        <button
          type="button"
          onClick={() => {
            setStep("adminSignIn");
            setFormError("");
          }}
          className="inline-flex items-center gap-1 text-[13px] text-secondary hover:text-primary mb-6"
        >
          ← Back
        </button>
        <div className="space-y-5 landing-fade-in">
          <div>
            <h1 className="font-headline-md text-primary text-[28px]">Reset Admin PIN</h1>
            <p className="text-[13px] text-secondary mt-2">
              Set a new 4-digit PIN for{" "}
              <span className="font-medium text-primary tracking-wider">{syncCode}</span>. You will be
              signed in after reset.
            </p>
          </div>
          <PinInput value={newPin} onChange={setNewPin} label="New PIN" />
          <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" />
          {formError ? (
            <p className="text-[12px] text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || newPin.length !== 4 || confirmPin.length !== 4 || staleLink}
            data-testid="auth-reset-pin-submit"
            onClick={() =>
              void run(async () => {
                if (newPin !== confirmPin) {
                  throw new Error("PINs do not match.");
                }
                await resetForgottenPin({ pin: newPin, confirmPin });
                navigate("/command-center");
              })
            }
            className="w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40"
          >
            {busy ? "Saving…" : "Reset PIN & sign in"}
          </button>
        </div>
      </PublicPageShell>
    );
  }

  if (step === "guestJoin") {
    return (
      <PublicPageShell narrow>
        <button
          type="button"
          onClick={() => {
            setStep("choose");
            setFormError("");
          }}
          className="inline-flex items-center gap-1 text-[13px] text-secondary hover:text-primary mb-6"
        >
          ← Back
        </button>
        <div className="space-y-5 landing-fade-in">
          <div>
            <h1 className="font-headline-md text-primary text-[28px]">Continue as Guest</h1>
            <p className="text-[13px] text-secondary mt-2">
              View Buzz for{" "}
              <span className="font-medium text-primary tracking-wider">{syncCode}</span>. No PIN needed.
            </p>
          </div>
          <label className="block">
            <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              className="mt-1.5 w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 text-primary outline-none"
            />
          </label>
          <ProfileAvatarPicker value={guestAvatarId} onChange={setGuestAvatarId} />
          {formError ? (
            <p className="text-[12px] text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || staleLink}
            data-testid="auth-guest-continue"
            onClick={() =>
              void run(async () => {
                await joinGuest({
                  name: name.trim() || "Guest",
                  avatarId: guestAvatarId,
                });
                navigate("/buzz");
              })
            }
            className="w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40"
          >
            {busy ? "Joining…" : "Enter as Guest"}
          </button>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell narrow>
      <div className="space-y-5 landing-fade-in py-4">
        {!accessReady ? (
          <div className="text-center py-8">
            <div className="landing-spinner mx-auto mb-4" aria-hidden />
            <p className="font-headline-md text-primary text-[22px]">Loading wedding…</p>
            <p className="text-[13px] text-secondary mt-2">Checking profiles for {syncCode}</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary">Wedding</p>
              <p className="font-headline-md text-primary tracking-[0.18em] text-[28px] mt-1">{syncCode}</p>
              <p className="text-[13px] text-secondary mt-2">How do you want to continue?</p>
            </div>

            {staleLink ? (
              <p className="text-[13px] text-error text-center" role="alert">
                This code is not on your local dev server. Disconnect and create or join a local wedding.
              </p>
            ) : null}
            {isLocalDevHost() ? (
              <p className="text-[12px] text-secondary text-center">
                Local dev needs <code className="text-[11px]">npm run dev:api</code> on port 8788.
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-1">
              {hasAdmin ? (
                <button
                  type="button"
                  disabled={busy || staleLink}
                  data-testid="auth-admin-signin"
                  onClick={() => {
                    setFormError("");
                    setStep("adminSignIn");
                  }}
                  className="w-full rounded-[22px] border border-primary bg-[rgba(128,0,32,0.06)] px-4 py-4 text-left disabled:opacity-40"
                >
                  <p className="font-headline-md text-primary text-[17px]">Sign in as Admin</p>
                  <p className="text-[12px] text-secondary mt-0.5">
                    {adminProfile?.name ? `${adminProfile.name} · ` : ""}Enter your 4-digit PIN
                  </p>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || staleLink}
                  onClick={() => setStep("adminSetup")}
                  className="w-full h-12 rounded-full bg-primary text-on-primary font-button text-[13px] disabled:opacity-40"
                >
                  Set up Admin profile
                </button>
              )}

              <button
                type="button"
                disabled={busy || staleLink || !hasAdmin}
                data-testid="auth-guest-option"
                onClick={() => {
                  setFormError("");
                  setStep("guestJoin");
                }}
                className="w-full rounded-[22px] border border-[rgba(128,0,32,0.14)] bg-white/80 px-4 py-4 text-left disabled:opacity-40"
              >
                <p className="font-headline-md text-primary text-[17px]">Continue as Guest</p>
                <p className="text-[12px] text-secondary mt-0.5">View Buzz · no PIN required</p>
              </button>

              <button
                type="button"
                onClick={disconnectWedding}
                className="w-full h-10 rounded-full border border-[rgba(128,0,32,0.18)] text-secondary font-button text-[12px]"
              >
                Back to home
              </button>
            </div>
          </>
        )}

        {recent.length ? (
          <section className="space-y-2 text-left pt-2">
            <p className="font-label-caps text-[8px] tracking-[0.14em] text-secondary">Recent · 24h</p>
            {recent.slice(0, 3).map((entry) => (
              <button
                key={`${entry.weddingCode}-${entry.profileId}`}
                type="button"
                disabled={busy}
                onClick={() => onRecentTap(entry)}
                className="w-full flex items-center gap-3 rounded-2xl border border-[rgba(128,0,32,0.12)] px-3 py-3 text-left bg-white/80"
              >
                <ProfileAvatarBadge avatarId={entry.avatarId as ProfileAvatarId} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-headline-md text-primary text-[15px] truncate">{entry.profileName}</p>
                  <p className="text-[10px] text-secondary tabular-nums tracking-wider">{entry.weddingCode}</p>
                </div>
              </button>
            ))}
          </section>
        ) : null}

        {session?.role === "guest" ? (
          <button
            type="button"
            onClick={() => navigate("/buzz")}
            className="w-full h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
          >
            Continue as Guest
          </button>
        ) : null}
      </div>
    </PublicPageShell>
  );
}

function NavigateTo({ dest }: { dest: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(dest, { replace: true });
  }, [dest, navigate]);
  return null;
}
