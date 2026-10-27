import { Navigate } from "react-router-dom";

/** Pass craft lives inside Customize invite (letter-first). */
export function PassPage() {
  return <Navigate to="/people/letter?part=pass" replace />;
}
