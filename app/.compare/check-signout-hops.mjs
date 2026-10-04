async (page) => {
  const hops = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) hops.push(frame.url());
  });
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
  let signedIn = true;
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: "application/json",
      body: signedIn ? JSON.stringify(me) : JSON.stringify({ user: null }),
    }),
  );
  await page.route("**/api/auth/logout", (route) => {
    signedIn = false;
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("http://127.0.0.1:5173/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL("**/login?stay=1&pick=1", { timeout: 8000 });
  await page.waitForTimeout(1200);
  return { hops, final: page.url(), sawLeaving: hops.some((url) => url.includes("/leaving")) };
}
