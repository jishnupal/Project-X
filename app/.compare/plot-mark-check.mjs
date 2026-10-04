import { chromium, devices } from "playwright";

const state = {
  event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "4", scheduleConfirmed: true },
  functions: [
    { id: 1, name: "Sangeet", date: "2026-12-01" },
    { id: 2, name: "Marriage", date: "2026-12-02" },
    { id: 3, name: "Reception", date: "2026-12-03" },
  ],
  guests: [],
  guestGroups: [],
  tasks: [],
  menu: [],
  rooms: [],
  buzz: { welcomeTitle: "Welcome", welcomeMessage: "Come", venueName: "Hall" },
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices["iPhone 14 Pro"], serviceWorkers: "block" });
await context.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
  localStorage.setItem("biyeflow.syncCode", "AAAA1111");
  localStorage.setItem(
    "biyeflow.accessSession",
    JSON.stringify({ weddingCode: "AAAA1111", profileId: "p1", role: "admin", moduleGrants: {}, adminToken: "t", deviceId: "d1" }),
  );
});
const page = await context.newPage();
await page.route("**/api/auth/me", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      user: { id: "u1", email: "a@b.com", name: "Jishnu", avatarUrl: null, platformRole: "customer", hasPasscode: false },
      memberships: [{ id: "m1", eventId: "e1", eventCode: "AAAA1111", eventName: "Bengali wedding", eventType: "wedding", role: "admin", moduleGrants: {}, status: "active", empty: false }],
      removed: [],
    }),
  }),
);
await page.route("**/api/wedding/AAAA1111**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1, state }) }),
);
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
const plot = page.getByRole("button", { name: "The Plot" });
await plot.waitFor({ timeout: 15000 });
const info = await plot.evaluate((el) => {
  const box = el.getBoundingClientRect();
  const text = el.innerText.replace(/\s+/g, " | ");
  const overflow = el.scrollHeight > el.clientHeight + 1;
  return { w: Math.round(box.width), h: Math.round(box.height), text, overflow };
});
console.log(JSON.stringify(info));
await plot.screenshot({ path: "/tmp/plot-card.png" });
await page.locator(".home-entry").first().screenshot({ path: "/tmp/dates-card.png" });
const pair = page.locator(".grid.grid-cols-2").first();
await pair.screenshot({ path: "/tmp/home-pair.png" });
await plot.click();
await page.getByRole("dialog", { name: "The Plot" }).waitFor();
console.log("SHEET", await page.getByRole("dialog", { name: "The Plot" }).getByText("Sangeet").count());
await browser.close();
if (info.overflow || !info.text.includes("Sangeet") || info.text.includes("—")) process.exit(1);
