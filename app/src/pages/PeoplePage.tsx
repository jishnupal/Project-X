import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { PEOPLE_TABS } from "../domain/navigation";

export function PeoplePage() {
  const location = useLocation();
  const { canAccessModule } = useAccess();

  const tabs = PEOPLE_TABS.filter((tab) => canAccessModule(tab.module, "view"));

  if (!tabs.length) {
    return <Navigate to="/command-center" replace />;
  }

  const onPeopleRoot =
    location.pathname === "/people" || location.pathname === "/people/";

  if (onPeopleRoot) {
    return <Navigate to={tabs[0].to} replace />;
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
