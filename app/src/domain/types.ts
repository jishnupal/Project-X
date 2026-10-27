export type MenuCourse =
  | "Breakfast"
  | "Lunch"
  | "Evening Snacks"
  | "Dinner";

export type GrandMealCourse = "Lunch" | "Dinner";

export type MenuStatus = "Discuss" | "Confirmed";

export type MenuCategory =
  | "Appetizers"
  | "Main Course"
  | "Dessert"
  | "Live Counter";

export type MenuCategories = Record<MenuCategory, string[]>;

export interface MenuRow {
  id: string;
  day: number;
  course: MenuCourse;
  items: string;
  notes: string;
  plateCount: string;
  rate: string;
  estimate: string;
  status: MenuStatus;
  categories?: MenuCategories;
}

export interface EventInfo {
  name: string;
  city: string;
  startDate: string;
  guests: string;
  /** User confirmed the event schedule in the dates editor. */
  scheduleConfirmed?: boolean;
}

export type GuestInviteStatus = "Sent" | "Pending" | "Claimed";

export interface GuestRow {
  id: string;
  name: string;
  count: string;
  receptionCount: string;
  sangeetCount: string;
  biyebariCount: string;
  borjatriCount: string;
  /** Day-keyed headcounts (Plot / Dates day ids). Preferred over fixed sangeet/etc. */
  dayCounts: Record<string, string>;
  stayCount: string;
  needsStay: boolean;
  checkIn: string;
  nights: string;
  rooms: string;
  invitationSent: boolean;
  inviteStatus: GuestInviteStatus;
  groupId: string;
  /** People from this family counted in the assigned group (0 when unassigned). */
  groupCount: string;
  /** Row clock for cross-device merge (client-local ms). */
  updatedAt: number;
  /** Helper picked from this family for Buddies tasks. */
  isBuddy: boolean;
}

export interface BuddyTask {
  id: string;
  title: string;
  /** GuestRow.id of the helper this task is assigned to. */
  guestId: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GuestGroup {
  id: string;
  name: string;
  /** Row clock for cross-device merge (client-local ms). */
  updatedAt: number;
}

export interface WeddingFunction {
  id: number;
  name: string;
  date: string;
  custom?: boolean;
}

export interface BuzzContent {
  welcomeTitle: string;
  welcomeMessage: string;
  invitationNote: string;
  venueName: string;
  venueAddress: string;
  venueMapUrl: string;
  /** Optional host art for the boarding-pass background. */
  passArtUrl?: string;
  /** Optional still on the handwritten postcard (HTTPS / R2 URL preferred). */
  letterPhotoUrl?: string;
  /** Host film for the invite door — streamed URL (R2), never a fat data URL. */
  letterVideoUrl?: string;
}

export type RoomType = "standard" | "deluxe" | "suite" | "family";

/** Bed layout — primary capacity signal for stay mapping. */
export type RoomBedKind = "double" | "triple" | "quad" | "custom";

export interface Room {
  id: string;
  label: string;
  type: RoomType;
  capacity: number;
  /** Double / triple / quad presets; omit or custom for free capacity. */
  bedKind?: RoomBedKind;
  assignedGuestIds: string[];
  /** People from a family in this room — used when a large family is split. */
  occupancyByGuestId?: Record<string, number>;
  notes: string;
  floor?: string;
}

/** Host opt-in home modules. Stay/Menu off until asked. */
export interface HomeModules {
  stay: boolean;
  menu: boolean;
  /** Host answered the stay/menu question (even if both no). */
  asked?: boolean;
}

export type ActivityAudience = "host" | "guest" | "buddy" | "all";

export type ActivityType =
  | "invite.claimed"
  | "buzz.published"
  | "task.assigned"
  | "task.updated"
  | "broadcast";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  body?: string;
  href?: string;
  audience: ActivityAudience;
  /** Buddy-only: GuestRow.id of assignee */
  targetGuestId?: string;
  /** Optional auth user id targeting */
  targetUserId?: string;
  createdAt: number;
}

export type DayBlockKind =
  | "moment"
  | "travel"
  | "place"
  | "meal"
  | "activity"
  | "note";

export interface DayPlanBlock {
  id: string;
  kind?: DayBlockKind;
  title: string;
  timeStart?: string;
  timeEnd?: string;
  place?: string;
  mapsUrl?: string;
  fromPlace?: string;
  toPlace?: string;
  owner?: string;
  notes?: string;
  order: number;
}

export interface DayPlan {
  dayId: number;
  place?: { label: string; mapsUrl?: string };
  blocks: DayPlanBlock[];
}

export interface WeddingState {
  event: EventInfo;
  functions: WeddingFunction[];
  tasks: BuddyTask[];
  research: unknown[];
  reminders: unknown[];
  guests: GuestRow[];
  guestGroups: GuestGroup[];
  menu: MenuRow[];
  rooms: Room[];
  theme: Record<string, string>;
  grandMealByDay: Record<string, GrandMealCourse>;
  buzz: BuzzContent;
  modules: HomeModules;
  /** In-app notification feed (capped). */
  activity: ActivityItem[];
  /** Optional celebration destination — only when host sets it. */
  destination?: { label: string; mapsUrl?: string };
  /** Per-day run of show keyed by WeddingFunction.id. */
  dayPlans: Record<string, DayPlan>;
}

export interface MenuAddOn {
  id: string;
  name: string;
  category: MenuCategory;
}
