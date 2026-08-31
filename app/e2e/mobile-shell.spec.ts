import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14 Pro"] });

/**
 * iPhone 14 Pro shell smoke — landing clears the top status/island band.
 */
test.describe("Mobile shell (iPhone 14 Pro)", () => {
  test("landing clears top chrome and shows create/join", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.getByTestId("landing-create")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("landing-join")).toBeVisible();
    const header = page.getByRole("heading", { name: "BiyeFlow" });
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box).toBeTruthy();
    // Content should start below a typical Dynamic Island / status band (~54px)
    expect(box!.y).toBeGreaterThanOrEqual(40);
  });
});
