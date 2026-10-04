import { cn } from "../../design-system/cn";
import { PROFILE_AVATARS, type ProfileAvatarId } from "../../domain/access/types";
import { Icon } from "../ui/Icon";

export function ProfileAvatarPicker({
  value,
  onChange,
}: {
  value: ProfileAvatarId;
  onChange: (id: ProfileAvatarId) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PROFILE_AVATARS.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            className={cn(
              "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border",
              selected
                ? "border-[#ff6a1a] bg-[rgba(255,106,26,0.08)]"
                : "border-[rgba(87,0,19,0.1)] bg-[#f5ece7]",
            )}
            aria-label={avatar.label}
            aria-pressed={selected}
          >
            <span
              className="h-9 w-9 rounded-full flex items-center justify-center text-white"
              style={{ background: avatar.tint }}
            >
              <Icon name={avatar.icon} className="text-[18px]" />
            </span>
            <span className="text-[9px] font-label-caps tracking-[0.08em] text-secondary">
              {avatar.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ProfileAvatarBadge({
  avatarId,
  size = 40,
}: {
  avatarId: string | undefined;
  size?: number;
}) {
  const avatar = PROFILE_AVATARS.find((row) => row.id === avatarId) || PROFILE_AVATARS[0];
  return (
    <span
      className="rounded-full flex items-center justify-center text-white shrink-0"
      style={{ width: size, height: size, background: avatar.tint }}
      aria-hidden
    >
      <Icon name={avatar.icon} className={size >= 40 ? "text-[20px]" : "text-[16px]"} />
    </span>
  );
}
