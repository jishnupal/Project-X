async (page) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "u1", email: "riya@example.com", name: "Riya Sen", avatarUrl: null, hasPasscode: false },
        memberships: [],
      }),
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create" }).waitFor();
  const yellow = await page.getByRole("button", { name: "Create" }).evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).waitFor();
  await page.screenshot({ path: ".compare/events-signout.png" });
  return { yellow };
}
