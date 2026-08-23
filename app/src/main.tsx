import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";
import App from "./App.tsx";
import { startAppUpdateWatcher } from "./pwa/appUpdate";
import { revealAppShell } from "./pwa/boot";
import { runLaunchSequence } from "./pwa/launch";

startAppUpdateWatcher();
void runLaunchSequence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

revealAppShell();
