import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { getStoredSyncCode } from "../../domain/storage/sync";

const isPublicPath = (path: string): boolean =>
  path === "/" ||
  path === "/login" ||
  path.startsWith("/cohost/") ||
  path === "/dashboard" ||
  path === "/notifications" ||
  path === "/admin" ||
  path === "/welcome" ||
  path === "/create" ||
  path === "/join" ||
  path.startsWith("/join/") ||
  path.startsWith("/auth") ||
  path.startsWith("/invite") ||
  path.startsWith("/claim") ||
  path.startsWith("/ops") ||
  path === "/leaving";
/* /welcome /create /join kept public only so legacy redirects can land without a session. */

export function SessionGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { session } = useAccess();
  const { syncCode } = useWeddingState();

  const path = location.pathname;
  const isPublic = isPublicPath(path);
  const accountPage = path === "/profile";

  const linked = Boolean(syncCode || getStoredSyncCode());

  if (!linked && !isPublic && !accountPage) {
    return <Navigate to="/" replace state={{ from: path }} />;
  }

  if (linked && !session && !isPublic && !accountPage) {
    return <Navigate to="/" replace state={{ from: path }} />;
  }

  if (session?.role === "guest" && !isPublic) {
    const allowed =
      path === "/buzz" ||
      path === "/event" ||
      path === "/profile" ||
      path === "/notifications" ||
      path.startsWith("/invite");
    if (!allowed) return <Navigate to="/buzz" replace />;
  }

  if (session?.role === "buddy" && !isPublic) {
    const allowed =
      path === "/buddies" ||
      path === "/buzz" ||
      path === "/event" ||
      path === "/profile" ||
      path === "/notifications";
    if (!allowed) return <Navigate to="/buddies" replace />;
  }

  return children;
}
