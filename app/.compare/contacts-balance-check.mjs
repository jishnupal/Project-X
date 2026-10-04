import { chromium, devices } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["iPhone 14 Pro"],
  serviceWorkers: "block",
});
await context.addInitScript(() => {
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
  localStorage.setItem("biyeflow.syncCode", "AAAA1111");
  localStorage.setItem(
    "biyeflow.accessSession",
    JSON.stringify({
      weddingCode: "AAAA1111",
      profileId: "p1",
      role: "admin",
      moduleGrants: {},
      adminToken: "t",
      deviceId: "d1",
    }),
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
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      version: 1,
      state: {
        event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "", scheduleConfirmed: true },
        guests: [],
        tasks: [],
        buzz: { welcomeTitle: "Welcome", welcomeMessage: "Come", venueName: "Hall" },
        rooms: [],
        menu: [{ id: "m", day: 1, course: "Dinner", items: "Rice", notes: "", plateCount: "", rate: "", status: "Confirmed" }],
        functions: [],
      },
    }),
  }),
);
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
const contacts = page.locator(".home-module-below").getByRole("link", { name: /Contacts/ });
await contacts.waitFor({ timeout: 15000 });
const metrics = await page.evaluate(() => {
  const card = document.querySelector(".home-module-below .home-module");
  const stay = document.querySelector(".home-modules .home-module");
  const box = card.getBoundingClientRect();
  const stayBox = stay.getBoundingClientRect();
  const style = getComputedStyle(card);
  const vw = window.innerWidth;
  return {
    contacts: { x: Math.round(box.x), w: Math.round(box.width), h: Math.round(box.height), rightGap: Math.round(vw - box.right), dir: style.flexDirection },
    stay: { w: Math.round(stayBox.width), h: Math.round(stayBox.height) },
    centered: Math.abs(box.x - (vw - box.right)) < 12,
  };
});
console.log(JSON.stringify(metrics));
await contacts.evaluate((el) => el.click());
await page.waitForURL("**/people/contacts");
await browser.close();
if (!metrics.centered || metrics.contacts.w !== 208 || metrics.contacts.h !== 288) process.exit(1);
if (metrics.contacts.dir !== "column" || metrics.stay.w !== 208 || metrics.stay.h !== 288) process.exit(1);
