import { test, expect, type Page } from "@playwright/test";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const API = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8788";

function randomCode(): string {
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

async function createWedding(code: string) {
  const res = await fetch(`${API}/api/event/${code}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseVersion: 0,
      state: {
        event: { name: "E2E Event", guests: 0 },
        guests: [],
        menu: [],
        functions: [
          { id: 1, name: "Day 1" },
          { id: 2, name: "Main day" },
        ],
        guestGroups: [],
      },
    }),
  });
  expect(res.ok).toBeTruthy();
}

async function bootstrapAdmin(code: string, pin = "1234") {
  const res = await fetch(`${API}/api/event/${code}/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createWeddingAsAdmin",
      deviceId: "e2e-device",
      deviceLabel: "E2E",
      name: "Test Admin",
      avatarId: "lotus",
      pin,
    }),
  });
  expect(res.ok).toBeTruthy();
}

async function signInAsAdmin(page: Page, code: string, pin = "1234") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId("landing-join").click();
  await page.getByTestId("join-wedding-code").fill(code);
  await page.getByTestId("join-wedding-submit").click();
  await expect(page.getByTestId("auth-admin-signin")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("auth-admin-signin").click();
  await page.getByLabel("Admin PIN").fill(pin);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/command-center/, { timeout: 15_000 });
}

async function seedGroupWithMembers(code: string, groupName: string, familyNames: string[]) {
  const pull = await fetch(`${API}/api/event/${code}`);
  const payload = (await pull.json()) as { version: number; state: Record<string, unknown> };
  const groupId = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const guests = familyNames.map((name, i) => ({
    id: `guest-${groupId}-${i}`,
    name,
    count: "12",
    receptionCount: "12",
    groupId,
    groupCount: "12",
    invitationSent: false,
    needsStay: false,
  }));
  const nextState = {
    ...payload.state,
    guestGroups: [{ id: groupId, name: groupName, updatedAt: Date.now() }],
    guests: [...((payload.state.guests as unknown[]) || []), ...guests],
    event: {
      ...(payload.state.event as object),
      guests: ((payload.state.guests as unknown[]) || []).length + familyNames.length,
    },
  };
  const put = await fetch(`${API}/api/event/${code}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseVersion: payload.version, state: nextState }),
  });
  expect(put.ok).toBeTruthy();
}

async function addGuest(page: Page, name: string) {
  const btn = page.getByTestId("add-guest-cta-desktop").or(page.getByTestId("add-guest-cta-mobile"));
  await btn.first().click();
  await page.getByPlaceholder("e.g. Banerjee family").fill(name);
  await page.getByRole("button", { name: "Confirm & Add Guest" }).click();
}

test.describe("People & Guests UI", () => {
  let weddingCode: string;

  test.beforeAll(async () => {
    weddingCode = randomCode();
    await createWedding(weddingCode);
    await bootstrapAdmin(weddingCode);
  });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await signInAsAdmin(page, weddingCode);
  });

  test("sidebar has flat People link without sub-items", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/people/guests");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "People" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Guests" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Menu" })).toHaveCount(0);
  });

  test("People tabs live in the header instead of duplicate BiyeFlow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/people/guests");

    const header = page.locator("header");
    await expect(header.getByRole("navigation", { name: "People sections" })).toBeVisible();
    await expect(header.getByRole("tab", { name: "Guests" })).toBeVisible();
    await expect(header.getByRole("tab", { name: "Menu" })).toBeVisible();
    await expect(header.getByRole("tab", { name: "Rooms" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "BiyeFlow" })).toHaveCount(0);

    await header.getByRole("tab", { name: "Menu" }).click();
    await expect(page).toHaveURL(/\/people\/menu/);
    await header.getByRole("tab", { name: "Guests" }).click();
    await expect(page).toHaveURL(/\/people\/guests/);
  });

  test("header shows notifications and profile on the right", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/people/guests");

    const header = page.locator("header");
    const notifications = header.getByTestId("header-notifications");
    const profile = header.getByTestId("header-profile");

    await expect(notifications).toBeVisible();
    await expect(profile).toBeVisible();

    const headerBox = await header.boundingBox();
    const profileBox = await profile.boundingBox();
    const notificationsBox = await notifications.boundingBox();
    expect(headerBox).toBeTruthy();
    expect(profileBox).toBeTruthy();
    expect(notificationsBox).toBeTruthy();
    expect(profileBox!.x).toBeGreaterThan(notificationsBox!.x);
    expect(profileBox!.x + profileBox!.width).toBeGreaterThan((headerBox!.x + headerBox!.width) * 0.85);
  });

  test("Add Guest is centered with frosted dock and hero gloss", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/people/guests");

    const dock = page.getByTestId("add-guest-dock-desktop");
    const addBtn = page.getByTestId("add-guest-cta-desktop");
    await expect(dock).toBeVisible();
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveClass(/hero-group-card/);

    const dockBox = await dock.boundingBox();
    const listColumn = page.locator(".guest-swap-pane--list").first();
    const listBox = await listColumn.boundingBox();
    expect(dockBox).toBeTruthy();
    expect(listBox).toBeTruthy();
    const dockCenter = dockBox!.x + dockBox!.width / 2;
    const listCenter = listBox!.x + listBox!.width / 2;
    expect(Math.abs(dockCenter - listCenter)).toBeLessThan(48);
  });

  test("group tiles fill the side column for one group", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedGroupWithMembers(weddingCode, "Side Party", ["Family A"]);
    await page.goto("/people/guests");
    const column = page.getByTestId("group-column");
    await expect(column).toBeVisible();
    const tile = page.getByTestId("group-tile").first();
    await expect(tile).toBeVisible();
    const columnBox = await column.boundingBox();
    const tileBox = await tile.boundingBox();
    expect(columnBox?.height ?? 0).toBeGreaterThan(180);
    expect(tileBox?.height ?? 0).toBeGreaterThan((columnBox?.height ?? 0) * 0.85);
  });

  test("group tile shows clean headline and avatar overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedGroupWithMembers(
      weddingCode,
      "Overflow Party",
      Array.from({ length: 8 }, (_, i) => `Overflow Family ${i + 1}`),
    );
    await page.goto("/people/guests");

    const tile = page.getByTestId("group-tile").filter({ hasText: "Overflow Party" }).first();
    await expect(tile).toBeVisible();
    await expect(tile.getByText(/8 families/)).toBeVisible();
    await expect(tile.getByText(/\+\d+/)).toBeVisible();
    await expect(tile.getByText("Overflow Family 1")).toHaveCount(0);
  });

  test("Add Guest button stays visible while scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/people/guests");
    const addBtn = page.getByTestId("add-guest-cta-desktop");
    await expect(addBtn).toBeVisible();
    for (let i = 1; i <= 6; i += 1) {
      await addGuest(page, `Scroll Family ${i}`);
    }
    await page.evaluate(() => {
      const scroller = document.querySelector(".guest-swap-pane--list .overflow-y-auto");
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
    await expect(addBtn).toBeVisible();
  });

  test("clicking anywhere on group tile opens the member board", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedGroupWithMembers(weddingCode, "Click Party", ["Tap Family"]);
    await page.goto("/people/guests");

    const tile = page.getByTestId("group-tile").filter({ hasText: "Click Party" }).first();
    await tile.click({ position: { x: 40, y: 40 } });
    await expect(page.getByRole("button", { name: "Back to list" })).toBeVisible();
  });

  test("group member board height stays bounded with many families", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedGroupWithMembers(
      weddingCode,
      "Big Party",
      Array.from({ length: 12 }, (_, i) => `Party Family ${i + 1}`),
    );
    await page.goto("/people/guests");

    await page.getByTestId("group-tile").filter({ hasText: "Big Party" }).first().click();
    const board = page.locator(".hero-group-card").first();
    await expect(board).toBeVisible();
    const box = await board.boundingBox();
    expect(box?.height ?? 999).toBeLessThan(560);
  });
});
