import { useEffect, useRef } from "react";
import { cn } from "../../design-system/cn";

type InviteFluidBarProps = {
  value: number;
  max: number;
  className?: string;
  /** Sea-wave water physics. Off on Home; on in Invite Tracker. */
  live?: boolean;
};

const W = 220;
const H = 28;

function surfaceY(x: number, t: number, amp: number, k: number, omega: number, phase: number) {
  const mid = H * 0.46;
  const swell = Math.sin(k * x + omega * t + phase) * amp;
  const chop = Math.sin(k * 2.25 * x + omega * 1.65 * t + phase * 0.7) * (amp * 0.4);
  return Math.max(2, Math.min(H - 3, mid + swell + chop));
}

function wavePath(t: number, amp: number, k: number, omega: number, phase: number) {
  const steps = 40;
  let d = `M 0 ${H}`;
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * W;
    d += ` L ${x.toFixed(2)} ${surfaceY(x, t, amp, k, omega, phase).toFixed(2)}`;
  }
  d += ` L ${W} ${H} Z`;
  return d;
}

function crestPath(t: number, amp: number, k: number, omega: number, phase: number) {
  const steps = 40;
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * W;
    d += `${i === 0 ? "M" : " L"} ${x.toFixed(2)} ${surfaceY(x, t, amp, k, omega, phase).toFixed(2)}`;
  }
  return d;
}

const STILL_A = wavePath(0, 3.4, 0.052, 0, 0.4);
const STILL_B = wavePath(0.8, 2.1, 0.088, 0, 1.6);
const STILL_C = crestPath(0, 3.4, 0.052, 0, 0.4);

export function InviteFluidBar({ value, max, className, live = false }: InviteFluidBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const swellRef = useRef<SVGPathElement>(null);
  const chopRef = useRef<SVGPathElement>(null);
  const crestRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!live) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      swellRef.current?.setAttribute("d", wavePath(t, 5.4, 0.05, 2.05, 0));
      chopRef.current?.setAttribute("d", wavePath(t, 3.2, 0.09, 2.85, 1.35));
      crestRef.current?.setAttribute("d", crestPath(t, 5.4, 0.05, 2.05, 0));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [live]);

  return (
    <span
      className={cn("invite-fluid-track", live && "is-live", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <i className="invite-fluid-fill" style={{ width: `${pct}%` }}>
        <svg className="invite-fluid-sea" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <path ref={swellRef} className="invite-fluid-sea__swell" d={STILL_A} />
          <path ref={chopRef} className="invite-fluid-sea__chop" d={STILL_B} />
          <path ref={crestRef} className="invite-fluid-sea__crest" d={STILL_C} fill="none" />
        </svg>
      </i>
    </span>
  );
}
