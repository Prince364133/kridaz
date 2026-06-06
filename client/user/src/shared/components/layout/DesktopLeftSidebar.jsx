import { Link, useLocation } from "react-router-dom";
import { Home, Compass, MapPin, Users, Trophy, ShieldAlert, CalendarRange, Wallet, Settings } from "lucide-react";

export default function DesktopLeftSidebar() {
  const location = useLocation();

  const sidebarItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Explore", path: "/search", icon: Compass },
    { name: "Venues", path: "/venues", icon: MapPin },
    { name: "Players", path: "/players", icon: Users },
    { name: "Tournaments", path: "/leaderboard", icon: Trophy },
    { name: "Communities", path: "/my-teams", icon: ShieldAlert },
    { name: "Bookings", path: "/booking-history", icon: CalendarRange },
    { name: "Wallet", path: "/wallet", icon: Wallet },
    { name: "Settings", path: "/profile", icon: Settings },
  ];

  return (
    <aside className="fixed top-[72px] left-0 bottom-0 w-[240px] bg-[#0A0A0A] border-r border-white/5 flex flex-col py-6 px-4 gap-1.5 z-[70] select-none">
      {sidebarItems.map((item) => {
        const isActive = item.path === "/" 
          ? location.pathname === "/" || location.pathname === "/community"
          : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative text-xs font-black uppercase tracking-wider ${
              isActive
                ? "bg-[#BFF367]/10 text-[#BFF367]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {/* Active Indicator Line on the left */}
            {isActive && (
              <div className="absolute left-0 top-3.5 bottom-3.5 w-[3px] bg-[#BFF367] rounded-r-md" />
            )}
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </aside>
  );
}
