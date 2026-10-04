import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const db =
  "/Users/subhangipaul/Downloads/Project-X/app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/6cccf8a996931280468ee5bc4d599ec4ce088f368a424d8f0d17ac095a387807.sqlite";
const token = randomBytes(24).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");
const now = Date.now();
const exp = now + 7 * 24 * 60 * 60 * 1000;
execFileSync("sqlite3", [
  db,
  `INSERT OR REPLACE INTO auth_sessions (token_hash, user_id, device_id, device_label, expires_at, created_at)
   VALUES ('${hash}', 'u_invite_guest', 'dev-guest-ui', 'test', ${exp}, ${now});`,
]);

const me = await fetch("http://127.0.0.1:8788/api/auth/me", {
  headers: { cookie: `bf_session=${token}` },
}).then((res) => res.json());
console.log(
  "ME",
  me.user?.email,
  (me.memberships || []).map((row) => `${row.eventName}:${row.role}`),
);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  serviceWorkers: "block",
});
await context.addCookies([
  {
    name: "bf_session",
    value: token,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  },
]);
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
  for (const key of [
    "biyeflow.syncCode",
    "biyeflow_sync_code",
    "biyeflow_wedding_code",
    "biyeflow.accessSession",
  ]) {
    localStorage.removeItem(key);
  }
});

await page.goto("http://127.0.0.1:8788/dashboard", { waitUntil: "networkidle" });
await page.getByText("Hi, Mira").waitFor({ timeout: 20000 });
const cards = await page.locator("[data-event-code]").evaluateAll((nodes) =>
  nodes.map((node) => node.innerText.replace(/\s+/g, " ").trim()),
);
console.log("CARDS", cards);

async function openCard(place) {
  const card = page.locator("[data-event-code]").filter({ hasText: place }).first();
  await card.locator('button[aria-label^="Open"]').evaluate((el) => el.click());
  await page.waitForURL(/\/(buzz|buddies|command-center)/, { timeout: 25000 });
  await page.waitForTimeout(1000);
}

await openCard("Guest");
console.log("GUEST_URL", page.url());
console.log(
  "GUEST_TEXT",
  (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600),
);
await page.screenshot({ path: ".compare/invite-guest-buzz.png" });

await page.evaluate(() => {
  try {
    localStorage.removeItem("biyeflow.accessSession");
  } catch {
    /* ignore */
  }
});
await page.goto("http://127.0.0.1:8788/dashboard", { waitUntil: "networkidle" });
await page.getByText("Buddy", { exact: true }).waitFor({ timeout: 15000 });
await openCard("Buddy");
console.log("BUDDY_URL", page.url());
console.log(
  "BUDDY_TEXT",
  (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 800),
);
await page.screenshot({ path: ".compare/invite-buddy-tasks.png" });

const buzzNav = page.locator('a[href="/buzz"], a[href*="buzz"]').first();
if (await buzzNav.count()) {
  await buzzNav.evaluate((el) => el.click());
  await page.waitForURL(/\/buzz/, { timeout: 10000 });
  await page.waitForTimeout(700);
  console.log(
    "BUDDY_BUZZ",
    (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 500),
  );
  await page.screenshot({ path: ".compare/invite-buddy-buzz.png" });
}

await browser.close();
