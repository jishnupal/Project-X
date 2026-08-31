import { useEffect, useState } from "react";
import { cn } from "../../design-system/cn";

const DISMISS_KEY = "biyeflow.install-hint.dismissed";

function isIosDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isChromeOnIos() {
  return /CriOS/.test(navigator.userAgent);
}

export function InstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosDevice() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const chrome = isChromeOnIos();

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[70]",
        "lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm lg:inset-x-auto",
        "rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-lg",
      )}
      role="status"
    >
      <p className="font-headline text-headline-sm text-on-surface mb-1">
        Add BiyeFlow to Home Screen
      </p>
      <p className="text-body-sm text-on-surface-variant mb-3">
        {chrome
          ? "On iPhone, install works in Safari only — not Chrome. Copy the link, open Safari, then:"
          : "Tap Share, then Add to Home Screen. You'll get a BiyeFlow icon that opens like an app."}
      </p>
      {chrome ? (
        <ol className="text-body-sm text-on-surface-variant list-decimal list-inside space-y-1 mb-3">
          <li>Open <strong className="text-on-surface">biyeflow.pages.dev</strong> in Safari</li>
          <li>Tap Share (square with arrow)</li>
          <li>Tap <strong className="text-on-surface">Add to Home Screen</strong></li>
        </ol>
      ) : (
        <p className="text-body-sm text-on-surface-variant mb-3">
          Share <span className="font-medium text-on-surface">→</span> Add to Home Screen
        </p>
      )}
      <button
        type="button"
        className="text-label-caps text-primary font-button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
      >
        Got it
      </button>
    </div>
  );
}
