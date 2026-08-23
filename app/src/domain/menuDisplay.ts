import type { MenuCourse, MenuRow, WeddingState } from "./types";
import { menuEffectivePlateCount, menuItemsArray } from "./menu";
import { parseCount, parseMoney } from "./money";

/** Short dial label — reference uses "Snacks" not "Evening Snacks" */
export function dialCourseLabel(course: MenuCourse): string {
  return course === "Evening Snacks" ? "Snacks" : course;
}

/** Plates shown on commercial dials — TBD when no items and no manual count */
export function menuCommercialPlateCount(state: WeddingState, row: MenuRow): number {
  const manual = parseCount(row.plateCount);
  if (manual > 0) return manual;
  if (!menuItemsArray(row).length) return 0;
  return menuEffectivePlateCount(state, row);
}

export function menuCommercialEstimate(state: WeddingState, row: MenuRow): number {
  const plates = menuCommercialPlateCount(state, row);
  const rate = parseMoney(row.rate);
  if (!plates || !rate) return 0;
  const manualEstimate = String(row.estimate || "").trim();
  if (manualEstimate) return parseMoney(manualEstimate);
  return plates * rate;
}

/** Dial ring fill % — matches reference visual language */
export function getDialPercentage(row: MenuRow, plates: number): number {
  const items = menuItemsArray(row);
  if (!items.length && plates === 0) return 0;
  if (row.status === "Confirmed" && plates > 0) return 100;
  if (plates > 0 && items.length > 0) {
    if (row.course === "Breakfast") return 75;
    if (row.course === "Dinner") return 40;
    if (row.course === "Lunch") return 100;
  }
  if (items.length > 0) return Math.min(100, Math.max(8, items.length * 14));
  return 0;
}

export function dayCommercialTotals(
  state: WeddingState,
  rows: MenuRow[],
): { plates: number; estimate: number; configured: number } {
  let plates = 0;
  let estimate = 0;
  let configured = 0;

  rows.forEach((row) => {
    const p = menuCommercialPlateCount(state, row);
    const e = menuCommercialEstimate(state, row);
    if (p > 0) {
      plates += p;
      configured += 1;
    }
    if (e > 0) estimate += e;
  });

  return { plates, estimate, configured };
}
export function miniCardStatusLabel(row: MenuRow): string {
  const count = menuItemsArray(row).length;
  if (!count) return "Menu not yet finalized";
  if (row.status === "Confirmed") return `${count} Items • Confirmed`;
  if (row.course === "Breakfast") return `${count} Items • Pending Approval`;
  return `${count} Items • In Discussion`;
}
