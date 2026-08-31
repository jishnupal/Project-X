import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { PublicPageShell, isLocalDevHost } from "../components/layout/PublicPageShell";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import {
  isValidSyncCode,
  normalizeSyncCode,
} from "../domain/storage/sync";
import { fetchAccessSnapshot } from "../domain/access/accessApi";
import { cn } from "../design-system/cn";

export function JoinWeddingPage() {
  const navigate = useNavigate();
  const { joinWeddingLink, syncBusy, syncCode, unlinkWedding, showToast } = useWeddingState();
  const { clearLocalAccess, refreshAccess } = useAccess();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const localDev = isLocalDevHost();

  const onJoin = () => {
    const code = normalizeSyncCode(joinCode);
    if (!isValidSyncCode(code)) {
      setError("Enter the full 8-character wedding code.");
      return;
    }

    void (async () => {
      setBusy(true);
      setError("");
      try {
        if (syncCode && syncCode !== code) {
          unlinkWedding();
          clearLocalAccess();
        }
        await joinWeddingLink(code);
        await refreshAccess().catch(() => undefined);
        const fresh = await fetchAccessSnapshot(code);
        const hasAdmin = fresh.profiles.some((p) => p.role === "admin");
        navigate("/auth", { replace: true, state: { joined: true, hasAdmin } });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not join wedding";
        setError(message);
        showToast(message);
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <PublicPageShell narrow>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[13px] text-secondary hover:text-primary mb-8 transition-colors"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Home
      </Link>

      <div className="landing-fade-in">
        <p className="font-label-caps text-[10px] tracking-[0.22em] text-[#a67c00]">Join</p>
        <h1 className="font-headline-md text-primary text-[32px] sm:text-[36px] mt-2 leading-tight">
          Enter wedding code
        </h1>
        <p className="mt-3 text-[14px] text-secondary leading-relaxed">
          Ask your planner for the 8-character code, or open a join link from another device.
        </p>
      </div>

      <div className="mt-8 space-y-4 landing-fade-in landing-fade-in-delay">
        <label className="block">
          <span className="sr-only">Wedding code</span>
          <input
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onJoin();
            }}
            maxLength={8}
            autoComplete="off"
            autoFocus
            placeholder="ABCD1234"
            data-testid="join-wedding-code"
            className={cn(
              "w-full h-14 rounded-2xl border bg-white px-4 text-center",
              "text-xl tracking-[0.35em] uppercase text-primary font-medium outline-none",
              "border-[rgba(128,0,32,0.14)] focus:border-[#cca730] focus:ring-2 focus:ring-[rgba(204,167,48,0.25)]",
            )}
          />
        </label>

        {error ? (
          <p className="text-[13px] text-error px-1" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy || syncBusy || !isValidSyncCode(normalizeSyncCode(joinCode))}
          onClick={onJoin}
          data-testid="join-wedding-submit"
          className={cn(
            "w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px]",
            "shadow-[0_14px_28px_-10px_rgba(128,0,32,0.45)]",
            "hover:brightness-110 active:scale-[0.98] transition-[transform,filter]",
            "disabled:opacity-40 disabled:pointer-events-none",
          )}
        >
          {busy || syncBusy ? "Joining…" : "Join wedding"}
        </button>

        {localDev ? (
          <p className="text-[12px] text-secondary text-center leading-relaxed pt-2">
            Local codes only work with{" "}
            <code className="text-[11px]">npm run dev:api</code> on{" "}
            <a href="http://localhost:8788" className="text-primary underline">
              :8788
            </a>
            .
          </p>
        ) : null}
      </div>
    </PublicPageShell>
  );
}
