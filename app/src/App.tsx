import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { WeddingProvider } from "./hooks/useWeddingState";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { GuestsPage } from "./pages/GuestsPage";
import { MenuPage } from "./pages/MenuPage";

export default function App() {
  return (
    <WeddingProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/menu" replace />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="coming-soon" element={<ComingSoonPage />} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Route>
      </Routes>
    </WeddingProvider>
  );
}
