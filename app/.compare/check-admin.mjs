import { chromium } from "playwright";

const users = [
  { id: "u_31febb26ad867c73", name: "Jishnu Pal", email: "jishnu.roni@gmail.com", createdAt: 1, events: [{ name: "Bachelorette", code: "6VMJLR5M", role: "admin", owner: true }, { name: "Wedding", code: "78B8WSEE", role: "admin", owner: true }] },
  { id: "u_5f504eb7435b9e68", name: "Subhangi Paul", email: "subhangipaul1410@gmail.com", createdAt: 2, events: [{ name: "BIYE", code: "KHHMTKRP", role: "admin", owner: true }] },
  { id: "u_7c56e91d084ed656", name: "Dibyajit Goswami", email: "dibyajitgoswamidg@gmail.com", createdAt: 3, events: [{ name: "Event", code: "M6BQ3CUL", role: "admin", owner: true }] },
  { id: "u_02deab26fc24a475", name: "Trisa Pal", email: "trisapal.04@gmail.com", createdAt: 4, events: [{ name: "Annoprason", code: "G8P6X2VM", role: "admin", owner: true }, { name: "Birthday", code: "AW6Q2B4X", role: "admin", owner: true }, { name: "Bachelor Party", code: "US4MLU8W", role: "admin", owner: true }, { name: "Wedding", code: "78B8WSEE", role: "admin", owner: false }] },
  { id: "u_dd31075caa3c7cf8", name: "SUBHADEEP KARAK", email: "subhadeepkarak14@gmail.com", createdAt: 5, events: [{ name: "Bengali wedding", code: "TU6WX5E3", role: "admin", owner: true }] },
  { id: "u_e608f71c78239937", name: "Tanmoy Bez", email: "tanmoy6996@gmail.com", createdAt: 6, events: [{ name: "Wedding", code: "78B8WSEE", role: "admin", owner: false }] },
];

const admin = {
  id: "u_31febb26ad867c73",
  email: "jishnu.roni@gmail.com",
  name: "Jishnu Pal",
  avatarUrl: null,
  platformRole: "platform_admin",
  hasPasscode: false,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
await page.addInitScript(() => {
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
});

const fulfillMe = (user) => (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ user, memberships: [], removed: [] }),
  });

await page.route("**/api/auth/me", fulfillMe(admin));
await page.route("**/api/admin/users", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: users.length, users }),
  }),
);
await page.route("**/api/wedding/**", (route) => route.fulfill({ status: 404, body: "{}" }));

await page.goto("http://127.0.0.1:5173/admin", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "6" }).waitFor();
const names = await page.locator("main li p").allInnerTexts();
console.log("ADMIN_PAGE", page.url(), names.join(" | "));

await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Account" }).evaluate((el) => el.click());
const menu = await page.getByRole("menu").innerText();
console.log("ADMIN_MENU", menu.replaceAll("\n", " / "));
await page.getByRole("menuitem", { name: "Customers" }).evaluate((el) => el.click());
await page.getByRole("heading", { name: "6" }).waitFor();
console.log("AFTER_CLICK", page.url());

await page.unroute("**/api/auth/me");
await page.route(
  "**/api/auth/me",
  fulfillMe({
    id: "u_5f504eb7435b9e68",
    email: "subhangipaul1410@gmail.com",
    name: "Subhangi Paul",
    avatarUrl: null,
    platformRole: "customer",
    hasPasscode: false,
  }),
);
await page.goto("http://127.0.0.1:5173/admin", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
console.log("CUSTOMER_REDIRECT", page.url());
await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Account" }).evaluate((el) => el.click());
const customerMenu = await page.getByRole("menu").innerText();
console.log("CUSTOMER_MENU", customerMenu.replaceAll("\n", " / "));

await browser.close();
