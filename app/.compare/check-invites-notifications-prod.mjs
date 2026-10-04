import { chromium, devices } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://biyeflow.pages.dev";
const CODE = "AAAA1111";

const guest = {
  id: "g-invite-1",
  name: "Prod Invite Person",
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
if (!jsPath) throw new Error("No index JS");
const js = await fetch(`${BASE}/${jsPath}`, { cache: "no-store" }).then((r) => r.text());
const markers = {
  tracker: js.includes("tracker-send-invite"),
  notif: js.includes("/notifications"),
  wa: js.includes("Send on WhatsApp"),
  choose: js.includes("Choose an event"),
  phoneOn: js.includes("Turn on phone banners") || js.includes("Phone banners on"),
  noContact: !js.includes("contact-send-invite"),
  noOldTest: !js.includes("Send test banner") && !js.includes("Send a test to this phone"),
  unreadCopy: js.includes("unread"),
};
const bundleOk = Object.values(markers).every(Boolean);
console.log("BUNDLE", { jsPath, ...markers, len: js.length });
if (!bundleOk) {
  console.error("FAIL bundle markers");
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
        {
          id: "m2",
          eventId: "e2",
          eventCode: "BBBB2222",
          eventName: "Second Event",
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
  version: 4,
  state: {
    event: { name: "Bengali wedding", guests: 1 },
    guests: [guest],
    guestGroups: [],
    functions: [{ id: 1, name: "Reception" }],
    menu: [],
    activity: [
      {
        id: "act1",
        type: "invite.claimed",
        title: "Prod Invite Person joined",
        body: "Invite accepted",
        href: "/command-center?invites=1",
        audience: "host",
        createdAt: Date.now() - 60_000,
      },
      {
        id: "act2",
        type: "task.assigned",
        title: "New task for you",
        body: "Bring flowers",
        href: "/buddies",
        audience: "buddy",
        createdAt: Date.now() - 30_000,
      },
    ],
    modules: { stay: false, menu: false, asked: true },
  },
};

for (const path of [`**/api/wedding/${CODE}`, `**/api/event/${CODE}`]) {
  await page.route(path, async (route) => {
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
}
await page.route(`**/api/wedding/${CODE}/access`, (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);
await page.route(`**/api/event/${CODE}/access`, (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
);

let invitePosted = false;
await page.route("**/api/invites/contact", async (route) => {
  invitePosted = true;
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      token: "tok123",
      claimCode: "ZX9K2M",
      name: guest.name,
      role: "guest",
      url: `${BASE}/invite/guest/tok123`,
      claimUrl: `${BASE}/claim/ZX9K2M`,
      whatsappText: `You're invited.\nOpen: ${BASE}/claim/ZX9K2M`,
    }),
  });
});

// --- Contacts: no Send invite CTA ---
await page.goto(`${BASE}/people/contacts`, { waitUntil: "domcontentloaded" });
await page.getByText("Prod Invite Person").first().waitFor({ timeout: 25000 });
await page.getByText("Prod Invite Person").first().click();
await page.getByText("Invitation sent").waitFor({ timeout: 10000 });
const contactSend = await page.getByTestId("contact-send-invite").count();
const invitesHint = await page.getByText(/Send WhatsApp invites from Home/i).count();
console.log("CONTACTS", { contactSend, invitesHint });
await page.screenshot({ path: ".compare/prod-contacts-no-send.png" });
if (contactSend !== 0 || invitesHint < 1) {
  console.error("FAIL contacts still has send or missing hint");
  process.exit(1);
}
await page.keyboard.press("Escape").catch(() => undefined);

// --- Home Invitations tracker Send ---
await page.goto(`${BASE}/command-center`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Invitations/i }).first().waitFor({ timeout: 25000 });
await page.getByRole("button", { name: /Invitations/i }).first().click();
await page.getByText("Invite Tracker").waitFor({ timeout: 15000 });
await page.getByTestId("tracker-send-invite").first().click();
await page.getByTestId("contact-send-whatsapp").waitFor({ timeout: 10000 });
await page.getByText("Claim code ZX9K2M").waitFor();
await page.screenshot({ path: ".compare/prod-invite-tracker-send.png" });
console.log("INVITE_TRACKER", { invitePosted });
if (!invitePosted) {
  console.error("FAIL invite API not posted from tracker");
  process.exit(1);
}
await page.getByRole("button", { name: /back|close/i }).first().click().catch(() => undefined);

// --- Notifications full page (no overlay scrim over shell) ---
await page.goto(`${BASE}/command-center`, { waitUntil: "domcontentloaded" });
const bell = page.getByTestId("header-notifications").locator("visible=true").first();
await bell.waitFor({ timeout: 20000 });
await bell.click({ force: true });
await page.waitForURL("**/notifications", { timeout: 15000 });
await page.getByRole("heading", { name: "Notifications" }).waitFor();
await page.getByText("Prod Invite Person joined").waitFor({ timeout: 15000 });
const scrim = await page.locator(".fixed.inset-0.z-\\[90\\]").count();
const inboxFirst = await page.getByText("Prod Invite Person joined").count();
const oldTestHero = await page.getByRole("button", { name: "Send test banner" }).count();
const quietBanner =
  (await page.getByText("Phone banners on").count()) +
  (await page.getByText("Phone banners off").count()) +
  (await page.getByText("Finish phone banners").count()) +
  (await page.getByText("Phone banners blocked").count());
await page.screenshot({ path: ".compare/prod-notifications-page.png" });
console.log("NOTIFICATIONS", { url: page.url(), scrim, inboxFirst, oldTestHero, quietBanner });
if (!page.url().includes("/notifications") || inboxFirst < 1 || oldTestHero > 0) {
  console.error("FAIL notifications page still shows old test-banner hero");
  process.exit(1);
}

// Deep-link: invite.claimed → command-center?invites=1
await page.getByText("Prod Invite Person joined").click();
await page.waitForURL(/command-center/, { timeout: 15000 });
await page.waitForTimeout(800);
const trackerOpen = await page.getByText("Invite Tracker").count();
console.log("DEEP_LINK_INVITE", { url: page.url(), trackerOpen });
await page.screenshot({ path: ".compare/prod-notif-deeplink-invite.png" });

await browser.close();
console.log("PASS invites + notifications on", BASE);
