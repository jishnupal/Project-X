async (page) => {
  await page.addInitScript(() => localStorage.removeItem("biyeflow.hostFaces"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/login?stay=1", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Sign up" }).waitFor();
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => {
    const sub = [...document.querySelectorAll("p")].find((el) => el.textContent.includes("Everything starts"));
    const login = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Log in");
    const signup = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Sign up");
    const img = document.querySelector("img").getBoundingClientRect();
    return {
      imgH: Math.round(img.height),
      imgY: Math.round(img.y),
      gapTextToButton: Math.round(login.getBoundingClientRect().top - sub.getBoundingClientRect().bottom),
      spaceBelowSignup: Math.round(window.innerHeight - signup.getBoundingClientRect().bottom),
      vh: window.innerHeight,
    };
  });
  await page.screenshot({ path: ".compare/signin-start.png" });
  await page.setViewportSize({ width: 390, height: 667 });
  await page.waitForTimeout(200);
  const short = await page.evaluate(() => {
    const signup = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Sign up");
    return { spaceBelow: Math.round(window.innerHeight - signup.getBoundingClientRect().bottom), vh: window.innerHeight };
  });
  await page.screenshot({ path: ".compare/signin-short.png" });
  return { box, short };
}
