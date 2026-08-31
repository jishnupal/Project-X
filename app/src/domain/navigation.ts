import type { ModuleId } from "./access/types";

export type AppNavItem = {
  id: string;
  label: string;
  icon: string;
  to: string;
  module?: ModuleId;
  guestVisible?: boolean;
  /** Shorter label for mobile bottom nav */
  shortLabel?: string;
};

/** Unified app navigation — flat items everywhere (no sidebar sub-menus). */
export const PRIMARY_NAV: AppNavItem[] = [
  {
    id: "command-center",
    label: "Command Center",
    shortLabel: "Home",
    icon: "dashboard",
    to: "/command-center",
    guestVisible: false,
  },
  {
    id: "people",
    label: "People",
    shortLabel: "People",
    icon: "groups",
    to: "/people",
    guestVisible: false,
  },
  {
    id: "buzz",
    label: "Buzz",
    shortLabel: "Buzz",
    icon: "campaign",
    to: "/buzz",
    module: "buzz",
    guestVisible: true,
  },
  {
    id: "buddies",
    label: "Buddies",
    shortLabel: "Buddies",
    icon: "handshake",
    to: "/buddies",
    module: "access",
    guestVisible: false,
  },
];

/** People section tabs — Guests + Menu. Rooms stays at /people/rooms (e.g. Need stay). */
export const PEOPLE_TABS = [
  { id: "guests", label: "Guests", icon: "groups", to: "/people/guests", module: "guests" as ModuleId },
  { id: "menu", label: "Menu", icon: "restaurant", to: "/people/menu", module: "menu" as ModuleId },
];

/** @deprecated use PRIMARY_NAV */
export const SIDEBAR_NAV = PRIMARY_NAV;
/** @deprecated use PRIMARY_NAV */
export const MODULE_NAV = PRIMARY_NAV;
