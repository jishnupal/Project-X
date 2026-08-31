import type { ReactNode } from "react";
import { cn } from "../../design-system/cn";

export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

/** Full-screen cream canvas for landing, join, and auth flows. */
export function PublicPageShell({ children, className, narrow }: PublicPageShellProps) {
  return (
    <div className="min-h-dvh bg-surface text-on-surface relative overflow-x-hidden">
      <div className="landing-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div
        className={cn(
          "relative z-10 mx-auto px-5 sm:px-8",
          "pt-[env(safe-area-inset-top,0px)] pb-10 sm:pt-14 sm:pb-14",
          narrow ? "max-w-lg" : "max-w-3xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
