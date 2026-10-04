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
    { id: "g1", name: "Anita", count: "2", invitationSent: true, inviteStatus: "Sent", needsStay: false, stayCount: "0", receptionCount: "2", sangeetCount: "0", biyebariCount: "0", borjatriCount: "0" },
  ],
  tasks: [],
  buzz: { welcomeTitle: "Welcome", welcomeMessage: "Come", venueName: "Hall" },
  rooms: [],
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
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: 1, state }),
    });
  }
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
});
await page.route("**/api/wedding/AAAA1111/access", (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);

await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.getByRole("link", { name: /Contacts/ }).waitFor({ timeout: 15000 });
const home = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".home-module")].map((card) => card.getAttribute("aria-label"));
  const nav = [...document.querySelectorAll("[data-testid=mobile-bottom-nav] a")].map((link) => link.textContent?.replace(/\s+/g, " ").trim());
  return { cards, nav, findPerson: document.body.innerText.includes("Find a person") };
});
console.log("home", JSON.stringify(home));

await page.getByRole("link", { name: /Contacts,|Contacts$/ }).first().evaluate((el) => el.click());
await page.waitForURL("**/people/contacts");
const contacts = await page.evaluate(() => ({
  url: location.pathname,
  title: [...document.querySelectorAll("h1")].map((node) => node.textContent),
  scheduleCurrent: [...document.querySelectorAll("[data-testid=mobile-bottom-nav] a")].find((link) => link.textContent?.includes("Schedule"))?.getAttribute("aria-current"),
}));
console.log("contacts", JSON.stringify(contacts));

await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.getByRole("link", { name: "Schedule" }).evaluate((el) => el.click());
await page.waitForURL("**/people/guests");
const schedule = await page.evaluate(() => {
  const link = [...document.querySelectorAll("[data-testid=mobile-bottom-nav] a")].find((item) => item.textContent?.includes("Schedule"));
  return {
    url: location.pathname,
    current: link?.getAttribute("aria-current"),
    text: link?.textContent?.replace(/\s+/g, " ").trim(),
  };
});
console.log("schedule", JSON.stringify(schedule));

await browser.close();
if (!home.cards.some((label) => label?.startsWith("Contacts"))) process.exit(1);
if (home.cards.some((label) => label?.startsWith("Days"))) process.exit(1);
if (!home.nav.some((label) => label?.includes("Schedule"))) process.exit(1);
if (home.nav.some((label) => label?.includes("People"))) process.exit(1);
if (home.findPerson) process.exit(1);
if (contacts.url !== "/people/contacts" || !contacts.title.includes("Contacts")) process.exit(1);
if (contacts.scheduleCurrent === "page") process.exit(1);
if (schedule.url !== "/people/guests" || schedule.current !== "page") process.exit(1);
