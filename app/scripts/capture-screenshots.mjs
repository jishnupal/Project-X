import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../outputs");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5173/menu", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(outDir, "react-menu-1440.png"), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:5173/menu", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outDir, "react-menu-390.png"), fullPage: true });

await page.setViewportSize({ width: 1440, height: 900 });
const refPath =
  "file:///D:/OneDrive%20-%20Rhythm%20Innovations/Desktop/new%20113.html";
await page.goto(refPath, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(outDir, "ref-menu-1440.png"), fullPage: true });

await browser.close();
console.log("Saved screenshots to", outDir);
