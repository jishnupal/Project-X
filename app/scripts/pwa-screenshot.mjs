import { chromium, devices } from "playwright";

const iPhone = devices["iPhone 15 Pro"];
const URL = process.argv[2] || "https://biyeflow.pages.dev";

console.log(`Testing: ${URL}\n`);
const browser = await chromium.launch();

// --- 1. Browser mode ---
const browserCtx = await browser.newContext({ ...iPhone, colorScheme: "light" });
const browserPage = await browserCtx.newPage();
await browserPage.goto(URL, { waitUntil: "networkidle" });
await browserPage.waitForTimeout(2000);
await browserPage.screenshot({ path: "screenshots/browser-mode.png", fullPage: false });
console.log("✓ browser-mode.png");

// --- 2. PWA standalone mode ---
const pwaCtx = await browser.newContext({ ...iPhone, colorScheme: "light" });
const pwaPage = await pwaCtx.newPage();
await pwaPage.addInitScript(() => {
  const original = window.matchMedia;
  window.matchMedia = function (query) {
    if (query === "(display-mode: standalone)") {
      return { matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} };
    }
    if (query === "(display-mode: fullscreen)") {
      return { matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} };
    }
    return original.call(window, query);
  };
  Object.defineProperty(navigator, "standalone", { value: true, writable: false });
});

await pwaPage.goto(URL, { waitUntil: "networkidle" });
await pwaPage.waitForTimeout(2000);

const debugInfo = await pwaPage.evaluate(() => {
  const style = getComputedStyle(document.documentElement);
  const vpMeta = document.querySelector('meta[name="viewport"]');
  const contentDiv = document.querySelector('[class*="pt-"]');
  return {
    "--safe-top": style.getPropertyValue("--safe-top").trim(),
    "--safe-bottom": style.getPropertyValue("--safe-bottom").trim(),
    "viewport-meta": vpMeta?.getAttribute("content"),
    "content-padding-top": contentDiv ? getComputedStyle(contentDiv).paddingTop : "N/A",
    "innerHeight": window.innerHeight,
  };
});
console.log("\nPWA standalone debug:", JSON.stringify(debugInfo, null, 2));

await pwaPage.screenshot({ path: "screenshots/pwa-standalone.png", fullPage: false });
console.log("✓ pwa-standalone.png");

await browser.close();
console.log("\nDone!");
