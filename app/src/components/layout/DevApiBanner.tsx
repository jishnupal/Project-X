import { useEffect, useState } from "react";
import { cn } from "../../design-system/cn";

/** Shown when the app is on Vite-only port without the Wrangler API. */
export function DevApiBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const port = window.location.port;
    if (host !== "localhost" && host !== "127.0.0.1") return;
    if (port === "8788") return;

    void fetch("/api/invite/__health_check__", { method: "GET" })
      .then(async (res) => {
        const type = res.headers.get("content-type") || "";
        if (!type.includes("application/json")) setShow(true);
      })
      .catch(() => setShow(true));
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-[45] px-3 py-2 text-center text-[11px]",
        "bg-[#570013] text-white font-button",
      )}
      role="status"
    >
      Auth & sync need the API server — open{" "}
      <a href="http://localhost:8788" className="underline font-semibold">
        localhost:8788
      </a>{" "}
      (run <code className="opacity-90">npm run dev:api</code> in a second terminal).
    </div>
  );
}
