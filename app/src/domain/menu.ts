import type {
  GrandMealCourse,
  MenuCategories,
  MenuCategory,
  MenuCourse,
  MenuRow,
  MenuStatus,
  WeddingState,
} from "./types";
import { createId } from "./event";
import { resolveDayName, resolveFunctionDateLabel, functionIds } from "./functions";
import { formatINR, parseMoney } from "./money";

export const MENU_COURSES: MenuCourse[] = [
  "Breakfast",
  "Lunch",
  "Evening Snacks",
  "Dinner",
];

export const MENU_CORE_CATEGORIES: MenuCategory[] = [
  "Appetizers",
  "Main Course",
  "Dessert",
];

export const MENU_ALL_CATEGORIES: MenuCategory[] = [
  ...MENU_CORE_CATEGORIES,
  "Live Counter",
];

export function emptyMenuCategoryDraft(): MenuCategories {
  return MENU_ALL_CATEGORIES.reduce((draft, category) => {
    draft[category] = [];
    return draft;
  }, {} as MenuCategories);
}

function normalizeMenuTiming(value: string): MenuCourse {
  const normalized = String(value || "").trim().toLowerCase();
  const legacyMap: Record<string, MenuCourse> = {
    welcome: "Evening Snacks",
    starters: "Evening Snacks",
    starter: "Evening Snacks",
    maincourse: "Dinner",
    main: "Dinner",
    dessert: "Dinner",
    desserts: "Dinner",
    morning: "Breakfast",
    breakfast: "Breakfast",
    lunch: "Lunch",
    evening: "Evening Snacks",
    eveningsnacks: "Evening Snacks",
    snacks: "Evening Snacks",
    dinner: "Dinner",
    supper: "Dinner",
  };
  const key = normalized.replace(/[^a-z]/g, "");
  const mapped = legacyMap[key] ?? (value as MenuCourse);
  return MENU_COURSES.includes(mapped) ? mapped : "Breakfast";
}

export function normalizeMenuStatus(status: string | undefined): MenuStatus {
  const normalized = String(status || "").trim().toLowerCase();
  if (["confirmed", "confirm", "locked", "lock", "final", "approved"].includes(normalized)) {
    return "Confirmed";
  }
  return "Discuss";
}

function hasMenuCategoryData(row: MenuRow): boolean {
  if (!row.categories || typeof row.categories !== "object") return false;
  return MENU_ALL_CATEGORIES.some((category) => {
    const value = row.categories![category];
    if (Array.isArray(value)) return value.some((item) => String(item || "").trim());
    return String(value || "").trim();
  });
}

export function inferMenuItemCategory(item: string, row: MenuRow = {} as MenuRow): MenuCategory {
  const text = String(item || "").toLowerCase();
  if (/\b(live|counter)\b/.test(text)) return "Live Counter";
  if (
    /(dessert|mishti|doi|sandesh|rabri|ice\s*cream|gulab|jamun|sweet|payesh|rosogolla|rasgulla|pudding|brownie|cake|custard|paan)/.test(
      text,
    )
  ) {
    return "Dessert";
  }
  if (
    row.course === "Evening Snacks" ||
    /(appetizer|starter|snack|fry|finger|cutlet|chop|skewer|nachos|dragon|honey\s*chilli|chilli\s*potato|baby\s*corn|spring\s*roll|puchka|chaat|tikka|kebab|mocktail)/.test(
      text,
    )
  ) {
    return "Appetizers";
  }
  return "Main Course";
}

export function normalizeMenuCategories(
  categories: Partial<MenuCategories> | null | undefined,
  row: MenuRow,
): MenuCategories {
  const draft = emptyMenuCategoryDraft();
  if (categories && typeof categories === "object") {
    let hasCategorizedItems = false;
    MENU_ALL_CATEGORIES.forEach((category) => {
      const value = categories[category];
      const rows = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
      draft[category] = rows.map((item) => String(item).trim()).filter(Boolean);
      if (draft[category].length) hasCategorizedItems = true;
    });
    if (hasCategorizedItems || !String(row.items || "").trim()) return draft;
  }

  String(row.items || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      draft[inferMenuItemCategory(item, row)].push(item);
    });
  return draft;
}

export function menuDraftToItems(draft: MenuCategories): string[] {
  return MENU_ALL_CATEGORIES.flatMap((category) => draft[category] || [])
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeMenuRow(row: Partial<MenuRow>): MenuRow {
  const course = normalizeMenuTiming(row.course || "");
  const normalized: MenuRow = {
    id: row.id || createId("mn"),
    day: Number(row.day) || 1,
    course,
    items: row.items || "",
    notes: row.notes || "",
    plateCount: row.plateCount || "",
    rate: row.rate || "",
    estimate: row.estimate || "",
    status: normalizeMenuStatus(row.status),
  };
  normalized.categories = normalizeMenuCategories(row.categories, normalized);
  normalized.items = menuDraftToItems(normalized.categories).join("\n") || normalized.items;
  return normalized;
}

export function normalizeMenu(menu: MenuRow[] | undefined, fallback: MenuRow[]): MenuRow[] {
  const rows = Array.isArray(menu) ? menu.map(normalizeMenuRow) : [];
  const merged = fallback.map((fallbackRow) => {
    const saved = rows.find(
      (row) => Number(row.day) === Number(fallbackRow.day) && row.course === fallbackRow.course,
    );
    return saved || normalizeMenuRow(fallbackRow);
  });
  const extras = rows.filter(
    (row) =>
      !merged.some(
        (kept) => Number(kept.day) === Number(row.day) && kept.course === row.course,
      ),
  );
  return [...merged, ...extras];
}

export function menuItemsArray(row: MenuRow): string[] {
  if (hasMenuCategoryData(row)) {
    return menuDraftToItems(normalizeMenuCategories(row.categories, row));
  }
  return String(row.items || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function categorizeMenuItems(row: MenuRow, items?: string[] | null): MenuCategories {
  if (!items && hasMenuCategoryData(row)) {
    return normalizeMenuCategories(row.categories, row);
  }
  const grouped = emptyMenuCategoryDraft();
  const sourceItems = items ?? menuItemsArray(row);
  sourceItems.forEach((item) => {
    grouped[inferMenuItemCategory(item, row)].push(item);
  });
  return grouped;
}

export function getMenuRow(state: WeddingState, day: number, course: MenuCourse): MenuRow {
  let row = state.menu.find(
    (entry) => Number(entry.day) === Number(day) && entry.course === course,
  );
  if (!row) {
    row = {
      id: createId("mn"),
      day,
      course,
      items: "",
      categories: emptyMenuCategoryDraft(),
      notes: "",
      plateCount: "",
      rate: "",
      estimate: "",
      status: "Discuss",
    };
    state.menu.push(row);
  }
  if (!hasMenuCategoryData(row)) {
    row.categories = normalizeMenuCategories(null, row);
  }
  row.items = menuDraftToItems(row.categories!).join("\n") || row.items;
  return row;
}

export function menuAutoPlateCount(state: WeddingState, day: number): number {
  const dayNumber = Number(day);
  const eventSpecificTotal = state.guests.reduce((sum, row) => {
    if (dayNumber === 1) return sum + parseCount(row.sangeetCount);
    if (dayNumber === 2) return sum + parseCount(row.biyebariCount);
    return sum + parseCount(row.receptionCount || row.count);
  }, 0);
  if (eventSpecificTotal > 0) return eventSpecificTotal;

  const eventTotal = parseCount(state.event.guests);
  if (eventTotal > 0) return eventTotal;

  return state.guests.reduce((sum, row) => sum + parseCount(row.count), 0);
}

function parseCount(value: string | undefined): number {
  const amount = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(amount) ? amount : 0;
}

export function menuEffectivePlateCount(state: WeddingState, row: MenuRow): number {
  const manual = parseCount(row.plateCount);
  if (manual > 0) return manual;
  return menuAutoPlateCount(state, row.day);
}

export function menuRowCost(state: WeddingState, row: MenuRow): number {
  const manualEstimate = String(row.estimate || "").trim();
  if (manualEstimate) {
    const cleaned = manualEstimate.replace(/[^0-9.]/g, "");
    const amount = Number.parseFloat(cleaned);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  const plates = menuEffectivePlateCount(state, row);
  const rate = Number.parseFloat(String(row.rate || "").replace(/[^0-9.]/g, ""));
  return plates * (Number.isFinite(rate) ? rate : 0);
}

export const GRAND_MEAL_COURSES: GrandMealCourse[] = ["Lunch", "Dinner"];

export function isGrandMealCourse(course: MenuCourse | string): course is GrandMealCourse {
  return course === "Lunch" || course === "Dinner";
}

export function defaultGrandMealCourse(rows: MenuRow[]): GrandMealCourse {
  const dinner = rows.find((row) => row.course === "Dinner");
  const lunch = rows.find((row) => row.course === "Lunch");
  if (dinner?.status === "Confirmed") return "Dinner";
  if (lunch?.status === "Confirmed") return "Lunch";
  if (dinner) return "Dinner";
  return "Lunch";
}

export function resolveGrandMealCourse(
  rows: MenuRow[],
  preference?: GrandMealCourse | string | null,
): GrandMealCourse {
  if (
    (preference === "Lunch" || preference === "Dinner") &&
    rows.some((row) => row.course === preference)
  ) {
    return preference;
  }
  return defaultGrandMealCourse(rows);
}

export function toggleGrandMealCourse(course: GrandMealCourse): GrandMealCourse {
  return course === "Dinner" ? "Lunch" : "Dinner";
}

export function menuFeaturedRow(
  rows: MenuRow[],
  preference?: GrandMealCourse | string | null,
): MenuRow {
  const course = resolveGrandMealCourse(rows, preference);
  return (
    rows.find((row) => row.course === course) ||
    rows.find((row) => isGrandMealCourse(row.course)) ||
    rows[0]
  );
}

export function menuSideRows(rows: MenuRow[], featuredId: string): MenuRow[] {
  return rows.filter((row) => row.id !== featuredId);
}

export function compactMenuItems(items: string[], limit = 3): string {
  const visible = items.slice(0, limit);
  const hidden = Math.max(items.length - visible.length, 0);
  if (!visible.length) return "Not added yet";
  return `${visible.join(", ")}${hidden ? ` +${hidden}` : ""}`;
}

export function menuUsesMultiCategory(course: MenuCourse): boolean {
  return course === "Lunch" || course === "Dinner";
}

export function menuSingleCategory(course: MenuCourse): MenuCategory {
  return course === "Evening Snacks" ? "Appetizers" : "Main Course";
}

export function listWithEmptyRow(items: string[]): string[] {
  return items.length ? items : [""];
}

export function applyCategoryItems(
  row: MenuRow,
  category: MenuCategory,
  items: string[],
): MenuRow {
  const grouped = categorizeMenuItems(row);
  grouped[category] = items.map((item) => item.trim()).filter(Boolean);
  return persistMenuCategories(row, grouped);
}

export function applySingleListItems(row: MenuRow, items: string[]): MenuRow {
  const draft = emptyMenuCategoryDraft();
  const single = menuSingleCategory(row.course);
  draft[single] = items.map((item) => item.trim()).filter(Boolean);
  return persistMenuCategories(row, draft);
}

function persistMenuCategories(row: MenuRow, grouped: MenuCategories): MenuRow {
  const normalized = emptyMenuCategoryDraft();
  MENU_ALL_CATEGORIES.forEach((category) => {
    normalized[category] = (grouped[category] || []).map((item) => item.trim()).filter(Boolean);
  });
  return {
    ...row,
    categories: normalized,
    items: menuDraftToItems(normalized).join("\n"),
  };
}

export function miniCardDisplaySections(
  row: MenuRow,
): { label: string; category: MenuCategory }[] {
  if (!menuUsesMultiCategory(row.course)) return [];
  const grouped = categorizeMenuItems(row);
  const sections: { label: string; category: MenuCategory }[] = [];
  if ((grouped.Appetizers || []).length) {
    sections.push({ label: "Appetizers", category: "Appetizers" });
  }
  if ((grouped["Main Course"] || []).length) {
    sections.push({ label: "Main Course", category: "Main Course" });
  }
  if ((grouped.Dessert || []).length) {
    sections.push({ label: "Dessert", category: "Dessert" });
  }
  if ((grouped["Live Counter"] || []).length) {
    sections.push({ label: "Live Counters", category: "Live Counter" });
  }
  if (!sections.length) {
    sections.push({ label: "Main Course", category: "Main Course" });
  }
  return sections;
}

function itemsIncludeAny(items: string[], words: string[]): boolean {
  const text = items.join(" ").toLowerCase();
  return words.some((word) => text.includes(word));
}

export function menuBalanceSuggestions(
  state: WeddingState,
  limit = 5,
  courseByDay: Record<number, MenuCourse> = {},
): string[] {
  const suggestions: string[] = [];
  const defaultFeastCourse = (): MenuCourse => "Dinner";

  functionIds(state).forEach((day) => {
    const course = courseByDay[day] || defaultFeastCourse();
    const row = getMenuRow(state, day, course);
    const items = menuItemsArray(row);
    const label = `${resolveDayName(state, day)} ${course}`;

    if (!items.length) {
      suggestions.push(`${label}: no items are planned yet.`);
      return;
    }

    if (!itemsIncludeAny(items, ["mocktail", "coffee", "tea", "aam panna", "water", "juice", "beverage"])) {
      suggestions.push(`${label}: beverage service is not visible.`);
    }
    if (!itemsIncludeAny(items, ["fry", "cutlet", "chop", "starter", "snack", "finger", "appetizer"])) {
      suggestions.push(`${label}: starter or appetizer signal is missing.`);
    }
    if (!itemsIncludeAny(items, ["paneer", "veg", "vegetable", "dal", "cholar", "aloo", "kofta"])) {
      suggestions.push(`${label}: vegetarian anchor is not obvious.`);
    }
    if (!itemsIncludeAny(items, ["mishti", "sandesh", "rabri", "ice cream", "dessert", "sweet", "doi"])) {
      suggestions.push(`${label}: sweet finish is not visible.`);
    }
  });
  return suggestions.slice(0, limit);
}

export function addAddOnItemToMenu(
  state: WeddingState,
  addOnId: string,
  day: number,
  course: MenuCourse,
  addOns: { id: string; name: string; category: MenuCategory }[],
): WeddingState {
  const addOn = addOns.find((entry) => entry.id === addOnId);
  if (!addOn) return state;

  const next = structuredClone(state);
  const row = getMenuRow(next, day, course);
  const categories = categorizeMenuItems(row);
  const targetCategory = MENU_ALL_CATEGORIES.includes(addOn.category)
    ? addOn.category
    : inferMenuItemCategory(addOn.name, row);
  const seen = new Set(categories[targetCategory].map((item) => item.toLowerCase()));
  if (!seen.has(addOn.name.toLowerCase())) {
    categories[targetCategory].push(addOn.name);
  }
  row.categories = categories;
  row.items = menuDraftToItems(row.categories).join("\n");
  if (row.status === "Confirmed") row.status = "Discuss";

  return next;
}

export function addOnDefaultCourse(addOn: { category: MenuCategory }): MenuCourse {
  if (addOn.category === "Appetizers" || addOn.category === "Live Counter") {
    return "Evening Snacks";
  }
  return "Dinner";
}

export function addOnCategoryDefaultCourse(category: MenuCategory): MenuCourse {
  return category === "Appetizers" || category === "Live Counter" ? "Evening Snacks" : "Dinner";
}

export function formatMenuPlan(state: WeddingState): string {
  const rows = functionIds(state).flatMap((day) =>
    MENU_COURSES.map((course) => {
      const row = getMenuRow(state, day, course);
      const notes = row.notes ? ` | Notes: ${row.notes}` : "";
      const plates = menuEffectivePlateCount(state, row);
      const rate = parseMoney(row.rate);
      const cost = menuRowCost(state, row);
      const commercial = ` | Plates: ${plates} | Rate: ${rate ? formatINR(rate) : "Not set"} | Estimate: ${formatINR(cost)}`;
      return `- ${resolveDayName(state, day)} (${resolveFunctionDateLabel(state, day) || "Date not set"}) | ${course}: ${row.items || "Not set"} | ${row.status}${commercial}${notes}`;
    }),
  );

  const total = state.menu.reduce((sum, row) => sum + menuRowCost(state, row), 0);

  return [
    `${state.event.name || "Bengali wedding"} - day-wise food timing plan`,
    `Catering estimate: ${formatINR(total)}`,
    "",
    ...rows,
  ].join("\n");
}

export function getDialPercentage(row: MenuRow): number {
  const itemCount = menuItemsArray(row).length;
  if (!itemCount) return 0;
  return Math.min(100, Math.max(8, itemCount * 14));
}

// moved to menuDisplay.ts for UI-specific dial fill rules

export function menuItemsForAssistCategory(row: MenuRow, category: MenuCategory): string[] {
  const grouped = categorizeMenuItems(row);
  return grouped[category] || [];
}

export function mealCourseIcon(course: MenuCourse): string {
  const icons: Record<MenuCourse, string> = {
    Breakfast: "breakfast_dining",
    Lunch: "restaurant",
    "Evening Snacks": "bakery_dining",
    Dinner: "dinner_dining",
  };
  return icons[course];
}
