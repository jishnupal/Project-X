import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { clearEventListHold } from "../domain/access/eventListHold";
import { GlowEffect } from "../components/motion/GlowEffect";
import { useAuth } from "../hooks/useAuth";

/** Same-tab pause, then the host door. The next sign-in asks which Google account. */
export function LeavingPage() {
  const { logout } = useAuth();
  const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    clearEventListHold();
    void logout().catch(() => undefined);
    const timer = window.setTimeout(() => setLeaving(true), calm ? 200 : 900);
    return () => window.clearTimeout(timer);
  }, [logout, calm]);

  return (
    <motion.div
      className="relative min-h-dvh overflow-hidden bg-[#1a100c] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: calm ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (leaving) window.location.replace("/login?stay=1&pick=1");
      }}
    >
      <img
        src="/moodboards/assets/clay-main-day.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <header className="relative z-10 flex h-16 items-center px-6">
        <p className="font-headline-md text-[22px] leading-none text-white">BiyeFlow</p>
      </header>
      <main className="relative z-10 flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <motion.span
          className="relative grid h-28 w-28 place-items-center"
          aria-busy="true"
          aria-label="Signing out"
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: calm ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute -inset-4">
            <GlowEffect mode={calm ? "static" : "breathe"} blur="strong" duration={2.4} />
          </span>
          <span className="relative z-10 h-16 w-16 rounded-full bg-white/90" />
        </motion.span>
      </main>
    </motion.div>
  );
}
