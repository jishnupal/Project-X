import { useState } from "react";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

export function SyncPopover({ onClose }: { onClose: () => void }) {
  const {
    syncCode,
    syncBusy,
    syncLive,
    createWeddingLink,
    joinWeddingLink,
    unlinkWedding,
    showToast,
  } = useWeddingState();
  const [joinCode, setJoinCode] = useState("");
  const [freshCode, setFreshCode] = useState(false);

  const onCreate = async () => {
    try {
      await createWeddingLink();
      setFreshCode(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create wedding code");
    }
  };

  const onJoin = async () => {
    try {
      await joinWeddingLink(joinCode);
      setJoinCode("");
      setFreshCode(false);
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not join wedding");
    }
  };

  const copyCode = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      showToast("Code copied");
    } catch {
      showToast("Could not copy");
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Device connection"
      className="sync-popover"
    >
      <span className="sync-popover-caret" aria-hidden />
      {syncCode && !freshCode ? (
        <div className="flex items-center gap-3 pl-3.5 pr-2 py-2.5 min-w-[228px]">
          <span className={cn("sync-live-dot shrink-0", !syncLive && "opacity-30")} />
          <p className="flex-1 font-headline-md text-[17px] text-primary leading-none">
            {syncLive ? "Logged in" : "Connecting"}
          </p>
          <button
            type="button"
            onClick={() => {
              unlinkWedding();
              onClose();
            }}
            aria-label="Unlink device"
            title="Unlink device"
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
      ) : syncCode && freshCode ? (
        <div className="px-3.5 py-3 space-y-2.5 min-w-[260px]">
          <p className="font-label-caps text-[9px] tracking-[0.18em] text-tertiary uppercase">
            Other device
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-headline-md text-primary tracking-[0.22em] text-base">
              {syncCode}
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="h-8 px-3 rounded-full bg-tertiary-container text-on-tertiary-container font-button text-[11px]"
            >
              Copy
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-3 space-y-2.5 min-w-[260px]">
          <button
            type="button"
            disabled={syncBusy}
            onClick={() => void onCreate()}
            className="w-full h-10 rounded-full bg-primary-container text-on-primary font-button text-[13px] disabled:opacity-60"
          >
            {syncBusy ? "Creating…" : "Create code"}
          </button>
          <div className="flex gap-1.5">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="CODE"
              className={cn(
                "flex-1 h-10 rounded-full border border-tertiary-container/50 bg-white px-3",
                "text-xs tracking-[0.2em] uppercase text-primary",
                "outline-none focus:border-tertiary-container",
              )}
              autoCapitalize="characters"
              autoCorrect="off"
            />
            <button
              type="button"
              disabled={syncBusy || joinCode.length < 8}
              onClick={() => void onJoin()}
              className="h-10 px-4 rounded-full bg-tertiary-container text-on-tertiary-container font-button text-[13px] disabled:opacity-40"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
