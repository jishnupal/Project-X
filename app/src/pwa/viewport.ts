const THEME_CREAM = "#fff8f5";

export function applyIosViewportFix(): void {
  const root = document.documentElement;
  const height = window.innerHeight;
  root.style.setProperty("--vh", `${height * 0.01}px`);

  const cover = document.getElementById("boot-cover");
  if (cover) cover.style.minHeight = `${height}px`;

  setThemeColor(THEME_CREAM);
}

export function setThemeColor(color: string): void {
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
    node.setAttribute("content", color);
  });
}
