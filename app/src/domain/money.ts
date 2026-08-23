export function parseMoney(value: string | number | undefined): number {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

export function parseCount(value: string | number | undefined): number {
  const amount = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatINR(value: number): string {
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatRupee(value: number): string {
  if (!value) return "TBD";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatRupeeShort(value: number): string {
  if (!value) return "TBD";
  return `Est: ₹${Math.round(value).toLocaleString("en-IN")}`;
}
