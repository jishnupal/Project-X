import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppIntro } from "./components/access/AppIntro";
import { AppLayout } from "./components/layout/AppLayout";
import { SessionGate } from "./components/layout/SessionGate";
import { AccessProvider, useAccess } from "./hooks/useAccess";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { WeddingProvider } from "./hooks/useWeddingState";
import { ClaimInvitePage } from "./pages/ClaimInvitePage";
import { InviteHandler } from "./components/access/InviteHandler";
import { ProfilePage } from "./components/access/ProfilePage";
import { EventSettingsPage } from "./pages/EventSettingsPage";
import { CohostAcceptPage } from "./pages/CohostAcceptPage";
import { ContactsPage } from "./pages/ContactsPage";
import { FilmPage } from "./pages/FilmPage";
import { InvitationsPage } from "./pages/InvitationsPage";
import { LetterPage } from "./pages/LetterPage";
import { InvitePreviewPage } from "./pages/InvitePreviewPage";
import { PassPage } from "./pages/PassPage";
import { GuestsPage } from "./pages/GuestsPage";
import { MenuPage } from "./pages/MenuPage";
import { BuzzPage } from "./pages/BuzzPage";
import { CommandCenterPage } from "./pages/CommandCenterPage";
import { PeoplePage } from "./pages/PeoplePage";
import { RoomsPage } from "./pages/RoomsPage";
import { BuddiesPage } from "./pages/BuddiesPage";
import { OpsProvisionPage } from "./pages/OpsProvisionPage";
import { LoginPage } from "./pages/LoginPage";
import { LeavingPage } from "./pages/LeavingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PlatformAdminPage } from "./pages/PlatformAdminPage";

function DefaultRedirect() {
  const { session } = useAccess();
  if (!session) return <Navigate to="/" replace />;
  if (session.role === "guest") return <Navigate to="/buzz" replace />;
  if (session.role === "buddy") return <Navigate to="/buddies" replace />;
  return <Navigate to="/command-center" replace />;
}

/** App entry — Google identity first, then event dashboard / PIN. */
function RootEntry() {
  const { session } = useAccess();
  const { status } = useAuth();
  const [held, setHeld] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem("biyeflow.introSeen", "1");
      } catch {
        /* ignore */
      }
      setHeld(false);
    }, reduce ? 280 : 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (status === "loading" || held) {
    return <AppIntro />;
  }

  if (status === "authenticated") {
    if (session?.role === "guest") return <Navigate to="/buzz" replace />;
    if (session?.role === "buddy") return <Navigate to="/buddies" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <WeddingProvider>
        <AccessProvider>
          <SessionGate>
            <Routes>
              <Route path="/" element={<RootEntry />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/leaving" element={<LeavingPage />} />
              <Route path="/cohost/:token" element={<CohostAcceptPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/admin" element={<PlatformAdminPage />} />
              {/* Legacy doors → current host flow */}
              <Route path="/welcome" element={<Navigate to="/login" replace />} />
              <Route path="/create" element={<Navigate to="/dashboard" replace />} />
              <Route path="/join" element={<Navigate to="/dashboard" replace />} />
              <Route path="/join/:code" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/ops/provision" element={<OpsProvisionPage />} />
              <Route path="/invite/:kind/:token" element={<ClaimInvitePage />} />
              <Route path="/claim/:code" element={<ClaimInvitePage />} />
              <Route path="/invite-legacy/:kind/:token" element={<InviteHandler />} />
              <Route element={<AppLayout />}>
                <Route path="command-center" element={<CommandCenterPage />} />
                <Route path="people" element={<PeoplePage />}>
                  <Route index element={<Navigate to="contacts" replace />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="guests" element={<GuestsPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="invites" element={<InvitationsPage />} />
                  <Route path="preview" element={<InvitePreviewPage />} />
                  <Route path="film" element={<FilmPage />} />
                  <Route path="letter" element={<LetterPage />} />
                  <Route path="pass" element={<PassPage />} />
                  <Route path="rooms" element={<RoomsPage />} />
                </Route>
                <Route path="buddies" element={<BuddiesPage />} />
                <Route path="buzz" element={<BuzzPage />} />
                <Route path="menu" element={<Navigate to="/people/menu" replace />} />
                <Route path="guests" element={<Navigate to="/people/guests" replace />} />
                <Route path="event" element={<EventSettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<DefaultRedirect />} />
              </Route>
            </Routes>
          </SessionGate>
        </AccessProvider>
      </WeddingProvider>
    </AuthProvider>
  );
}
