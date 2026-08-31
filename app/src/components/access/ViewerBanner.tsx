import { useAccess } from "../../hooks/useAccess";
import { cn } from "../../design-system/cn";
import type { ModuleId } from "../../domain/access/types";
import { roleLabel } from "../../domain/access/types";

type ViewerBannerProps = {
  className?: string;
  /** When set, show banner if user has view but not edit on this module. */
  module?: ModuleId;
};

/** Banner when the signed-in profile cannot edit (guest or view-only grant). */
export function ViewerBanner({ className, module }: ViewerBannerProps) {
  const { profile, isGuest, session, canAccessModule } = useAccess();
  if (!session || !profile) return null;

  const viewOnlyModule =
    module &&
    canAccessModule(module, "view") &&
    !canAccessModule(module, "edit");

  if (!isGuest && !viewOnlyModule) return null;

  const role = roleLabel(profile.role);

  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(128,0,32,0.12)] bg-[#fff8f0] px-3 py-2.5 text-[12px] text-secondary",
        className,
      )}
      role="status"
    >
      {isGuest ? (
        <>
          Viewing as <span className="text-primary font-medium">{profile.name}</span> ({role}) —{" "}
          <span className="text-primary font-medium">BUZZ</span> is read-only. Admins manage everything
          from their account.
        </>
      ) : (
        <>
          View-only access for <span className="text-primary font-medium">{module}</span>. Editing is
          turned off for {profile.name}.
        </>
      )}
    </div>
  );
}
