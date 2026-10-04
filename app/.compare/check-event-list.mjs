async (page) => {
  const me = {
    user: {
      id: "u1",
      email: "host@gmail.com",
      name: "Subhangi Paul",
      avatarUrl: null,
      platformRole: "customer",
      hasPasscode: false,
    },
    memberships: [
      {
        id: "m1",
        eventId: "e1",
        eventCode: "ABCD1234",
        eventName: "Subhangi & Rahul",
        eventType: "wedding",
        role: "admin",
        moduleGrants: {},
        status: "active",
      },
    ],
  };
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(me) }),
  );
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.addInitScript(() => localStorage.setItem("biyeflow.holdEvents", "1"));
  await page.goto("http://127.0.0.1:5173/dashboard?stay=1");
  await page.getByRole("heading", { name: "Your events" }).waitFor();
  await page.getByRole("button", { name: "Account menu" }).click();
  const label = await page.getByRole("button", { name: "Sign out of Google" }).innerText();
  const opening = await page.getByText("Opening your event").count();
  const held = {
    url: page.url(),
    label,
    opening,
    text: (await page.locator("body").innerText()).slice(0, 280),
  };
  await page.evaluate(() => localStorage.removeItem("biyeflow.holdEvents"));
  await page.goto("http://127.0.0.1:5173/dashboard");
  await page.waitForTimeout(800);
  const plain = {
    url: page.url(),
    text: (await page.locator("body").innerText()).slice(0, 280),
  };
  return { held, plain };
}
