import { chromium } from "playwright";

const memberships = [
  {
    id: "m1",
    eventId: "e1",
    eventCode: "78B8WSEE",
    eventName: "Wedding",
    eventType: "wedding",
    role: "admin",
    moduleGrants: {},
    status: "active",
    owner: true,
    empty: false,
  },
  {
    id: "m2",
    eventId: "e2",
    eventCode: "AW6Q2B4X",
    eventName: "Birthday",
    eventType: "wedding",
    role: "guest",
    moduleGrants: {},
    status: "active",
    owner: false,
    empty: false,
  },
  {
    id: "m3",
    eventId: "e3",
    eventCode: "US4MLU8W",
    eventName: "Party",
    eventType: "wedding",
    role: "buddy",
    moduleGrants: {},
    status: "active",
    owner: false,
    empty: false,
  },
  {
    id: "m4",
    eventId: "e4",
    eventCode: "KHHMTKRP",
    eventName: "BIYE",
    eventType: "wedding",
    role: "admin",
    moduleGrants: {},
    status: "active",
    owner: false,
    empty: false,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
await page.addInitScript(() => {
  localStorage.setItem("bf.sv", "v19");
  sessionStorage.setItem("biyeflow.local.sw-cleared", "1");
});
await page.route("**/api/auth/me", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      user: {
        id: "u1",
        email: "jishnu.roni@gmail.com",
        name: "Jishnu Pal",
        avatarUrl: null,
        platformRole: "platform_admin",
        hasPasscode: false,
      },
      memberships,
      removed: [],
    }),
  }),
);
await page.route("**/api/wedding/**", (route) => route.fulfill({ status: 404, body: "{}" }));
await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
await page.getByText("Host", { exact: true }).first().waitFor();
const labels = await page.locator("[data-event-code]").evaluateAll((nodes) =>
  nodes.map((node) => ({
    code: node.getAttribute("data-event-code"),
    text: node.innerText.replace(/\s+/g, " ").trim(),
  })),
);
console.log(JSON.stringify(labels, null, 2));
const rename = await page.getByRole("button", { name: /Rename/ }).count();
console.log("RENAME_BUTTONS", rename);
await browser.close();
