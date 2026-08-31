import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { PublicPageShell } from "../components/layout/PublicPageShell";
import { useWeddingState } from "../hooks/useWeddingState";
import { cn } from "../design-system/cn";

export function CreateWeddingPage() {
  const navigate = useNavigate();
  const { createWeddingLink, syncBusy, syncCode, showToast } = useWeddingState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (syncCode) navigate("/auth", { replace: true });
  }, [syncCode, navigate]);

  if (syncCode) return null;

  const onCreate = () => {
    void (async () => {
      setBusy(true);
      setError("");
      try {
        await createWeddingLink();
        navigate("/auth", { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create wedding";
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

      <div
        className={cn(
          "hero-meal-card hero-group-card rounded-[28px] w-full px-6 py-8 text-center landing-fade-in",
        )}
      >
        {error ? (
          <>
            <Icon name="error_outline" className="text-[40px] text-[#f3d58a] mb-3" />
            <h1 className="font-headline-md text-white text-[22px]">Couldn&apos;t create wedding</h1>
            <p className="mt-2 text-[13px] text-white/55 leading-relaxed px-2">{error}</p>
            <p className="mt-3 text-[12px] text-white/40">
              Make sure <code className="text-white/60">npm run dev:api</code> is running on port 8788.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={onCreate}
                disabled={busy || syncBusy}
                className="h-11 rounded-full bg-white/15 text-white font-button text-[13px] border border-white/20 disabled:opacity-40"
              >
                Try again
              </button>
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center rounded-full text-white/70 font-button text-[13px]"
              >
                Back to home
              </Link>
            </div>
          </>
        ) : (
          <>
            <Icon name="favorite" className="text-[36px] text-[#f3d58a] mb-3" filled />
            <h1 className="font-headline-md text-white text-[24px]">Create your wedding</h1>
            <p className="mt-2 text-[13px] text-white/55 leading-relaxed px-1">
              We&apos;ll generate a unique 8-character code and sync your guest list to the cloud.
            </p>
            <button
              type="button"
              data-testid="create-wedding-submit"
              onClick={onCreate}
              disabled={busy || syncBusy}
              className={cn(
                "mt-6 w-full h-12 rounded-full bg-white/15 text-white font-button text-[14px]",
                "border border-[rgba(255,215,140,0.35)] hover:bg-white/20 active:scale-[0.98]",
                "transition-[transform,background-color] disabled:opacity-40",
              )}
            >
              {busy || syncBusy ? "Creating…" : "Create wedding"}
            </button>
          </>
        )}
      </div>
    </PublicPageShell>
  );
}
