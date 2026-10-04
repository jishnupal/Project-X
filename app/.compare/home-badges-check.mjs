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
const state = {
  event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "2", scheduleConfirmed: true },
  guests: [
    { id: "g1", name: "Anita", count: "2", invitationSent: false, inviteStatus: "Pending", needsStay: true, stayCount: "2" },
    { id: "g2", name: "Roni", count: "1", invitationSent: false, inviteStatus: "Pending", needsStay: false, stayCount: "0" },
  ],
  tasks: [{ id: "t1", title: "Call the hall", guestId: "g1", done: false, createdAt: 1, updatedAt: 1 }],
  buzz: { welcomeTitle: "", welcomeMessage: "Come", venueName: "Hall" },
  rooms: [],
};
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
await page.route("**/api/wedding/AAAA1111", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ version: 1, state }),
  }),
);
await page.route("**/api/wedding/AAAA1111/access", (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Invitations/ }).waitFor({ timeout: 15000 });
const badges = await page.evaluate(() =>
  [...document.querySelectorAll(".home-module")].map((card) => ({
    label: card.getAttribute("aria-label"),
    badge: card.querySelector(".home-module__badge")?.textContent || "",
    box: card.querySelector(".home-module__badge")?.getBoundingClientRect().toJSON(),
  })),
);
console.log(JSON.stringify(badges, null, 2));
await page.screenshot({ path: "/tmp/home-badges.png" });
await browser.close();
const invitations = badges.find((card) => card.label?.startsWith("Invitations"));
const stay = badges.find((card) => card.label?.startsWith("Stay"));
const buzz = badges.find((card) => card.label?.startsWith("Buzz"));
const buddies = badges.find((card) => card.label?.startsWith("Buddies"));
if (invitations?.badge !== "2" || stay?.badge !== "1" || buzz?.badge !== "1" || buddies?.badge !== "1") {
  process.exit(1);
}
