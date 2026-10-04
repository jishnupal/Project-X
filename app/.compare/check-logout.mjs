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
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.includes("/api/auth/me")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(me) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.addInitScript(() => {
    if (sessionStorage.getItem("bf-seeded") === "1") return;
    sessionStorage.setItem("bf-seeded", "1");
    localStorage.setItem("biyeflow.syncCode", "ABCD1234");
    localStorage.setItem(
      "biyeflow.accessSession",
      JSON.stringify({
        weddingCode: "ABCD1234",
        profileId: "host-1",
        role: "admin",
        moduleGrants: {},
        adminToken: "token",
        deviceId: "device-1",
      }),
    );
    localStorage.removeItem("biyeflow.holdEvents");
  });
  await page.goto("http://127.0.0.1:5173/profile");
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("**/dashboard?stay=1");
  await page.getByRole("heading", { name: "Your events" }).waitFor();
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    hold: localStorage.getItem("biyeflow.holdEvents"),
    session: localStorage.getItem("biyeflow.accessSession"),
    text: document.body.innerText.slice(0, 240),
  }));
  return { url: page.url(), ...state };
}
