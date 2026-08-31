import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import App from "./App.tsx";
import { startAppUpdateWatcher } from "./pwa/appUpdate";
import { revealAppShell } from "./pwa/boot";
import { applyIosViewportFix } from "./pwa/viewport";
import { runLaunchSequence } from "./pwa/launch";

startAppUpdateWatcher();
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
