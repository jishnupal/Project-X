import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".compare");
mkdirSync(out, { recursive: true });

const BASE = process.env.COMPARE_BASE || "http://127.0.0.1:5173";
const VIEWPORT = { width: 393, height: 748, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function injectSession(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("biyeflow.syncActive", "1");
    localStorage.setItem("biyeflow.accountCode", "COMPARE1");
    localStorage.setItem("biyeflow.syncCode", "COMPARE1");
    localStorage.setItem(
      "biyeflow.accessSession",
      JSON.stringify({
        weddingCode: "COMPARE1",
        profileId: "admin-local",
        role: "admin",
        moduleGrants: {},
        adminToken: "local",
        deviceId: "local-device",
      }),
    );
  });
}

async function stripBanners(page) {
  await page.evaluate(() => {
    document.querySelectorAll("[role='status']").forEach((el) => el.remove());
  });
}

async function shotMoodboard(page) {
  await page.goto(`${BASE}/moodboards/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const screen = page.locator("#app");
  await screen.screenshot({ path: join(out, "mood-home.png") });
  await page.evaluate(() => {
    const rail = document.querySelector(".live-rail");
    if (rail) rail.scrollLeft = 280;
  });
  await page.waitForTimeout(400);
  await screen.screenshot({ path: join(out, "mood-home-stay.png") });
  await page.evaluate(() => {
    const rail = document.querySelector(".live-rail");
    if (rail) rail.scrollLeft = 0;
    const scroller = document.querySelector(".panel.active .scroll");
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await page.waitForTimeout(400);
  await screen.screenshot({ path: join(out, "mood-home-setup.png") });
  await page.locator('[data-nav="people"]').last().click();
  await page.waitForTimeout(700);
  await screen.screenshot({ path: join(out, "mood-people.png") });
  await page.locator("#goMenuPortal").click();
  await page.waitForTimeout(600);
  await screen.screenshot({ path: join(out, "mood-menu.png") });
  await page.locator('[data-nav="buzz"]').last().click();
  await page.waitForTimeout(500);
  await screen.screenshot({ path: join(out, "mood-buzz.png") });
  await page.locator('[data-nav="buddies"]').last().click();
  await page.waitForTimeout(500);
  await screen.screenshot({ path: join(out, "mood-buddies.png") });
  await page.locator('[data-nav="profile"]').last().click();
  await page.waitForTimeout(500);
  await screen.screenshot({ path: join(out, "mood-profile.png") });
}

async function shotApp(page) {
  await injectSession(page);
  await page.goto(`${BASE}/command-center`, { waitUntil: "networkidle" });
  await stripBanners(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(out, "app-home.png") });
  await page.goto(`${BASE}/people/guests`, { waitUntil: "networkidle" });
  await stripBanners(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(out, "app-people.png") });
  for (const [path, name] of [
    ["/people/menu", "app-menu.png"],
    ["/buzz", "app-buzz.png"],
    ["/buddies", "app-buddies.png"],
    ["/profile", "app-profile.png"],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await stripBanners(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, name) });
  }
}

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: VIEWPORT.width, height: VIEWPORT.height },
  deviceScaleFactor: VIEWPORT.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
});
const page = await context.newPage();
await shotMoodboard(page);
await shotApp(page);
await browser.close();
console.log(`Chrome toolbar ${VIEWPORT.width}x${VIEWPORT.height} → ${out}`);
