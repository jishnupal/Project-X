import { chromium, devices } from "playwright";

const state = {
  event: { name: "Bengali wedding", city: "", startDate: "2026-12-01", guests: "1", scheduleConfirmed: true },
  functions: [
    { id: 1, name: "Sangeet", date: "2026-12-01" },
    { id: 2, name: "Marriage", date: "2026-12-02" },
    { id: 3, name: "Reception", date: "2026-12-03" },
  ],
  guests: [
    {
      id: "g1",
      name: "Banerjee family",
      count: "4",
      sangeetCount: "4",
      biyebariCount: "2",
      receptionCount: "4",
      borjatriCount: "0",
      stayCount: "0",
      needsStay: false,
      invitationSent: false,
      groupId: "",
    },
  ],
  guestGroups: [{ id: "gg1", name: "Family", updatedAt: 1 }],
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
      memberships: [
        {
          id: "m1",
          eventId: "e1",
          eventCode: "AAAA1111",
          eventName: "Bengali wedding",
          eventType: "wedding",
          role: "admin",
          moduleGrants: {},
          status: "active",
          empty: false,
        },
      ],
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

await page.goto("http://127.0.0.1:8788/people/guests", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Open full guest list" }).waitFor({ timeout: 15000 });
const sceneText = await page.locator("body").innerText();
const addGuest = await page.getByRole("button", { name: /add guest/i }).count();
const groups = await page.getByRole("region", { name: "Groups" }).count();
console.log("SCENE_ADD", addGuest, "SCENE_GROUPS", groups, "HAS_GROUPS_WORD", /Groups/.test(sceneText));

await page.getByRole("button", { name: "Open full guest list" }).evaluate((el) => el.click());
await page.getByRole("button", { name: /Banerjee family/ }).waitFor();
await page.getByRole("button", { name: /Banerjee family/ }).evaluate((el) => el.click());
const dialog = page.getByRole("dialog", { name: "Banerjee family" });
await dialog.getByText("Which days").first().waitFor();
const days = ["Sangeet", "Marriage", "Reception"];
for (const day of days) {
  const row = dialog.locator("li", { hasText: day });
  const box = await row.boundingBox();
  const sheet = await dialog.boundingBox();
  console.log(day, "row", box && Math.round(box.width), "sheet", sheet && Math.round(sheet.width), "overflow", box && sheet ? box.x + box.width > sheet.x + sheet.width + 2 : "missing");
}
await dialog.getByRole("button", { name: "Fewer Sangeet" }).click();
await dialog.getByRole("button", { name: "Fewer Sangeet" }).click();
await dialog.getByRole("button", { name: "Fewer Sangeet" }).click();
await dialog.getByRole("button", { name: "Fewer Sangeet" }).click();
console.log("SANGEET_OFF", await dialog.getByRole("button", { name: "Coming" }).count());
await page.screenshot({ path: "/tmp/scene-guest-days.png" });

await page.goto("http://127.0.0.1:8788/people/contacts", { waitUntil: "domcontentloaded" });
const addPerson = page.getByRole("button", { name: "Add a person" }).first();
await addPerson.waitFor({ timeout: 15000 });
await addPerson.evaluate((el) => el.click());
const add = page.getByRole("dialog", { name: "New person" });
await add.getByText("Which days").first().waitFor();
await add.getByLabel("Name").fill("Roy family");
await add.getByRole("button", { name: "More people" }).click();
await add.getByRole("button", { name: "More people" }).click();
for (let i = 0; i < 4; i += 1) {
  const fewer = add.getByRole("button", { name: "Fewer Reception" });
  if (!(await fewer.count())) break;
  if (await fewer.isDisabled()) break;
  await fewer.click();
}
console.log("ADD_RECEPTION_OFF", await add.getByText("Not this day").count());
const addSheet = await add.boundingBox();
const lastDay = add.locator("li").last();
const lastBox = await lastDay.boundingBox();
console.log("ADD_SHEET", addSheet && Math.round(addSheet.height), "LAST_DAY_INSIDE", lastBox && addSheet ? lastBox.y + lastBox.height <= addSheet.y + addSheet.height + 8 : false);
await page.screenshot({ path: "/tmp/contacts-add-days.png" });
await add.getByRole("button", { name: "Add", exact: true }).click();
await page.getByRole("button", { name: /Roy family/ }).waitFor();
await page.getByRole("button", { name: /Roy family/ }).evaluate((el) => el.click());
const edit = page.getByRole("dialog", { name: "Contact" });
await edit.getByText("Which days").first().waitFor();
console.log("EDIT_NOT_RECEPTION", await edit.getByText("Not this day").count());
console.log("EDIT_SANGEET", await edit.locator("li", { hasText: "Sangeet" }).innerText());
await browser.close();
