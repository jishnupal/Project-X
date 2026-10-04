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
      user: {
        id: "u1",
        email: "jishnu@example.com",
        name: "Jishnu Roni",
        avatarUrl: null,
        platformRole: "customer",
        hasPasscode: false,
      },
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
          empty: true,
        },
      ],
      removed: [],
    }),
  }),
);
await page.route("**/api/wedding/AAAA1111", (route) => {
  const body =
    route.request().method() === "GET"
      ? { version: 1, state: { event: { name: "Bengali wedding" } } }
      : { version: 1 };
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
});
await page.route("**/api/wedding/AAAA1111/access", (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);

await page.goto("http://127.0.0.1:8788/profile", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Manage Events" }).waitFor({ timeout: 15000 });
const result = await page.evaluate(async () => {
  const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const clickNamed = (label) => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.trim() === label);
    button?.click();
  };
  const fold = [...document.querySelectorAll("button")].find((node) =>
    (node.textContent || "").replace(/\s+/g, "").startsWith("ManageEvents"),
  );
  fold?.click();
  await frames();
  const row = [...document.querySelectorAll("button")].find((node) => (node.textContent || "").includes("Bengali wedding"));
  row?.click();
  await frames();
  const name = document.querySelector("#profile-event-name")?.value || "";
  clickNamed("Delete event");
  await frames();
  const step1 = document.body.innerText.includes("Delete this event?");
  clickNamed("Continue");
  await frames();
  const step2 = document.body.innerText.includes("Remove it for a day?");
  return { name, step1, step2 };
});
console.log(JSON.stringify(result));
await page.screenshot({ path: "/tmp/profile-manage.png" });
await browser.close();
if (!result.name || !result.step1 || !result.step2) process.exit(1);
