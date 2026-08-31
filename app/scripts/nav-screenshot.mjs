import { chromium, devices } from "playwright";

const iPhone = devices["iPhone 15 Pro"];
const URL = process.argv[2] || "https://biyeflow.pages.dev";

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...iPhone, colorScheme: "light" });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Navigate to a logged-in-like page (people tab) to see the bottom nav
// Since we can't log in, let's grab the bottom nav from the landing page
// Actually, the bottom nav only shows on logged-in pages. Let's just screenshot the landing
await page.screenshot({ path: "screenshots/nav-landing.png", fullPage: false });

// Check if bottom nav exists
const hasNav = await page.evaluate(() => {
  const nav = document.querySelector('[data-testid="mobile-bottom-nav"]');
  return nav !== null;
});
console.log("Bottom nav visible:", hasNav);

if (hasNav) {
  const navBox = await page.locator('[data-testid="mobile-bottom-nav"]').boundingBox();
  console.log("Nav bounding box:", navBox);
  
  // Screenshot just the nav area
  await page.locator('[data-testid="mobile-bottom-nav"]').screenshot({
    path: "screenshots/nav-closeup.png",
  });
  console.log("✓ nav-closeup.png");
}

await browser.close();
console.log("Done!");
