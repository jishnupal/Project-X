async (page) => {
  const shots = {};

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  shots.plainUrl = page.url();
  shots.plainText = (await page.locator("body").innerText()).slice(0, 400);
  await page.screenshot({ path: ".compare/live-5173-plain.png" });

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u1",
          email: "jishnu@example.com",
          name: "Jishnu",
          avatarUrl: null,
          hasPasscode: false,
        },
        memberships: [
          {
            id: "m1",
            eventId: "e1",
            eventCode: "BENGALI1",
            eventName: "Bengali wedding",
            eventType: "wedding",
            role: "admin",
            moduleGrants: {},
            status: "active",
          },
        ],
      }),
    }),
  );
  await page.addInitScript(() => {
    for (const key of ["biyeflow.syncCode", "biyeflow_sync_code", "biyeflow_wedding_code", "biyeflow.accessSession"]) {
      localStorage.removeItem(key);
    }
  });
  await page.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Bengali wedding" }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  const layout = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const img = document.querySelector('img[src="/events-characters.png"]');
    const open = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Open");
    const add = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Add event");
    const box = h1.getBoundingClientRect();
    return {
      heading: h1.textContent.trim(),
      centered: Math.abs(box.x + box.width / 2 - innerWidth / 2) < 12,
      hasArt: Boolean(img),
      artH: img ? Math.round(img.getBoundingClientRect().height) : 0,
      open: Boolean(open),
      add: add ? add.textContent.trim() : null,
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  await page.screenshot({ path: ".compare/live-5173-one.png" });
  return { shots, layout };
}
