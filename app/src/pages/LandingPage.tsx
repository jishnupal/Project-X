import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { PublicPageShell, isLocalDevHost } from "../components/layout/PublicPageShell";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { cn } from "../design-system/cn";

export function LandingPage() {
  const navigate = useNavigate();
  const { clearLocalAccess } = useAccess();
  const { syncCode, unlinkWedding } = useWeddingState();
  const localDev = isLocalDevHost();
  const [resetting, setResetting] = useState(false);

  const startFresh = () => {
    setResetting(true);
    unlinkWedding();
    clearLocalAccess();
    window.setTimeout(() => setResetting(false), 200);
  };

  return (
    <PublicPageShell>
      <header className="text-center mb-8 sm:mb-14 landing-fade-in">
        <p className="font-label-caps text-[9px] sm:text-[11px] tracking-[0.28em] text-[#a67c00] mb-2 sm:mb-3">
          Premium Wedding OS
        </p>
        <h1 className="font-headline-md text-primary text-[36px] sm:text-[56px] leading-[0.95] tracking-[-0.02em]">
          BiyeFlow
        </h1>
        <p className="mt-3 sm:mt-4 text-[14px] sm:text-[17px] text-secondary max-w-md mx-auto leading-relaxed">
          Plan guests, menus, and buzz — one beautiful command center for your wedding.
        </p>
      </header>

      {syncCode ? (
        <section
          className="mb-5 rounded-[24px] border border-[rgba(128,0,32,0.14)] bg-white/85 backdrop-blur-sm p-5 landing-fade-in"
          data-testid="landing-resume"
        >
          <p className="font-label-caps text-[9px] tracking-[0.16em] text-secondary mb-1">Linked wedding</p>
          <p className="font-headline-md text-primary text-[22px] tracking-[0.14em]">{syncCode}</p>
          <p className="text-[13px] text-secondary mt-1 mb-4">Pick up where you left off, or start fresh below.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="flex-1 h-11 rounded-full bg-primary text-on-primary font-button text-[13px]"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={startFresh}
              disabled={resetting}
              className="flex-1 h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-secondary font-button text-[13px]"
            >
              Start fresh
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 landing-fade-in landing-fade-in-delay">
        <Link
          to="/create"
          data-testid="landing-create"
          className={cn(
            "landing-action-card hero-meal-card hero-group-card group",
            "rounded-[22px] sm:rounded-[28px] p-5 sm:p-7 min-h-0 sm:min-h-[168px] flex flex-col justify-between",
            "transition-[transform,filter] duration-200 hover:brightness-[1.04] active:scale-[0.985]",
          )}
        >
          <div>
            <span className="inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/15 mb-3 sm:mb-4">
              <Icon name="favorite" className="text-[18px] sm:text-[22px] text-[#f3d58a]" filled />
            </span>
            <h2 className="font-headline-md text-white text-[20px] sm:text-[26px] leading-tight">
              Create a wedding
            </h2>
            <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] text-white/55 leading-relaxed">
              Start fresh. Get a wedding code and set up your Admin profile in under a minute.
            </p>
          </div>
          <span className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-label-caps tracking-[0.16em] text-[#f3d58a]/90">
            Get started
            <Icon name="arrow_forward" className="text-[16px] transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          to="/join"
          data-testid="landing-join"
          className={cn(
            "landing-action-card landing-action-card--gold group",
            "rounded-[22px] sm:rounded-[28px] p-5 sm:p-7 min-h-0 sm:min-h-[168px] flex flex-col justify-between",
            "border border-[rgba(204,167,48,0.35)] bg-white/80 backdrop-blur-sm shadow-[0_20px_50px_-20px_rgba(128,0,32,0.18)]",
            "transition-[transform,box-shadow] duration-200 hover:shadow-[0_24px_56px_-18px_rgba(128,0,32,0.22)] active:scale-[0.985]",
          )}
        >
          <div>
            <span className="inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[rgba(128,0,32,0.06)] border border-[rgba(128,0,32,0.12)] mb-3 sm:mb-4">
              <Icon name="qr_code_2" className="text-[18px] sm:text-[22px] text-primary" />
            </span>
            <h2 className="font-headline-md text-primary text-[20px] sm:text-[26px] leading-tight">
              Join a wedding
            </h2>
            <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[13px] text-secondary leading-relaxed">
              Enter the 8-character code from your planner or scan a join link from another device.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-label-caps tracking-[0.16em] text-primary/70">
            Enter code
            <Icon name="arrow_forward" className="text-[16px] transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {localDev ? (
        <aside
          className="mt-8 rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white/70 backdrop-blur-sm px-4 py-3.5 text-[12px] text-secondary leading-relaxed landing-fade-in landing-fade-in-delay-2"
          data-testid="landing-local-dev"
        >
          <span className="font-medium text-primary">Local dev</span> — use{" "}
          <a href="http://localhost:8788" className="text-primary underline underline-offset-2">
            localhost:8788
          </a>{" "}
          with <code className="text-[11px] bg-[rgba(128,0,32,0.06)] px-1.5 py-0.5 rounded">npm run dev:api</code>{" "}
          running. Production wedding codes won&apos;t work on this machine.
        </aside>
      ) : null}

      <p className="mt-10 text-center text-[11px] text-secondary/80 font-label-caps tracking-[0.14em] landing-fade-in landing-fade-in-delay-2">
        Guests usually join via invite link · Admin & Buddies start here
      </p>
    </PublicPageShell>
  );
}
