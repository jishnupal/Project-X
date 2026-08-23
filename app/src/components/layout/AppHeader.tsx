import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

const HEADER_TABS = [
  { to: "/coming-soon", label: "Dashboard" },
  { to: "/coming-soon", label: "Vendors" },
  { to: "/menu", label: "Menu" },
  { to: "/guests", label: "Guests" },
];

const AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByYAeEZ-ZTqtbjcLCAOCBzSN_hR_qSPXh-pNL1RkwPaZj525_Grtc2StdALZtvpWY-DMzV5FaZfCo9ItM8sf0nkPteExNVaZJKKso8m6xR8xJEaInZyCINYiIuRWYYPZyBAVNItrYlL08MlLfz8RJLtLEjbKrC__L1Z9S7W0JoZFfZ9yM78MJQXsT1LtAqB1_hILylzDdZ87UKomIabfjRTThhOfQirC8_JcCDTxbwbriXCy-foRKgqU6z-5D3nC73_GPWR7V1nE0";

export function AppHeader() {
  return (
    <header className="flex justify-between items-center w-full px-3 sm:px-margin-mobile md:px-margin-desktop py-3 lg:py-4 border-b border-outline-variant bg-surface sticky top-0 z-40">
      <div className="lg:hidden flex items-center gap-2 min-w-0">
        <span className="font-headline-md text-lg sm:text-headline-md font-bold text-primary truncate">
          BiyeFlow
        </span>
      </div>

      <div className="hidden lg:flex gap-8">
        {HEADER_TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "font-label-caps text-label-caps transition-colors",
                isActive
                  ? "text-primary font-bold border-b-2 border-primary pb-1"
                  : "text-secondary-fixed-dim hover:text-primary",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Icon name="notifications" className="hidden sm:block text-secondary cursor-pointer" />
        <Icon name="settings" className="hidden sm:block text-secondary cursor-pointer" />
        <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden shrink-0">
          <img className="w-full h-full object-cover" src={AVATAR_URL} alt="Profile" />
        </div>
      </div>
    </header>
  );
}
