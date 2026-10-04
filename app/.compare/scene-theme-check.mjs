import { chromium, devices } from "playwright";

const state = {
  event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "4", scheduleConfirmed: true },
  functions: [
    { id: 1, name: "Sangeet", date: "2026-12-01" },
    { id: 2, name: "Marriage", date: "2026-12-02" },
    { id: 3, name: "Reception", date: "2026-12-03" },
  ],
  guests: [
    { id: "g1", name: "Banerjee family", count: "4", sangeetCount: "4", biyebariCount: "2", receptionCount: "4", borjatriCount: "0", stayCount: "0", needsStay: false, invitationSent: false, groupId: "" },
  ],
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
  localStorage.setItem("biyeflow.accessSession", JSON.stringify({ weddingCode: "AAAA1111", profileId: "p1", role: "admin", moduleGrants: {}, adminToken: "t", deviceId: "d1" }));
});
const page = await context.newPage();
await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "u1", email: "a@b.com", name: "Jishnu", avatarUrl: null, platformRole: "customer", hasPasscode: false }, memberships: [{ id: "m1", eventId: "e1", eventCode: "AAAA1111", eventName: "Bengali wedding", eventType: "wedding", role: "admin", moduleGrants: {}, status: "active", empty: false }], removed: [] }) }));
await page.route("**/api/wedding/AAAA1111**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1, state }) }));
await page.goto("http://127.0.0.1:8788/people/guests", { waitUntil: "domcontentloaded" });
const people = page.getByRole("button", { name: "People" });
await people.waitFor({ timeout: 15000 });
const colors = await page.evaluate(() => {
  const shell = document.querySelector(".app-shell");
  const peopleBtn = document.querySelector(".home-entry--dates");
  const guestsBtn = document.querySelector(".home-entry--details");
  const active = document.querySelector(".people-event-rail button[aria-pressed='true']");
  const bg = (el) => el ? getComputedStyle(el).backgroundColor : "";
  return {
    shell: shell && shell.className.includes("home-ivory"),
    warm: shell && shell.className.includes("people-bg-warm"),
    people: bg(peopleBtn),
    guests: bg(guestsBtn),
    day: bg(active),
    text: document.querySelector(".people-stage-touch")?.innerText.replace(/\s+/g, " ").slice(0, 180),
  };
});
console.log(JSON.stringify(colors, null, 2));
await page.screenshot({ path: "/tmp/scene-home.png", fullPage: false });
await people.click();
await page.getByRole("dialog").waitFor({ timeout: 8000 });
console.log("INVITES", await page.getByRole("dialog").innerText().then((t) => t.slice(0, 80)));
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Open full guest list" }).evaluate((el) => el.click());
await page.getByRole("dialog", { name: "Guest list" }).waitFor({ timeout: 8000 });
console.log("LIST_OPEN");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Go to Menu" }).evaluate((el) => el.click());
await page.waitForURL(/\/people\/menu/, { timeout: 8000 });
console.log("MENU", page.url());
await page.goBack();
await page.getByRole("button", { name: "Go to Rooms" }).waitFor({ timeout: 8000 });
await page.getByRole("button", { name: "Go to Rooms" }).evaluate((el) => el.click());
await page.waitForURL(/\/people\/rooms/, { timeout: 8000 });
console.log("ROOMS", page.url());
await browser.close();
if (!colors.shell || colors.warm) process.exit(1);
if (colors.people !== "rgb(254, 202, 67)") process.exit(1);
if (colors.guests !== "rgb(130, 177, 219)") process.exit(1);
if (colors.day !== "rgb(254, 202, 67)") process.exit(1);
