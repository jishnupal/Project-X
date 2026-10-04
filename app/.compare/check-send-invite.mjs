import { chromium, devices } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://biyeflow.pages.dev";
const CODE = "AAAA1111";
const guest = {
  id: "g-invite-1",
  name: "Test Invite Person",
  count: "2",
  receptionCount: "2",
  sangeetCount: "0",
  biyebariCount: "0",
  borjatriCount: "0",
  stayCount: "0",
  needsStay: false,
  invitationSent: false,
  inviteStatus: "Pending",
  isBuddy: false,
  groupId: "",
};

const version = await fetch(`${BASE}/version.json`, { cache: "no-store" }).then((r) => r.json());
console.log("VERSION", version);

const html = await fetch(`${BASE}/`, { cache: "no-store" }).then((r) => r.text());
const jsPath = html.match(/assets\/index-[^"]+\.js/)?.[0];
if (!jsPath) throw new Error("No index JS in HTML");
const js = await fetch(`${BASE}/${jsPath}`, { cache: "no-store" }).then((r) => r.text());
const hasSend = js.includes("Send invite") && js.includes("Send on WhatsApp") && js.includes("contact-send-invite");
console.log("BUNDLE", { jsPath, hasSend, len: js.length });
if (!hasSend) {
  console.error("FAIL: production bundle missing Send invite UI");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["iPhone 14 Pro"],
  serviceWorkers: "block",
});
await context.addInitScript((code) => {
  localStorage.setItem("biyeflow.syncCode", code);
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
  localStorage.setItem(
    "biyeflow.accessSession",
    JSON.stringify({
      weddingCode: code,
      profileId: "p1",
      role: "admin",
      moduleGrants: {},
      adminToken: "t",
      deviceId: "d1",
    }),
  );
}, CODE);

const page = await context.newPage();

await page.route("**/api/auth/me", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      user: {
        id: "u1",
        email: "host@example.com",
        name: "Host Tester",
        avatarUrl: null,
        platformRole: "customer",
        hasPasscode: false,
      },
      memberships: [
        {
          id: "m1",
          eventId: "e1",
          eventCode: CODE,
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

const weddingBody = {
  version: 3,
  state: {
    event: { name: "Bengali wedding", guests: 1 },
    guests: [guest],
    guestGroups: [],
    functions: [{ id: 1, name: "Reception" }],
    menu: [],
  },
};

await page.route(`**/api/wedding/${CODE}`, async (route) => {
  if (route.request().method() === "GET") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(weddingBody),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ version: weddingBody.version + 1, ok: true }),
  });
});
await page.route(`**/api/event/${CODE}`, async (route) => {
  if (route.request().method() === "GET") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(weddingBody),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ version: weddingBody.version + 1, ok: true }),
  });
});
await page.route(`**/api/wedding/${CODE}/access`, (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);
await page.route(`**/api/event/${CODE}/access`, (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);

let invitePosted = false;
await page.route("**/api/invites/contact", async (route) => {
  invitePosted = true;
  const body = route.request().postDataJSON();
  console.log("INVITE_POST", body);
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      token: "tok123",
      claimCode: "AB12CD",
      name: guest.name,
      role: "guest",
      url: `${BASE}/invite/guest/tok123`,
      claimUrl: `${BASE}/claim/AB12CD`,
      whatsappText: `You're invited to Bengali wedding.\nOpen your invite: ${BASE}/claim/AB12CD\nOr enter code AB12CD in BiyeFlow.`,
    }),
  });
});

const opened = [];
page.on("popup", (popup) => {
  opened.push(popup.url());
});
await page.addInitScript(() => {
  window.open = (url) => {
    window.__waOpened = String(url || "");
    return null;
  };
});

await page.goto(`${BASE}/people/contacts`, { waitUntil: "domcontentloaded" });
await page.getByText("Test Invite Person").first().waitFor({ timeout: 25000 });
await page.getByText("Test Invite Person").first().click();
await page.getByTestId("contact-send-invite").waitFor({ timeout: 10000 });
await page.screenshot({ path: ".compare/send-invite-contact.png" });
await page.getByTestId("contact-send-invite").click();
await page.getByTestId("contact-send-whatsapp").waitFor({ timeout: 10000 });
await page.getByText("Customised message").waitFor();
await page.screenshot({ path: ".compare/send-invite-sheet.png" });
await page.getByTestId("contact-send-whatsapp").click();
await page.waitForTimeout(500);
const wa = await page.evaluate(() => window.__waOpened || "");
console.log("WHATSAPP_URL", wa);
console.log("INVITE_POSTED", invitePosted);

const ok =
  invitePosted &&
  wa.startsWith("https://wa.me/?text=") &&
  decodeURIComponent(wa).includes("AB12CD") &&
  decodeURIComponent(wa).includes("Bengali wedding");

await page.screenshot({ path: ".compare/send-invite-after-wa.png" });
await browser.close();

if (!ok) {
  console.error("FAIL", { invitePosted, wa });
  process.exit(1);
}
console.log("PASS send-invite WhatsApp flow on", BASE);
