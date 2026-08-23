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
}

export interface GuestGroup {
  id: string;
  name: string;
}

export interface WeddingFunction {
  id: number;
  name: string;
  date: string;
  custom?: boolean;
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
}

export interface MenuAddOn {
  id: string;
  name: string;
  category: MenuCategory;
}
