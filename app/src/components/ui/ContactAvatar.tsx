import { findLinkedProfiles } from "../../domain/access/profileMatch";
import type { ProfileRole, WeddingProfile } from "../../domain/access/types";
import { useAccess } from "../../hooks/useAccess";
import { ProfileAvatarBadge } from "../access/ProfileAvatarPicker";
import { Icon } from "./Icon";
import { cn } from "../../design-system/cn";

const CONTACT_TONES = [
  "#c7c7cc",
  "#8e8e93",
  "#64d2ff",
  "#5ac8fa",
  "#7d7aff",
  "#bf5af2",
  "#ff6482",
  "#ff9f0a",
  "#30d158",
];

function toneForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i) * (i + 3)) % 997;
  return CONTACT_TONES[hash % CONTACT_TONES.length];
}

function RolePip({ role, size }: { role: ProfileRole; size: number }) {
  const pip = Math.max(10, Math.round(size * 0.38));
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#1a100c] text-white grid place-items-center ring-2 ring-white"
      style={{ width: pip, height: pip }}
      title={role === "buddy" ? "Buddy" : "Guest"}
    >
      <Icon
        name={role === "buddy" ? "handshake" : "person"}
        className="text-[8px] leading-none"
      />
    </span>
  );
}

export function GeneratedContactAvatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("rounded-full grid place-items-center shrink-0 text-white", className)}
      style={{ width: size, height: size, background: toneForName(name || "guest") }}
      aria-hidden
    >
      <Icon name="person" className={size >= 36 ? "text-[18px]" : "text-[15px]"} />
    </span>
  );
}

export function ContactAvatar({
  name,
  size = 32,
  className,
  profiles,
}: {
  name: string;
  size?: number;
  className?: string;
  profiles?: WeddingProfile[] | null;
}) {
  const { snapshot } = useAccess();
  const linked = findLinkedProfiles(name, profiles ?? snapshot?.profiles);
  const first = linked[0];
  if (!first) {
    return <GeneratedContactAvatar name={name} size={size} className={className} />;
  }
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <ProfileAvatarBadge avatarId={first.avatarId} size={size} />
      <RolePip role={first.role} size={size} />
    </span>
  );
}

export function FamilyContactAvatars({
  name,
  size = 32,
  max = 3,
}: {
  name: string;
  size?: number;
  max?: number;
}) {
  const { snapshot } = useAccess();
  const linked = findLinkedProfiles(name, snapshot?.profiles);
  if (linked.length === 0) {
    return <GeneratedContactAvatar name={name} size={size} />;
  }
  return (
    <span className="flex -space-x-2">
      {linked.slice(0, max).map((profile) => (
        <span key={profile.id} className="relative inline-flex shrink-0">
          <ProfileAvatarBadge avatarId={profile.avatarId} size={size} />
          <RolePip role={profile.role} size={size} />
        </span>
      ))}
    </span>
  );
}
