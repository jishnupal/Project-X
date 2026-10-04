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
  guests: [],
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
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1, state }) });
  }
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1 }) });
});
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
const card = page.getByRole("button", { name: "The Plot" });
await card.waitFor({ timeout: 15000 });
const fit = await card.evaluate((el) => {
  const word = el.querySelector(".home-entry__word");
  const wordBox = word.getBoundingClientRect();
  const cardBox = el.getBoundingClientRect();
  return {
    text: word.textContent,
    wraps: wordBox.height > 40,
    inside: wordBox.right <= cardBox.right + 1 && wordBox.bottom <= cardBox.bottom + 1,
    wordBox: { w: Math.round(wordBox.width), h: Math.round(wordBox.height) },
    cardBox: { w: Math.round(cardBox.width), h: Math.round(cardBox.height) },
  };
});
console.log("card", JSON.stringify(fit));
await card.evaluate((el) => el.click());
await page.getByRole("heading", { name: "The Plot" }).waitFor({ timeout: 8000 });
const sheet = await page.evaluate(() => document.body.innerText.includes("Bengali wedding"));
console.log("sheet", sheet);
await browser.close();
if (fit.text !== "The Plot" || !fit.inside) process.exit(1);
