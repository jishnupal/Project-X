import type { ModuleGrants, ModuleId, ProfileRole, WeddingProfile } from "./types";

export type AccessLevel = "none" | "view" | "edit" | "manage";

const LEVEL_RANK: Record<AccessLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3,
};

export const MODULE_IDS: ModuleId[] = ["buzz", "guests", "menu", "rooms", "access"];

export const MODULE_LABELS: Record<ModuleId, string> = {
  buzz: "BUZZ",
  guests: "Guests",
  menu: "Menu",
  rooms: "Rooms",
  access: "Access",
};

const ROLE_DEFAULTS: Record<ProfileRole, Partial<Record<ModuleId, AccessLevel>>> = {
  super_admin: { buzz: "manage", guests: "manage", menu: "manage", rooms: "manage", access: "manage" },
  admin: { buzz: "edit", guests: "edit", menu: "edit", rooms: "edit", access: "manage" },
  buddy: { buzz: "edit", guests: "none", menu: "none", access: "none" },
  guest: { buzz: "view", guests: "none", menu: "none", access: "none" },
};

export function normalizeRole(role: string | null | undefined): ProfileRole {
  if (role === "super_admin" || role === "admin" || role === "buddy" || role === "guest") {
    return role;
  }
  if (role === "member") return "buddy";
  if (role === "viewer") return "guest";
  return "guest";
}

export function effectiveLevel(
  profile: Pick<WeddingProfile, "role" | "moduleGrants"> | null | undefined,
  module: ModuleId,
): AccessLevel {
  if (!profile) return "none";
  const role = normalizeRole(profile.role);
  const grant = profile.moduleGrants?.[module];
  if (grant && grant !== "none") return grant;
  return ROLE_DEFAULTS[role][module] || "none";
}

export function canAccess(
  profile: Pick<WeddingProfile, "role" | "moduleGrants"> | null | undefined,
  module: ModuleId,
  minLevel: AccessLevel,
): boolean {
  return LEVEL_RANK[effectiveLevel(profile, module)] >= LEVEL_RANK[minLevel];
}

export function canEditWedding(
  profile: Pick<WeddingProfile, "role" | "moduleGrants"> | null | undefined,
): boolean {
  return (
    canAccess(profile, "guests", "edit") ||
    canAccess(profile, "menu", "edit") ||
    canAccess(profile, "buzz", "edit")
  );
}

export function canManageAccess(
  profile: Pick<WeddingProfile, "role" | "moduleGrants"> | null | undefined,
): boolean {
  return canAccess(profile, "access", "manage");
}

export function roleLabel(role: ProfileRole | string): string {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return "Super Admin";
  if (normalized === "admin") return "Admin";
  if (normalized === "buddy") return "Buddy";
  return "Guest";
}

export function defaultBuddyGrants(): ModuleGrants {
  return { buzz: "edit" };
}

export function isPinRole(role: ProfileRole | string): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "buddy" || normalized === "super_admin";
}
