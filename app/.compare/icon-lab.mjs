import { chromium, devices } from "playwright";

const names = [
  "binoculars",
  "preview",
  "pageview",
  "visibility",
  "grid_view",
  "frame_inspect",
  "person_search",
  "search",
  "view_comfy",
  "space_dashboard",
  "travel_explore",
  "explore",
  "monitoring",
  "query_stats",
  "light_mode",
  "center_focus_strong",
  "document_scanner",
  "find_in_page",
  "manage_search",
  "plagiarism",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ ...devices["iPhone 14 Pro"] });
await page.goto("http://127.0.0.1:8788/command-center", { waitUntil: "domcontentloaded" });
await page.evaluate((icons) => {
  const row = document.createElement("div");
  row.id = "icon-lab";
  row.style.cssText = "position:fixed;inset:0;z-index:9999;background:#fff8f5;overflow:auto;padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px";
  for (const name of icons) {
    const cell = document.createElement("div");
    cell.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px";
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.style.fontSize = "40px";
    icon.textContent = name;
    const label = document.createElement("span");
    label.style.cssText = "font:11px sans-serif;color:#333";
    label.textContent = name;
    cell.append(icon, label);
    row.append(cell);
  }
  document.body.append(row);
}, names);
await page.locator("#icon-lab").screenshot({ path: "/tmp/icon-lab.png" });
await browser.close();
