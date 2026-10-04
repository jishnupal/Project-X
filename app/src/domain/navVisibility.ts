import type { ModuleId } from "./access/types";
import type { AppNavItem } from "./navigation";

export type NavContext = {
  isGuest: boolean;
  isBuddy: boolean;
  canManage: boolean;
  canAccessModule: (module: ModuleId, level: "view" | "edit" | "manage") => boolean;
};

export function navItemVisible(item: AppNavItem, ctx: NavContext): boolean {
  if (ctx.isBuddy) return item.id === "buddies" || item.id === "buzz";
  if (ctx.isGuest) return Boolean(item.guestVisible);
  if (item.id === "buddies") return ctx.canManage;
  if (item.module) return ctx.canAccessModule(item.module, "view");
  return true;
}

export function navChildActive(pathname: string, item: AppNavItem): boolean {
  if (item.id === "schedule") {
    return pathname === "/people/guests" || pathname.startsWith("/people/guests/");
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
