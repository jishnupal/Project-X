import { registerSW } from "virtual:pwa-register";

const BUILD_ID = __BIYEFLOW_BUILD_ID__;
const RELOAD_AT_KEY = "biyeflow.reload.at";
const UPDATED_FLAG = "biyeflow.appUpdated";
const LOCAL_SW_CLEARED_KEY = "biyeflow.local.sw-cleared";
const SHELL_BUILD_KEY = "biyeflow.shellBuild";
const VERSION_POLL_MS = 20_000;
const RELOAD_GUARD_MS = 8_000;

function isLocalDevHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

async function clearLocalServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (!registrations.length && !navigator.serviceWorker.controller) return;

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if (navigator.serviceWorker.controller && !sessionStorage.getItem(LOCAL_SW_CLEARED_KEY)) {
    sessionStorage.setItem(LOCAL_SW_CLEARED_KEY, "1");
    window.location.reload();
  }
}

async function migrateShellCache(): Promise<boolean> {
  const previousBuild = localStorage.getItem(SHELL_BUILD_KEY);
  localStorage.setItem(SHELL_BUILD_KEY, BUILD_ID);
  if (!previousBuild || previousBuild === BUILD_ID || !("caches" in window)) {
    return false;
  }

  const names = await caches.keys();
  const stale = names.filter(
    (name) => name.startsWith("biyeflow") || name.includes("workbox") || name.includes("precache"),
  );
  if (!stale.length) return false;

  await Promise.all(stale.map((name) => caches.delete(name)));
  return true;
}

function reloadToNewBuild(): void {
  const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0);
  if (Date.now() - last < RELOAD_GUARD_MS) return;
  sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
  sessionStorage.setItem(UPDATED_FLAG, "1");
  window.dispatchEvent(new Event("biyeflow:flush-sync"));
  window.setTimeout(() => {
    window.location.reload();
  }, 180);
}

async function readRemoteBuildId(): Promise<string | null> {
  const response = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { buildId?: string };
  return payload.buildId || null;
}

export function startAppUpdateWatcher(): void {
  if (isLocalDevHost()) {
    void clearLocalServiceWorkers();
    return;
  }

  void (async () => {
    if (await migrateShellCache()) {
      reloadToNewBuild();
    }
  })();

  let applying = false;
  let pingTimer = 0;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void applyIncomingBuild();
    },
    onRegisteredSW(_url, registration) {
      const debouncedPing = () => {
        if (document.visibilityState !== "visible") return;
        window.clearTimeout(pingTimer);
        pingTimer = window.setTimeout(() => {
          void registration?.update();
          void checkPublishedBuild();
        }, 800);
      };

      document.addEventListener("visibilitychange", debouncedPing);
      window.addEventListener("focus", debouncedPing);
      window.addEventListener("online", debouncedPing);
      window.setInterval(debouncedPing, VERSION_POLL_MS);
      debouncedPing();
    },
  });

  async function applyIncomingBuild(): Promise<void> {
    if (applying) return;
    applying = true;
    try {
      await updateSW(true);
    } finally {
      applying = false;
    }
    reloadToNewBuild();
  }

  async function checkPublishedBuild(): Promise<void> {
    try {
      const remoteId = await readRemoteBuildId();
      if (!remoteId || remoteId === BUILD_ID) return;
      await applyIncomingBuild();
    } catch {
      /* offline: keep the installed shell */
    }
  }

  if ("serviceWorker" in navigator) {
    let hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      reloadToNewBuild();
    });
  }
}
