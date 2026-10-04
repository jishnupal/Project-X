async (page) => {
  const user = {
    id: "u1",
    email: "riya@example.com",
    name: "Riya Sen",
    avatarUrl: null,
    platformRole: "user",
    hasPasscode: false,
  };
  const one = [
    {
      id: "m1",
      eventId: "e1",
      eventCode: "RIYA2026",
      eventName: "Riya & Arjun",
      eventType: "wedding",
      role: "admin",
      moduleGrants: {},
      status: "active",
    },
  ];
  const many = [
    one[0],
    { ...one[0], id: "m2", eventId: "e2", eventCode: "HOUSE001", eventName: "Housewarming" },
    { ...one[0], id: "m3", eventId: "e3", eventCode: "TRIP0001", eventName: "Goa trip" },
  ];

  await page.addInitScript(() => {
    const keys = [
      "biyeflow.syncCode",
      "biyeflow_sync_code",
      "biyeflow_wedding_code",
      "biyeflow.accessSession",
      "biyeflow.hostFaces",
    ];
    for (const key of keys) localStorage.removeItem(key);
  });

  const serve = async (memberships) => {
    await page.unroute("**/api/auth/me").catch(() => {});
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user, memberships }),
      }),
    );
  };

  await page.setViewportSize({ width: 390, height: 844 });

  await serve([]);
  await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Plan anything" }).waitFor();
  await page.waitForTimeout(400);
  const empty = await page.evaluate(() => {
    const img = document.querySelector("img")?.getBoundingClientRect();
    const create = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Create");
    return {
      imgY: img ? Math.round(img.y) : null,
      imgH: img ? Math.round(img.height) : null,
      createY: create ? Math.round(create.getBoundingClientRect().y) : null,
      below: create ? Math.round(window.innerHeight - create.getBoundingClientRect().bottom) : null,
    };
  });
  await page.screenshot({ path: ".compare/events-empty.png" });

  await serve(one);
  await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Riya & Arjun" }).waitFor();
  await page.waitForTimeout(400);
  const single = await page.evaluate(() => {
    const h1 = document.querySelector("h1").getBoundingClientRect();
    const open = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Open");
    const add = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Add event");
    const img = document.querySelector("img").getBoundingClientRect();
    return {
      h1W: Math.round(h1.width),
      h1X: Math.round(h1.x),
      centered: Math.abs(h1.x + h1.width / 2 - window.innerWidth / 2) < 8,
      openH: open ? Math.round(open.getBoundingClientRect().height) : null,
      addSize: add ? Math.round(parseFloat(getComputedStyle(add).fontSize)) : null,
      imgH: Math.round(img.height),
      belowOpen: open ? Math.round(window.innerHeight - open.getBoundingClientRect().bottom) : null,
    };
  });
  await page.screenshot({ path: ".compare/events-one.png" });

  await page.getByRole("button", { name: "Add event" }).click();
  await page.getByLabel("Event name").fill("Sunday dinner");
  await page.waitForTimeout(200);
  await page.screenshot({ path: ".compare/events-add.png" });
  const named = await page.getByLabel("Event name").inputValue();

  await serve(many);
  await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Housewarming" }).waitFor();
  await page.waitForTimeout(400);
  const multi = await page.evaluate(() => {
    const names = ["Riya & Arjun", "Housewarming", "Goa trip"].map((label) => {
      const el = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === label);
      const box = el.getBoundingClientRect();
      return { label, size: Math.round(parseFloat(getComputedStyle(el).fontSize)), mid: Math.round(box.x + box.width / 2) };
    });
    const add = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Add event");
    return {
      names,
      addSize: add ? Math.round(parseFloat(getComputedStyle(add).fontSize)) : null,
      pageMid: Math.round(window.innerWidth / 2),
    };
  });
  await page.screenshot({ path: ".compare/events-many.png" });

  return { empty, single, named, multi };
}
