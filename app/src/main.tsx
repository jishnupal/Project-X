import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import "./styles/mobile-theme.css";
import App from "./App.tsx";
import { startAppUpdateWatcher } from "./pwa/appUpdate";
import { revealAppShell } from "./pwa/boot";
import { applyIosViewportFix, lockNativeZoom } from "./pwa/viewport";
import { runLaunchSequence } from "./pwa/launch";

startAppUpdateWatcher();
lockNativeZoom();
applyIosViewportFix();
window.addEventListener("resize", applyIosViewportFix);
window.addEventListener("orientationchange", () => window.setTimeout(applyIosViewportFix, 120));
void runLaunchSequence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

revealAppShell();
