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
      user: { id: "u1", email: "jishnu@example.com", name: "Jishnu Roni", avatarUrl: null, platformRole: "customer", hasPasscode: false },
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
        event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "1", scheduleConfirmed: true },
        guests: [],
        tasks: [],
        buzz: { welcomeTitle: "Welcome", welcomeMessage: "Come", venueName: "Hall" },
        rooms: [],
        functions: [],
      },
    }),
  }),
);
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "networkidle" });
const link = page.getByRole("link", { name: "Scene" });
await link.waitFor({ timeout: 15000 });
const icon = await link.locator(".material-symbols-outlined").evaluate((el) => ({
  name: el.textContent,
  font: getComputedStyle(el).fontFamily,
  width: Math.round(el.getBoundingClientRect().width),
}));
console.log(JSON.stringify(icon));
await link.screenshot({ path: "/tmp/scene-icon.png" });
await browser.close();
if (icon.name !== "celebration" || icon.width > 40) process.exit(1);
