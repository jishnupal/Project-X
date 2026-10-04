import { getOrCreateDeviceId, getDeviceLabel } from "./access/deviceLocal";
import { getPushPermission } from "./pushPermission";

const ARMED_KEY = "biyeflow.pushArmed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function armedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ARMED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markPushArmed(eventKey: string): void {
  try {
    const key = eventKey.trim().toUpperCase();
    if (!key) return;
    const map = armedMap();
    map[key] = Date.now();
    localStorage.setItem(ARMED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function isPushArmedLocally(eventKey: string): boolean {
  const key = eventKey.trim().toUpperCase();
  if (!key) return false;
  return Boolean(armedMap()[key]);
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-public-key", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return data.publicKey || null;
  } catch {
    return null;
  }
}

export async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return (await reg.pushManager.getSubscription()) || null;
  } catch {
    return null;
  }
}

export type PushEnableResult = { ok: boolean; reason?: string; armed?: boolean };

/** Subscribe + save endpoint to the server. Safe to call repeatedly when permission is already granted. */
export async function enableWebPush(event: {
  eventId?: string | null;
  eventCode?: string | null;
}): Promise<PushEnableResult> {
  const current = getPushPermission();
  if (current === "unsupported") return { ok: false, reason: "unsupported" };
  // Browsers won't show the prompt again after Don't Allow — surface recovery UX instead.
  if (current === "denied") return { ok: false, reason: "blocked" };

  if (current === "default") {
    const permission = await Notification.requestPermission();
    if (permission === "denied") return { ok: false, reason: "blocked" };
    if (permission !== "granted") return { ok: false, reason: "dismissed" };
  }

  const eventCode = String(event.eventCode || "").trim().toUpperCase();
  const eventId = String(event.eventId || "").trim();
  if (!eventCode && !eventId) return { ok: false, reason: "missing_event" };

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return { ok: false, reason: "not_configured" };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "bad_subscription" };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: getOrCreateDeviceId(),
      deviceLabel: getDeviceLabel(),
      eventId: eventId || undefined,
      eventCode: eventCode || undefined,
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, reason: data.error || "subscribe_failed" };
  }
  markPushArmed(eventCode || eventId);
  return { ok: true, armed: true };
}

/** If OS permission is already granted, quietly register this device for the open event. */
export async function ensureWebPushRegistered(event: {
  eventId?: string | null;
  eventCode?: string | null;
}): Promise<PushEnableResult> {
  if (getPushPermission() !== "granted") {
    return { ok: false, reason: getPushPermission() === "denied" ? "blocked" : "needs_permission" };
  }
  return enableWebPush(event);
}

export async function dispatchPushNotify(input: {
  eventId?: string | null;
  eventCode?: string | null;
  type: string;
  title: string;
  body?: string;
  href?: string;
  audience: string;
  targetGuestId?: string;
  targetUserId?: string;
}): Promise<{ ok: boolean; sent?: number; reason?: string }> {
  try {
    const res = await fetch("/api/push/dispatch", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      sent?: number;
      reason?: string;
      error?: string;
    };
    if (!res.ok) return { ok: false, reason: data.error || "dispatch_failed" };
    return { ok: true, sent: data.sent ?? 0, reason: data.reason };
  } catch {
    return { ok: false, reason: "network" };
  }
}
