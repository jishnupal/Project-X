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
  /** User confirmed the wedding schedule in the dates editor. */
  scheduleConfirmed?: boolean;
}

export type GuestInviteStatus = "Sent" | "Pending";

export interface GuestRow {
  id: string;
  name: string;
  count: string;
  receptionCount: string;
  sangeetCount: string;
  biyebariCount: string;
  borjatriCount: string;
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
}

export interface WeddingState {
  event: EventInfo;
  functions: WeddingFunction[];
  tasks: unknown[];
  research: unknown[];
  reminders: unknown[];
  guests: GuestRow[];
  guestGroups: GuestGroup[];
  menu: MenuRow[];
  theme: Record<string, string>;
  grandMealByDay: Record<string, GrandMealCourse>;
  buzz: BuzzContent;
}

export interface MenuAddOn {
  id: string;
  name: string;
  category: MenuCategory;
}
