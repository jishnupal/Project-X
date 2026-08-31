import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { JoinPairingHandler } from "./components/layout/JoinPairingHandler";
import { SessionGate } from "./components/layout/SessionGate";
import { AccessProvider, useAccess } from "./hooks/useAccess";
import { WeddingProvider } from "./hooks/useWeddingState";
import { AuthLandingPage } from "./components/access/AuthLandingPage";
import { InviteHandler } from "./components/access/InviteHandler";
import { ProfilePage } from "./components/access/ProfilePage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { GuestsPage } from "./pages/GuestsPage";
import { MenuPage } from "./pages/MenuPage";
import { BuzzPage } from "./pages/BuzzPage";
import { CommandCenterPage } from "./pages/CommandCenterPage";
import { PeoplePage } from "./pages/PeoplePage";
import { RoomsPage } from "./pages/RoomsPage";
import { BuddiesPage } from "./pages/BuddiesPage";
import { OpsProvisionPage } from "./pages/OpsProvisionPage";
import { LandingPage } from "./pages/LandingPage";
import { CreateWeddingPage } from "./pages/CreateWeddingPage";
import { JoinWeddingPage } from "./pages/JoinWeddingPage";

function DefaultRedirect() {
  const { session } = useAccess();
  if (!session) return <Navigate to="/" replace />;
  if (session.role === "guest") return <Navigate to="/buzz" replace />;
  return <Navigate to="/command-center" replace />;
}

/** Public marketing `/` — signed-in users go straight to Home. */
function RootEntry() {
  const { session } = useAccess();
  if (session?.role === "guest") return <Navigate to="/buzz" replace />;
  if (session) return <Navigate to="/command-center" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <WeddingProvider>
      <AccessProvider>
        <SessionGate>
          <Routes>
            <Route path="/" element={<RootEntry />} />
            <Route path="/create" element={<CreateWeddingPage />} />
            <Route path="/join" element={<JoinWeddingPage />} />
            <Route path="/join/:code" element={<JoinPairingHandler />} />
            <Route path="/auth" element={<AuthLandingPage />} />
            <Route path="/ops/provision" element={<OpsProvisionPage />} />
            <Route path="/invite/:kind/:token" element={<InviteHandler />} />
            <Route element={<AppLayout />}>
              <Route path="command-center" element={<CommandCenterPage />} />
              <Route path="people" element={<PeoplePage />}>
                <Route index element={<Navigate to="guests" replace />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="guests" element={<GuestsPage />} />
                <Route path="rooms" element={<RoomsPage />} />
              </Route>
              <Route path="buddies" element={<BuddiesPage />} />
              <Route path="buzz" element={<BuzzPage />} />
              <Route path="menu" element={<Navigate to="/people/menu" replace />} />
              <Route path="guests" element={<Navigate to="/people/guests" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="coming-soon" element={<ComingSoonPage />} />
              <Route path="*" element={<DefaultRedirect />} />
            </Route>
          </Routes>
        </SessionGate>
      </AccessProvider>
    </WeddingProvider>
  );
}
