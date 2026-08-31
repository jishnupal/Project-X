import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { getStoredSyncCode } from "../../domain/storage/sync";

const isPublicPath = (path: string): boolean =>
  path === "/" ||
  path === "/create" ||
  path === "/join" ||
  path.startsWith("/join/") ||
  path.startsWith("/auth") ||
  path.startsWith("/invite") ||
  path.startsWith("/ops");

export function SessionGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { session } = useAccess();
  const { syncCode } = useWeddingState();

  const path = location.pathname;
  const isPublic = isPublicPath(path);

  const linked = Boolean(syncCode || getStoredSyncCode());

  if (!linked && !isPublic) {
    return <Navigate to="/" replace state={{ from: path }} />;
  }

  if (linked && !session && !isPublic) {
    return <Navigate to="/auth" replace state={{ from: path }} />;
  }

  if (session?.role === "guest" && !isPublic) {
    const allowed =
      path === "/buzz" ||
      path === "/profile" ||
      path.startsWith("/invite");
    if (!allowed) return <Navigate to="/buzz" replace />;
  }

  return children;
}
