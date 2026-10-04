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
  await page.goto("http://127.0.0.1:5173/dashboard");
  await page.getByRole("button", { name: "Subhangi & Rahul" }).waitFor();
  await page.getByRole("button", { name: "Add" }).waitFor();
  await page.getByRole("button", { name: "Account" }).click();
  const signOut = await page.getByRole("menuitem", { name: "Sign out" }).innerText();
  const logout = await page.getByRole("button", { name: "Logout" }).count();
  return {
    url: page.url(),
    signOut,
    logout,
    text: (await page.locator("body").innerText()).slice(0, 200),
  };
}
