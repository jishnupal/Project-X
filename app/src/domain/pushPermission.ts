export type PushPermission = "unsupported" | "default" | "granted" | "denied";

export function getPushPermission(): PushPermission {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  const value = Notification.permission;
  if (value === "granted") return "granted";
  if (value === "denied") return "denied";
  return "default";
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(media || iosStandalone);
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export type PushHelpStep = { title: string; detail: string };

/** Clear steps after someone taps “Don’t Allow” — browsers won’t ask again. */
export function getBlockedPushSteps(): PushHelpStep[] {
  const pwa = isStandalonePwa();
  if (isIosDevice()) {
    if (pwa) {
      return [
        {
          title: "Open iPhone Settings",
          detail: "Scroll to BiyeFlow (Home Screen apps sit near the bottom).",
        },
        {
          title: "Tap Notifications",
          detail: "Turn Allow Notifications on.",
        },
        {
          title: "Come back here",
          detail: "Open BiyeFlow again, then tap Turn alerts on.",
        },
      ];
    }
    return [
      {
        title: "Add BiyeFlow to Home Screen",
        detail: "Share → Add to Home Screen. Banner alerts need the Home Screen app.",
      },
      {
        title: "Open from the icon",
        detail: "Launch BiyeFlow from Home Screen (not Safari), then allow alerts.",
      },
      {
        title: "If you already tapped Don’t Allow",
        detail: "Settings → BiyeFlow → Notifications → Allow, then reopen the app.",
      },
    ];
  }
  if (isAndroidDevice()) {
    if (pwa) {
      return [
        {
          title: "Long-press the BiyeFlow icon",
          detail: "Open Site settings or App info.",
        },
        {
          title: "Notifications → Allow",
          detail: "Turn notifications on for BiyeFlow.",
        },
        {
          title: "Return to the app",
          detail: "Tap Turn alerts on again.",
        },
      ];
    }
    return [
      {
        title: "Tap the lock / info icon in the address bar",
        detail: "Open Permissions or Site settings.",
      },
      {
        title: "Notifications → Allow",
        detail: "Then tap Turn alerts on again in BiyeFlow.",
      },
    ];
  }
  return [
    {
      title: "Click the lock icon in the address bar",
      detail: "Open Site settings or Permissions.",
    },
    {
      title: "Set Notifications to Allow",
      detail: "Reload BiyeFlow, then tap Turn alerts on.",
    },
  ];
}
