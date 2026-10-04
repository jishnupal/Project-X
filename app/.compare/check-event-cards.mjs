async (page) => {
  const user = {
    id: "u1",
    email: "jishnu@example.com",
    name: "Jishnu",
    avatarUrl: null,
    hasPasscode: false,
  };
  const wedding = {
    id: "m1",
    eventId: "e1",
    eventCode: "BENGALI1",
    eventName: "Bengali wedding",
    eventType: "wedding",
    role: "admin",
    moduleGrants: {},
    status: "active",
  };
  const house = {
    ...wedding,
    id: "m2",
    eventId: "e2",
    eventCode: "HOUSE001",
    eventName: "Housewarming",
  };
  let memberships = [wedding];

  await page.addInitScript(() => {
    for (const key of ["biyeflow.syncCode", "biyeflow_sync_code", "biyeflow_wedding_code", "biyeflow.accessSession"]) {
      localStorage.removeItem(key);
    }
  });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user, memberships }),
    }),
  );
  await page.route("**/api/events", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    memberships = [
      wedding,
      { ...house, id: "m3", eventId: "e3", eventCode: "SUNDAY01", eventName: "Sunday dinner" },
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ event: { id: "e3", code: "SUNDAY01", name: "Sunday dinner" } }),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open Bengali wedding" }).waitFor();
  await page.waitForTimeout(500);
  const one = await page.evaluate(() => {
    const card = document.querySelector("[data-event-code]");
    const box = card.getBoundingClientRect();
    const strips = [...document.querySelectorAll("div")].filter((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      return bg === "rgb(254, 202, 67)" || bg === "rgb(224, 122, 61)";
    }).length;
    return {
      poster: Boolean(document.querySelector('img[src="/events-characters.png"]')),
      cardMid: Math.round(box.x + box.width / 2),
      pageMid: Math.round(innerWidth / 2),
      strips,
      add: [...document.querySelectorAll("button")].some((el) => el.textContent.trim() === "Add event"),
    };
  });
  await page.screenshot({ path: ".compare/cards-one.png" });

  memberships = [wedding, house];
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open Housewarming" }).waitFor();
  await page.waitForTimeout(400);
  const colors = await page.evaluate(() =>
    [...document.querySelectorAll("[data-event-code]")].map((el) => ({
      name: el.getAttribute("aria-label"),
      bg: getComputedStyle(el).backgroundColor,
    })),
  );
  await page.screenshot({ path: ".compare/cards-many.png" });

  await page.getByRole("button", { name: "Add event" }).click();
  await page.getByLabel("Event name").fill("Sunday dinner");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("button", { name: "Open Sunday dinner" }).waitFor();
  await page.waitForTimeout(700);
  const after = { url: page.url(), stayed: page.url().includes("/dashboard") };
  await page.screenshot({ path: ".compare/cards-created.png" });
  return { one, colors, after };
}
