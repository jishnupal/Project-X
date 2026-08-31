export type ProfileRole = "super_admin" | "admin" | "buddy" | "guest";

export type ModuleId = "buzz" | "guests" | "menu" | "rooms" | "access";

export type ModuleAccessLevel = "none" | "view" | "edit" | "manage";

export type ModuleGrants = Partial<Record<ModuleId, ModuleAccessLevel>>;

export type ProfileAvatarId =
  | "lotus"
  | "marigold"
  | "peacock"
  | "diya"
  | "swan"
  | "conch"
  | "rangoli"
  | "bell";

export const PROFILE_AVATARS: {
  id: ProfileAvatarId;
  label: string;
  icon: string;
  tint: string;
}[] = [
  { id: "lotus", label: "Lotus", icon: "spa", tint: "#800020" },
  { id: "marigold", label: "Marigold", icon: "local_florist", tint: "#a67c00" },
  { id: "peacock", label: "Peacock", icon: "flutter_dash", tint: "#1a5f4a" },
  { id: "diya", label: "Diya", icon: "lightbulb", tint: "#c45c26" },
  { id: "swan", label: "Swan", icon: "cruelty_free", tint: "#4a5568" },
  { id: "conch", label: "Conch", icon: "water", tint: "#2b6cb0" },
  { id: "rangoli", label: "Rangoli", icon: "palette", tint: "#9b2c2c" },
  { id: "bell", label: "Bell", icon: "notifications", tint: "#744210" },
];

export type WeddingProfile = {
  id: string;
  name: string;
  role: ProfileRole;
  avatarId: ProfileAvatarId;
  moduleGrants: ModuleGrants;
  hasPin: boolean;
  createdAt: number;
  updatedAt: number;
};

export type WeddingDevice = {
  deviceId: string;
  label: string;
  profileId: string;
  lastSeenAt: number;
};

export type AccessSnapshot = {
  profiles: WeddingProfile[];
  devices: WeddingDevice[];
  adminProfileId: string | null;
  enabledModules: ModuleId[];
  guestInviteToken: string | null;
  buddyInviteToken: string | null;
  provisioned: boolean;
};

export type LocalAccessSession = {
  weddingCode: string;
  profileId: string;
  role: ProfileRole;
  moduleGrants: ModuleGrants;
  adminToken: string;
  deviceId: string;
};

export { canAccess, canEditWedding, canManageAccess, roleLabel } from "./permissions";

export function avatarMeta(id: string | undefined) {
  return PROFILE_AVATARS.find((row) => row.id === id) || PROFILE_AVATARS[0];
}
