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
    id: "schedule",
    label: "Scene",
    shortLabel: "Scene",
    icon: "preview",
    to: "/people/guests",
    module: "guests",
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

/** People section tabs — Menu is now accessed from the Guest page portal, not a tab. */
export const PEOPLE_TABS = [
  { id: "contacts", label: "Contacts", icon: "groups", to: "/people/contacts", module: "guests" as ModuleId },
];

/** @deprecated use PRIMARY_NAV */
export const SIDEBAR_NAV = PRIMARY_NAV;
/** @deprecated use PRIMARY_NAV */
export const MODULE_NAV = PRIMARY_NAV;
