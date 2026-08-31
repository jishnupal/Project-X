import type { ModuleId } from "./access/types";
import type { AppNavItem } from "./navigation";

export type NavContext = {
  isGuest: boolean;
  canManage: boolean;
  canAccessModule: (module: ModuleId, level: "view" | "edit" | "manage") => boolean;
};

export function navItemVisible(item: AppNavItem, ctx: NavContext): boolean {
  if (ctx.isGuest) return Boolean(item.guestVisible);
  if (item.id === "buddies") return ctx.canManage;
  if (item.id === "people") {
    return (
      ctx.canAccessModule("guests", "view") ||
      ctx.canAccessModule("menu", "view") ||
      ctx.canAccessModule("rooms", "view")
    );
  }
  if (item.module) return ctx.canAccessModule(item.module, "view");
  return true;
}

export function navChildActive(pathname: string, item: AppNavItem): boolean {
  if (item.id === "people") {
    return pathname === "/people" || pathname.startsWith("/people/");
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
