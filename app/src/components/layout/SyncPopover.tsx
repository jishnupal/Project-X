import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { pullWedding } from "../../domain/storage/sync";
import { loadRecentAccess } from "../../domain/access/deviceLocal";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { ProfileAvatarBadge } from "../access/ProfileAvatarPicker";
import type { ProfileAvatarId } from "../../domain/access/types";

export function SyncPopover({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const {
    syncCode,
    syncBusy,
    syncLive,
    state,
    showToast,
  } = useWeddingState();
  const { clearLocalAccess, restoreRecentSession, session } = useAccess();
  const [cloudGuests, setCloudGuests] = useState<number | null>(null);
  const [recent, setRecent] = useState(() => loadRecentAccess());

  const familyCount = state.guests?.length || 0;

  useEffect(() => {
    if (!syncCode) {
      setCloudGuests(null);
      setRecent(loadRecentAccess());
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const remote = await pullWedding(syncCode);
        if (!cancelled && remote) {
          setCloudGuests(remote.state.guests?.length ?? 0);
        }
      } catch {
        if (!cancelled) setCloudGuests(null);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [syncCode, familyCount, syncLive]);

  const copyCode = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      showToast("Code copied");
    } catch {
      showToast("Could not copy");
    }
  };

  const onRecentTap = (entry: (typeof recent)[0]) => {
    void (async () => {
      try {
        if (syncCode !== entry.weddingCode) {
          showToast("Open Auth to reconnect this wedding");
          onClose();
          navigate("/auth");
          return;
        }
        await restoreRecentSession({
          weddingCode: entry.weddingCode,
          profileId: entry.profileId,
          role: entry.role,
        });
        onClose();
        navigate(entry.role === "guest" ? "/buzz" : "/command-center");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not reconnect");
      }
    })();
  };

  const mismatch =
    cloudGuests != null && cloudGuests !== familyCount
      ? `Cloud has ${cloudGuests}, this device has ${familyCount}`
      : null;

  return (
    <div role="dialog" aria-label="Device connection" className="sync-popover">
      <span className="sync-popover-caret" aria-hidden />
      {syncCode ? (
        <div className="px-3.5 py-3 space-y-2.5 min-w-[280px] max-w-[320px]">
          <div className="flex items-center gap-3">
            <span className={cn("sync-live-dot shrink-0", !syncLive && "opacity-30")} />
            <p className="flex-1 font-headline-md text-[17px] text-primary leading-none">
              {syncLive ? "Live" : "Connecting"}
            </p>
            <button
              type="button"
              onClick={() => {
                clearLocalAccess();
                onClose();
                navigate("/auth");
              }}
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                "sync-unlink-phone",
                "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                "text-primary hover:bg-primary hover:text-on-primary",
                "transition-colors duration-200",
              )}
            >
              <Icon name="smartphone" className="text-[18px]" />
            </button>
          </div>

          <div>
            <p className="font-label-caps text-[8px] tracking-[0.16em] text-secondary">
              Wedding code
            </p>
            <p className="font-headline-md text-primary tracking-[0.18em] text-[20px] mt-1.5">
              {syncCode}
            </p>
            <p className="text-[11px] text-secondary mt-1.5 leading-snug">
              Sync only — guests join via invite link. Buddies & Admin sign in at Auth.
            </p>
            <p
              className={cn(
                "text-[11px] tabular-nums mt-1.5",
                mismatch ? "text-error font-semibold" : "text-secondary",
              )}
            >
              {mismatch ||
                `${familyCount} ${familyCount === 1 ? "family" : "families"} · in sync`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => void copyCode()}
              className="h-10 rounded-full bg-tertiary-container text-on-tertiary-container font-button text-[12px]"
            >
              Copy code
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(session ? "/profile" : "/auth");
              }}
              className="h-10 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[12px]"
            >
              {session ? "Profile" : "Sign in"}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-3 space-y-2.5 min-w-[280px] max-w-[320px]">
          <p className="text-[12px] text-secondary leading-snug">
            Link a wedding for sync, or reconnect from Recent · 24h.
          </p>
          <button
            type="button"
            disabled={syncBusy}
            onClick={() => {
              onClose();
              navigate("/auth");
            }}
            className="w-full h-10 rounded-full bg-primary-container text-on-primary font-button text-[13px] disabled:opacity-60"
          >
            Open Auth
          </button>

          {recent.length ? (
            <div className="pt-1 space-y-1.5">
              <p className="font-label-caps text-[8px] tracking-[0.14em] text-secondary">
                Recent · 24h
              </p>
              {recent.slice(0, 4).map((entry) => (
                <button
                  key={`${entry.weddingCode}-${entry.profileId}`}
                  type="button"
                  onClick={() => onRecentTap(entry)}
                  className="w-full flex items-center gap-2 rounded-xl border border-[rgba(128,0,32,0.1)] px-2 py-2 text-left"
                >
                  <ProfileAvatarBadge avatarId={entry.avatarId as ProfileAvatarId} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-primary truncate">{entry.profileName}</p>
                    <p className="text-[10px] text-secondary tabular-nums tracking-wider">
                      {entry.weddingCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
