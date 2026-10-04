import type { WeddingState } from "../types";
import { hydrateWeddingState } from "./localStorageRepository";
import { loadAccessSession } from "../access/sessionLocal";

export const SYNC_CODE_KEY = "biyeflow.syncCode";
export const ACCOUNT_KEY = "biyeflow.accountCode";
export const SYNC_ACTIVE_KEY = "biyeflow.syncActive";
export const SYNC_META_KEY = "biyeflow.syncMeta";
export const SYNC_META_VERSION_KEY = "biyeflow.syncMeta.v";
const SYNC_META_VERSION = "5";
const PAIR_COOKIE = "bf_pair";
const ACCOUNT_COOKIE = "bf_account";
const PAIR_COOKIE_MAX_AGE = 60 * 60 * 24 * 730;

export const SYNC_CODE_PATTERN = /^[A-Z0-9]{8}$/;

/** Offline UI preview code from /local-people.html — never hits the API. */
export function isLocalPreviewSyncCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return code.trim().toUpperCase() === "LOCALPRE";
}

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export type PushResult =
  | { status: "ok"; version: number }
  | { status: "conflict"; version: number; state: WeddingState };

function writeCookie(name: string, value: string | null): void {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${name}=${value}; Max-Age=${PAIR_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([A-Z0-9]{8}|1)`));
  return match?.[1] || null;
}

function readPairCookie(): string | null {
  const value = readCookie(ACCOUNT_COOKIE) || readCookie(PAIR_COOKIE);
  return value && isValidSyncCode(value) ? value : null;
}

export type SyncMeta = {
  cloudVersion: number;
  dirty: boolean;
  lastSyncedAt: number | null;
};

export function isValidSyncCode(code: string): boolean {
  return SYNC_CODE_PATTERN.test(code.trim().toUpperCase());
}

export function normalizeSyncCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function generateSyncCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function getAccountCode(): string | null {
  try {
    const local = localStorage.getItem(ACCOUNT_KEY) || localStorage.getItem(SYNC_CODE_KEY);
    if (local && isValidSyncCode(local)) {
      writeCookie(ACCOUNT_COOKIE, local);
      return local;
    }
  } catch {
    /* ignore */
  }
  const cookie = readPairCookie();
  if (!cookie) return null;
  try {
    localStorage.setItem(ACCOUNT_KEY, cookie);
  } catch {
    /* ignore */
  }
  return cookie;
}

export function isSyncActive(): boolean {
  try {
    return localStorage.getItem(SYNC_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSyncActive(active: boolean): void {
  try {
    if (active) localStorage.setItem(SYNC_ACTIVE_KEY, "1");
    else localStorage.setItem(SYNC_ACTIVE_KEY, "0");
  } catch {
    /* ignore */
  }
}

export function getStoredSyncCode(): string | null {
  if (!isSyncActive()) return null;
  return getAccountCode();
}

export function clearAccountCode(): void {
  setSyncActive(false);
  try {
    localStorage.removeItem(SYNC_CODE_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* ignore */
  }
  writeCookie(ACCOUNT_COOKIE, null);
  writeCookie(PAIR_COOKIE, null);
}

export function setStoredSyncCode(code: string | null): void {
  if (!code) {
    setSyncActive(false);
    try {
      localStorage.removeItem(SYNC_CODE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  const normalized = normalizeSyncCode(code);
  try {
    localStorage.setItem(ACCOUNT_KEY, normalized);
    localStorage.setItem(SYNC_CODE_KEY, normalized);
  } catch {
    /* ignore */
  }
  writeCookie(ACCOUNT_COOKIE, normalized);
  writeCookie(PAIR_COOKIE, normalized);
  setSyncActive(true);
}

export function rememberAccountFromLegacy(): void {
  const account = getAccountCode();
  if (!account) return;
  try {
    localStorage.setItem(ACCOUNT_KEY, account);
    if (localStorage.getItem(SYNC_ACTIVE_KEY) == null) {
      const hadLiveCode = Boolean(localStorage.getItem(SYNC_CODE_KEY));
      setSyncActive(hadLiveCode);
    }
  } catch {
    /* ignore */
  }
}

function writeMeta(meta: SyncMeta): SyncMeta {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  return meta;
}

function migrateSyncMetaIfNeeded(): void {
  try {
    if (localStorage.getItem(SYNC_META_VERSION_KEY) === SYNC_META_VERSION) return;
    const raw = localStorage.getItem(SYNC_META_KEY);
    let lastSyncedAt: number | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        lastSyncedAt = parsed.lastSyncedAt ? Number(parsed.lastSyncedAt) : null;
      } catch {
        /* ignore */
      }
    }
    writeMeta({ cloudVersion: 0, dirty: false, lastSyncedAt });
    localStorage.setItem(SYNC_META_VERSION_KEY, SYNC_META_VERSION);
  } catch {
    /* ignore */
  }
}

export function getSyncMeta(): SyncMeta {
  migrateSyncMetaIfNeeded();
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { cloudVersion: 0, dirty: false, lastSyncedAt: null };
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      cloudVersion: Number(parsed.cloudVersion) || 0,
      dirty: Boolean(parsed.dirty),
      lastSyncedAt: parsed.lastSyncedAt ? Number(parsed.lastSyncedAt) : null,
    };
  } catch {
    return { cloudVersion: 0, dirty: false, lastSyncedAt: null };
  }
}

export function markDirty(): SyncMeta {
  return writeMeta({ ...getSyncMeta(), dirty: true });
}

export function clearDirty(): SyncMeta {
  return writeMeta({ ...getSyncMeta(), dirty: false });
}

export function setCloudVersion(cloudVersion: number): SyncMeta {
  return writeMeta({ ...getSyncMeta(), cloudVersion });
}

export function markCloudAligned(cloudVersion: number, at = Date.now()): SyncMeta {
  return writeMeta({ cloudVersion, dirty: false, lastSyncedAt: at });
}

function apiUrl(code: string): string {
  return `/api/event/${encodeURIComponent(code)}`;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, cache: "no-store", signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

export async function pullWedding(
  code: string,
): Promise<{ state: WeddingState; version: number } | null> {
  if (isLocalPreviewSyncCode(code)) return null;

  let response: Response;
  try {
    response = await fetchWithTimeout(apiUrl(code), { method: "GET" });
  } catch {
    throw new Error(localApiDownMessage());
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  assertJson(response);
  const payload = (await response.json()) as { version?: number; state?: WeddingState; viewerName?: string };
  if (!payload?.state) return null;
  try {
    if (payload.viewerName) sessionStorage.setItem("biyeflow.viewerName", payload.viewerName);
    else sessionStorage.removeItem("biyeflow.viewerName");
  } catch {
    /* ignore */
  }
  return {
    state: hydrateWeddingState(payload.state),
    version: Number(payload.version) || 0,
  };
}

export async function pushWedding(
  code: string,
  state: WeddingState,
  baseVersion: number,
): Promise<PushResult> {
  if (isLocalPreviewSyncCode(code)) {
    return { status: "ok", version: baseVersion || 1 };
  }

  const body = { state, baseVersion };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const access = loadAccessSession();
  if (
    access?.role === "buddy" &&
    access.weddingCode === code.trim().toUpperCase() &&
    access.adminToken
  ) {
    headers.Authorization = `Bearer ${access.adminToken}`;
  }
  let response: Response;
  try {
    response = await fetchWithTimeout(apiUrl(code), {
      method: "PUT",
      credentials: "same-origin",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(localApiDownMessage());
  }

  assertJson(response);

  if (response.status === 409) {
    const payload = (await response.json()) as {
      version?: number;
      state?: WeddingState;
    };
    if (payload?.state && payload.version) {
      return {
        status: "conflict",
        version: Number(payload.version) || 0,
        state: hydrateWeddingState(payload.state),
      };
    }
    throw new Error("Cloud has a newer copy. Pull and try again.");
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = (await response.json()) as { version?: number };
  return {
    status: "ok",
    version: Number(payload.version) || 0,
  };
}

function localApiDownMessage(): string {
  return "API not running. Keep Vite on 5173 and run npm run dev:api, then open http://127.0.0.1:8788 — or use /local-people.html for offline UI.";
}

function assertJson(response: Response): void {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new Error(
      isLocalDevHost()
        ? localApiDownMessage()
        : "Cloud sync only works on https://biyeflow.pages.dev after deploy.",
    );
  }
}

async function readError(response: Response): Promise<string> {
  if (isLocalDevHost() && [502, 503, 504].includes(response.status)) {
    return localApiDownMessage();
  }
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) return payload.error;
  } catch {
    /* ignore */
  }
  if (response.status === 404) {
    return "Cloud sync is not available on this URL. Open https://biyeflow.pages.dev on both devices.";
  }
  return `Sync failed (${response.status})`;
}
