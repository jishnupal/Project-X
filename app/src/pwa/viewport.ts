const NATIVE_VIEWPORT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover";

/** Native-app feel: no pinch / drag / double-tap zoom. Scroll still works. */
export function lockNativeZoom(): void {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    const current = meta.getAttribute("content") || NATIVE_VIEWPORT;
    // Preserve contain vs cover swap from boot script; keep scale locks.
    const fit = /viewport-fit=contain/i.test(current) ? "contain" : "cover";
    meta.setAttribute(
      "content",
      `width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=${fit}`,
    );
  }

  const blockGesture = (event: Event) => {
    event.preventDefault();
  };

  // Older iOS Safari pinch zoom
  document.addEventListener("gesturestart", blockGesture, { passive: false });
  document.addEventListener("gesturechange", blockGesture, { passive: false });
  document.addEventListener("gestureend", blockGesture, { passive: false });

  // Multi-finger pinch / drag-zoom
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false },
  );
}

export function applyIosViewportFix(): void {
  const root = document.documentElement;
  const height = window.innerHeight;
  root.style.setProperty("--vh", `${height * 0.01}px`);

  const cover = document.getElementById("boot-cover");
  if (cover) cover.style.minHeight = `${height}px`;
}

export function setThemeColor(color: string): void {
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
    node.setAttribute("content", color);
  });
}
