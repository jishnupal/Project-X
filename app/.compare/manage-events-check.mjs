import { chromium, devices } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["iPhone 14 Pro"],
  serviceWorkers: "block",
});
await context.addInitScript(() => {
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
  const reload = Location.prototype.reload;
  Location.prototype.reload = function () {
    console.log("RELOAD", new Error().stack);
    return reload.call(this);
  };
  const assign = Location.prototype.assign;
  Location.prototype.assign = function (url) {
    console.log("ASSIGN", String(url), new Error().stack);
    return assign.call(this, url);
  };
  const href = Object.getOwnPropertyDescriptor(Location.prototype, "href");
  Object.defineProperty(Location.prototype, "href", {
    configurable: true,
    get() {
      return href.get.call(this);
    },
    set(value) {
      console.log("HREF", String(value), new Error().stack);
      href.set.call(this, value);
    },
  });
  document.addEventListener(
    "click",
    (event) => {
      const path = event
        .composedPath()
        .slice(0, 8)
        .map((node) => {
          if (!(node instanceof Element)) return node.nodeName;
          const label = node.getAttribute("data-testid") || node.getAttribute("href") || node.getAttribute("aria-label") || (node.textContent || "").trim().slice(0, 24);
          return `${node.tagName}.${label}`;
        });
      console.log("CLICK", path.join(" > "));
    },
    true,
  );
  window.addEventListener("beforeunload", () => console.log("UNLOAD", location.href));
  localStorage.setItem("bf.sv", "v19");
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
  const method = route.request().method();
  const body =
    method === "GET"
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

page.on("framenavigated", (frame) => {
  if (frame === page.mainFrame()) console.log("NAV", frame.url());
});
page.on("pageerror", (error) => console.log("PAGE", error.message));
page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error" || /^(UNLOAD|CLICK|RELOAD|ASSIGN)/.test(text)) console.log("CONSOLE", text);
});
page.on("request", (request) => {
  if (request.isNavigationRequest()) console.log("REQ", request.url());
});
page.on("response", (response) => {
  const url = response.url();
  if (url.includes("/api/")) console.log("API", response.status(), response.request().method(), url);
});
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.getByRole("link", { name: "BiyeFlow home" }).first().waitFor({ timeout: 15000 });
const brand = page.locator('a[aria-label="BiyeFlow home"]:visible');
const box = await brand.boundingBox();
console.log("BRAND", (await brand.innerText()).replace(/\s+/g, " "), box);
console.log("OLD_EVENTS_BUTTON", await page.getByTestId("events-back").count());
await page.locator('button[aria-label="Account"]:visible').click();
const yours = page.locator('[data-testid="your-events"]:visible');
const manage = page.locator('[data-testid="manage-events"]:visible');
console.log("MENU", (await yours.innerText()).trim(), "|", (await manage.innerText()).trim());
const hit = await page.evaluate(async () => {
  const node = document.querySelector('[data-testid="manage-events"]');
  if (!(node instanceof HTMLElement)) return { hit: "missing" };
  const rect = node.getBoundingClientRect();
  const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + 8);
  let fired = false;
  node.addEventListener("click", () => {
    fired = true;
  });
  const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const clickNamed = (label) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
    button?.click();
  };
  node.click();
  await frames();
  const name = document.querySelector("#manage-event-name")?.value || "";
  clickNamed("Delete event");
  await frames();
  const step1 = document.body.innerText.includes("Delete this event?");
  clickNamed("Continue");
  await frames();
  const step2 = document.body.innerText.includes("Remove it for a day?");
  return {
    fired,
    flag: window.__manage || "",
    name,
    step1,
    step2,
    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    hit: top ? `${top.tagName}.${top.getAttribute("data-testid") || top.getAttribute("aria-label") || ""}` : "none",
    dialogs: document.querySelectorAll('[role="dialog"]').length,
  };
});
console.log("HIT", JSON.stringify(hit));
if (!hit.name || !hit.step1 || !hit.step2) throw new Error("manage events flow did not finish");
await page.screenshot({ path: "/tmp/manage-events.png" });
await browser.close();
