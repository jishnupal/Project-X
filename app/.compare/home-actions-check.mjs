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
    {
      id: "g1",
      name: "Anita",
      count: "2",
      invitationSent: false,
      inviteStatus: "Pending",
      needsStay: true,
      stayCount: "2",
      receptionCount: "2",
      sangeetCount: "0",
      biyebariCount: "0",
      borjatriCount: "0",
    },
  ],
  tasks: [{ id: "t1", title: "Call the hall", guestId: "g1", done: false, createdAt: 1, updatedAt: 1 }],
  buzz: { welcomeTitle: "Welcome", welcomeMessage: "Come", venueName: "Hall" },
  rooms: [],
  menu: [],
  functions: [{ id: 1, name: "Reception", date: "2026-12-01" }],
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
await page.route("**/api/wedding/AAAA1111**", (route) => {
  if (route.request().method() === "GET") {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1, state }) });
  }
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
});
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.getByRole("link", { name: /Contacts/ }).waitFor({ timeout: 15000 });
const layout = await page.evaluate(() => {
  const row = [...document.querySelectorAll(".home-modules .home-module")].map((card) => card.getAttribute("aria-label"));
  const below = [...document.querySelectorAll(".home-module-below .home-module")].map((card) => card.getAttribute("aria-label"));
  const buddies = [...document.querySelectorAll("[data-testid=mobile-bottom-nav] a")].find((link) => link.textContent?.includes("Buddies"));
  const badge = buddies?.querySelector("span.absolute")?.textContent || "";
  return {
    row,
    below,
    still: document.body.innerText.includes("Still to do"),
    buzzCard: row.some((label) => label?.startsWith("Buzz")),
    buddiesCard: row.some((label) => label?.startsWith("Buddies")),
    buddiesBadge: badge,
    contactsInRow: Boolean(document.querySelector(".home-modules .home-module") && [...document.querySelectorAll(".home-modules .home-module")].some((card) => card.getAttribute("aria-label")?.startsWith("Contacts"))),
  };
});
console.log(JSON.stringify(layout, null, 2));
const contacts = page.locator(".home-module-below").getByRole("link", { name: /Contacts/ });
const box = await contacts.boundingBox();
const rowBox = await page.locator(".home-modules").boundingBox();
console.log("contactsBelow", box && rowBox ? box.y > rowBox.y + rowBox.height - 40 : false);
await contacts.evaluate((el) => el.click());
await page.waitForURL("**/people/contacts");
console.log("contactsUrl", page.url());
await browser.close();
if (layout.row.length !== 3 || !layout.row[0]?.startsWith("Invitations") || !layout.row[1]?.startsWith("Stay") || !layout.row[2]?.startsWith("Menu")) process.exit(1);
if (!layout.below[0]?.startsWith("Contacts") || layout.contactsInRow || layout.still || layout.buzzCard || layout.buddiesCard) process.exit(1);
if (layout.buddiesBadge !== "1") process.exit(1);
if (!page.url().includes("/people/contacts")) process.exit(1);
