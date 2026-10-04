/**
 * Host native shell bridge (Capacitor-ready stubs).
 * No-ops on web; real plugins plug in when Capacitor is installed.
 */

export type NativeContactsPermission = "granted" | "denied" | "prompt" | "unavailable";

export function isNativeHostShell(): boolean {
  try {
    return Boolean((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

/** Universal / App Link targets that should open the web letter when the app is missing. */
export function webLetterPathForClaim(claimCode: string): string {
  return `/claim/${encodeURIComponent(claimCode)}`;
}

export async function requestHostContactsPermission(): Promise<NativeContactsPermission> {
  if (!isNativeHostShell()) return "unavailable";
  // Capacitor Contacts plugin hooks here later.
  return "prompt";
}

export async function registerHostPush(): Promise<{ ok: boolean; token?: string }> {
  if (!isNativeHostShell()) return { ok: false };
  // Capacitor PushNotifications hooks here later.
  return { ok: false };
}
