import type { WeddingState } from "../types";
import { hydrateWeddingState } from "./localStorageRepository";

export const SYNC_CODE_KEY = "biyeflow.syncCode";
export const ACCOUNT_KEY = "biyeflow.accountCode";
export const SYNC_ACTIVE_KEY = "biyeflow.syncActive";
export const SYNC_META_KEY = "biyeflow.syncMeta";
const PAIR_COOKIE = "bf_pair";
const ACCOUNT_COOKIE = "bf_account";
const PAIR_COOKIE_MAX_AGE = 60 * 60 * 24 * 730;

export const SYNC_CODE_PATTERN = /^[A-Z0-9]{8}$/;

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

type SyncEnvelope = {
  version: 1;
  updatedAt: number;
  state: WeddingState;
};

type SyncMeta = {
  updatedAt: number;
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

export function getSyncMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { updatedAt: 0, lastSyncedAt: null };
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      updatedAt: Number(parsed.updatedAt) || 0,
      lastSyncedAt: parsed.lastSyncedAt ? Number(parsed.lastSyncedAt) : null,
    };
  } catch {
    return { updatedAt: 0, lastSyncedAt: null };
  }
}

export function touchLocalUpdatedAt(at = Date.now()): SyncMeta {
  const meta = { ...getSyncMeta(), updatedAt: at };
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  return meta;
}

export function markSynced(at = Date.now()): SyncMeta {
  const meta = { ...getSyncMeta(), lastSyncedAt: at };
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  return meta;
}

function apiUrl(code: string): string {
  return `/api/wedding/${encodeURIComponent(code)}`;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, cache: "no-store", signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

export async function pullWeddingRevision(code: string): Promise<number | null> {
  const response = await fetchWithTimeout(`${apiUrl(code)}?rev=1`, { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  assertJson(response);
  const payload = (await response.json()) as { updatedAt?: number };
  const updatedAt = Number(payload.updatedAt) || 0;
  return updatedAt || null;
}

export async function pullWedding(
  code: string,
): Promise<{ state: WeddingState; updatedAt: number } | null> {
  const response = await fetchWithTimeout(apiUrl(code), { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  assertJson(response);
  const payload = (await response.json()) as Partial<SyncEnvelope>;
  if (!payload?.state) return null;
  return {
    state: hydrateWeddingState(payload.state),
    updatedAt: Number(payload.updatedAt) || 0,
  };
}

export async function pushWedding(
  code: string,
  state: WeddingState,
  updatedAt: number,
): Promise<void> {
  const envelope: SyncEnvelope = { version: 1, updatedAt, state };
  const response = await fetchWithTimeout(apiUrl(code), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  assertJson(response);
}

function assertJson(response: Response): void {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new Error(
      "Cloud sync only works on https://biyeflow.pages.dev after deploy. Localhost cannot share with your phone.",
    );
  }
}

async function readError(response: Response): Promise<string> {
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
