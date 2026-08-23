const READY_CLASS = "app-ready";

export function revealAppShell(): void {
  const go = () => {
    document.documentElement.classList.add(READY_CLASS);
    const cover = document.getElementById("boot-cover");
    if (!cover) return;
    window.setTimeout(() => cover.remove(), 240);
  };

  const fontsReady =
    "fonts" in document ? document.fonts.ready.catch(() => undefined) : Promise.resolve();

  void Promise.race([
    fontsReady,
    new Promise((resolve) => window.setTimeout(resolve, 280)),
  ]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(go));
  });
}
