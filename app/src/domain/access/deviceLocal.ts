const DEVICE_ID_KEY = "biyeflow.deviceId";
const DEVICE_LABEL_KEY = "biyeflow.deviceLabel";
const RECENT_ACCESS_KEY = "biyeflow.recentAccess";
const DEVICE_TTL_MS = 24 * 60 * 60 * 1000;

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `dev-${Date.now()}`;
  }
}

export function getDeviceLabel(): string {
  try {
    const saved = localStorage.getItem(DEVICE_LABEL_KEY);
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let label = "Browser";
  if (/iPhone|iPad|iPod/i.test(ua)) label = "iPhone";
  else if (/Android/i.test(ua)) label = "Android";
  else if (/Mac/i.test(ua)) label = "Mac";
  else if (/Windows/i.test(ua)) label = "Windows";
  else if (/CrOS/i.test(ua)) label = "Chromebook";
  try {
    localStorage.setItem(DEVICE_LABEL_KEY, label);
  } catch {
    /* ignore */
  }
  return label;
}

export function setDeviceLabel(label: string): void {
  try {
    localStorage.setItem(DEVICE_LABEL_KEY, label.trim() || getDeviceLabel());
  } catch {
    /* ignore */
  }
}

export type RecentAccessEntry = {
  weddingCode: string;
  profileId: string;
  profileName: string;
  avatarId: string;
  role: string;
  deviceId: string;
  lastSeenAt: number;
};

export function loadRecentAccess(): RecentAccessEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_ACCESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentAccessEntry[];
    const cutoff = Date.now() - DEVICE_TTL_MS;
    return (Array.isArray(parsed) ? parsed : []).filter(
      (row) => row && row.lastSeenAt >= cutoff && row.weddingCode,
    );
  } catch {
    return [];
  }
}

export function rememberRecentAccess(entry: RecentAccessEntry): void {
  const next = [
    entry,
    ...loadRecentAccess().filter(
      (row) =>
        !(row.weddingCode === entry.weddingCode && row.profileId === entry.profileId),
    ),
  ].slice(0, 8);
  try {
    localStorage.setItem(RECENT_ACCESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentAccessForWedding(code: string): void {
  const next = loadRecentAccess().filter((row) => row.weddingCode !== code);
  try {
    localStorage.setItem(RECENT_ACCESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export { DEVICE_TTL_MS };
