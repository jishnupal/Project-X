const WELCOMED_KEY = "biyeflow.welcomed";

function isLocalHost(): boolean {
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

function isStandaloneApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function hideLaunchSplash(): void {
  document.documentElement.classList.remove("has-welcome");
  const splash = document.getElementById("launch-splash");
  if (!splash) return;
  splash.classList.add("is-out");
  window.setTimeout(() => splash.remove(), 420);
}

function shouldPlayWelcome(): boolean {
  if (isLocalHost()) return false;
  if (!isStandaloneApp()) return false;
  if (sessionStorage.getItem(WELCOMED_KEY) === "1") return false;
  return true;
}

export async function runLaunchSequence(): Promise<void> {
  window.setTimeout(hideLaunchSplash, 2200);

  if (!shouldPlayWelcome()) {
    hideLaunchSplash();
    return;
  }

  sessionStorage.setItem(WELCOMED_KEY, "1");
  window.dispatchEvent(new Event("biyeflow:launch-refresh"));
  await new Promise((resolve) => window.setTimeout(resolve, 1400));
  hideLaunchSplash();
}
