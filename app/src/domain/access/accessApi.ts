import type {
  AccessSnapshot,
  ModuleGrants,
  ModuleId,
  ProfileAvatarId,
  WeddingProfile,
} from "./types";

function apiUrl(code: string): string {
  return `/api/wedding/${encodeURIComponent(code)}/access`;
}

async function readError(response: Response): Promise<string> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    const local =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (local) {
      return "API not reachable. Run npm run dev:api and open http://localhost:8788.";
    }
  }
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) return payload.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${response.status})`;
}

async function postAccess<T>(
  code: string,
  body: Record<string, unknown>,
  adminToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
  const response = await fetch(apiUrl(code), {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

const EMPTY_SNAPSHOT: AccessSnapshot = {
  profiles: [],
  devices: [],
  adminProfileId: null,
  enabledModules: ["buzz", "guests", "menu", "rooms", "access"],
  guestInviteToken: null,
  buddyInviteToken: null,
  provisioned: false,
};

export async function fetchAccessSnapshot(code: string): Promise<AccessSnapshot> {
  const response = await fetch(apiUrl(code), { method: "GET", cache: "no-store" });
  if (response.status === 404) return { ...EMPTY_SNAPSHOT };
  if (!response.ok) throw new Error(await readError(response));
  const raw = (await response.json()) as Partial<AccessSnapshot>;
  return {
    ...EMPTY_SNAPSHOT,
    ...raw,
    profiles: Array.isArray(raw.profiles) ? raw.profiles : [],
    devices: Array.isArray(raw.devices) ? raw.devices : [],
  };
}

export async function resolveInviteToken(
  token: string,
): Promise<{ weddingCode: string; kind: "guest" | "buddy" }> {
  const response = await fetch(`/api/invite/${encodeURIComponent(token)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as { weddingCode: string; kind: "guest" | "buddy" };
}

export async function provisionWedding(
  code: string,
  input: { provisionSecret: string; enabledModules?: ModuleId[] },
): Promise<AccessSnapshot> {
  const result = await postAccess<{ snapshot: AccessSnapshot }>(code, {
    action: "provisionWedding",
    ...input,
  });
  return result.snapshot;
}

export async function bootstrapAdminProfile(
  code: string,
  input: {
    deviceId: string;
    deviceLabel: string;
    name: string;
    avatarId: ProfileAvatarId;
    pin: string;
  },
): Promise<{ profile: WeddingProfile; adminToken: string; snapshot: AccessSnapshot }> {
  return postAccess(code, { action: "createWeddingAsAdmin", ...input });
}

export async function joinAsGuest(
  code: string,
  input: {
    inviteToken?: string;
    deviceId: string;
    deviceLabel: string;
    name: string;
    avatarId: ProfileAvatarId;
  },
): Promise<{ profile: WeddingProfile; snapshot: AccessSnapshot }> {
  return postAccess(code, { action: "joinAsGuest", ...input });
}

export async function joinAsBuddy(
  code: string,
  input: {
    inviteToken: string;
    deviceId: string;
    deviceLabel: string;
    name: string;
    avatarId: ProfileAvatarId;
    pin: string;
  },
): Promise<{ profile: WeddingProfile; adminToken: string; snapshot: AccessSnapshot }> {
  return postAccess(code, { action: "joinAsBuddy", ...input });
}

export async function selectExistingProfile(
  code: string,
  input: {
    deviceId: string;
    deviceLabel: string;
    profileId: string;
    pin?: string;
  },
): Promise<{
  profile: WeddingProfile;
  adminToken: string;
  snapshot: AccessSnapshot;
}> {
  return postAccess(code, { action: "selectProfile", ...input });
}

export async function resetAdminPin(
  code: string,
  input: {
    deviceId: string;
    deviceLabel: string;
    pin: string;
    confirmPin: string;
  },
): Promise<{
  profile: WeddingProfile;
  adminToken: string;
  snapshot: AccessSnapshot;
}> {
  return postAccess(code, { action: "resetAdminPin", ...input });
}

export async function restoreProfileSession(
  code: string,
  input: { deviceId: string; profileId: string },
): Promise<{ profile: WeddingProfile; snapshot: AccessSnapshot }> {
  return postAccess(code, { action: "restoreSession", ...input });
}

export async function heartbeatDevice(
  code: string,
  input: { deviceId: string; deviceLabel: string; profileId: string },
): Promise<AccessSnapshot> {
  const result = await postAccess<{ snapshot: AccessSnapshot }>(code, {
    action: "heartbeat",
    ...input,
  });
  return result.snapshot;
}

export async function fetchInviteLinks(
  code: string,
  adminToken: string,
): Promise<{ guestInviteToken: string; buddyInviteToken: string; snapshot: AccessSnapshot }> {
  return postAccess(
    code,
    { action: "getInviteLinks" },
    adminToken,
  );
}

export async function updateBuddyGrants(
  code: string,
  input: { profileId: string; moduleGrants: ModuleGrants; adminToken: string },
): Promise<AccessSnapshot> {
  const result = await postAccess<{ snapshot: AccessSnapshot }>(
    code,
    { action: "updateBuddyGrants", profileId: input.profileId, moduleGrants: input.moduleGrants },
    input.adminToken,
  );
  return result.snapshot;
}

export async function revokeDevice(
  code: string,
  input: { deviceId: string; adminToken: string },
): Promise<AccessSnapshot> {
  const result = await postAccess<{ snapshot: AccessSnapshot }>(
    code,
    { action: "revokeDevice", deviceId: input.deviceId },
    input.adminToken,
  );
  return result.snapshot;
}

export async function updateProfileMeta(
  code: string,
  input: {
    profileId: string;
    name?: string;
    avatarId?: ProfileAvatarId;
    deviceId: string;
  },
): Promise<AccessSnapshot> {
  const result = await postAccess<{ snapshot: AccessSnapshot }>(code, {
    action: "updateProfile",
    ...input,
  });
  return result.snapshot;
}

export function guestInviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/invite/guest/${token}`;
}

export function buddyInviteUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/invite/buddy/${token}`;
}
