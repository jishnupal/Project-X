import type { LocalAccessSession, ProfileRole } from "./types";
import { normalizeRole } from "./permissions";

const ACCESS_SESSION_KEY = "biyeflow.accessSession";

export function loadAccessSession(): LocalAccessSession | null {
  try {
    const raw = localStorage.getItem(ACCESS_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalAccessSession>;
    if (!parsed.weddingCode || !parsed.profileId || !parsed.deviceId) return null;
    return {
      weddingCode: String(parsed.weddingCode).toUpperCase(),
      profileId: String(parsed.profileId),
      role: normalizeRole(parsed.role) as ProfileRole,
      moduleGrants:
        parsed.moduleGrants && typeof parsed.moduleGrants === "object"
          ? parsed.moduleGrants
          : {},
      adminToken: String(parsed.adminToken || ""),
      deviceId: String(parsed.deviceId),
    };
  } catch {
    return null;
  }
}

export function saveAccessSession(session: LocalAccessSession): void {
  localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify(session));
}

export function clearAccessSession(): void {
  try {
    localStorage.removeItem(ACCESS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function patchAccessSession(partial: Partial<LocalAccessSession>): LocalAccessSession | null {
  const current = loadAccessSession();
  if (!current) return null;
  const next = { ...current, ...partial };
  saveAccessSession(next);
  return next;
}
