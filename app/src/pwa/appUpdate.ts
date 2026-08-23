import { registerSW } from "virtual:pwa-register";

const BUILD_ID = __BIYEFLOW_BUILD_ID__;
const RELOAD_AT_KEY = "biyeflow.reload.at";
const UPDATED_FLAG = "biyeflow.appUpdated";
const VERSION_POLL_MS = 20_000;
const RELOAD_GUARD_MS = 8_000;

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
  let applying = false;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void applyIncomingBuild();
    },
    onRegisteredSW(_url, registration) {
      const ping = () => {
        if (document.visibilityState !== "visible") return;
        void registration?.update();
        void checkPublishedBuild();
      };

      document.addEventListener("visibilitychange", ping);
      window.addEventListener("focus", ping);
      window.addEventListener("online", ping);
      window.setInterval(ping, VERSION_POLL_MS);
      ping();
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
