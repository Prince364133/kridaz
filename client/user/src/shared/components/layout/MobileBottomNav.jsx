import { Link, useLocation } from "react-router-dom";
import { Home, Search, Users, UserSearch, Trophy } from "lucide-react";
import { useSelector } from "react-redux";
import { useScrollDirection } from "@hooks/useScrollDirection.js";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isLoggedIn, role } = useSelector((state) => state.auth);
  const { scrollDirection, scrolled } = useScrollDirection();

  const getDashboardPath = () => {
    const roleStr = role?.toLowerCase() || "";
    if (roleStr.includes("admin")) return "/admin";
    if (["venu_owners", "owner", "venue_owner", "verified_venue_owner"].some(r => roleStr.includes(r))) return "/venue-owner";
    if (roleStr.includes("coach")) return "/professional/coach";
    if (roleStr.includes("umpire")) return "/umpire";
    return "/profile";
  };


  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/venues", icon: Search },
    { name: "Profiles", path: "/players", icon: UserSearch },
    { name: "Pros", path: "/professionals", icon: Trophy },
    { name: "My Teams", path: "/my-teams", icon: Users, protected: true },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter(item => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-2xl border-t border-white/10 px-4 pb-safe-area-inset-bottom transition-transform duration-500 translate-y-0">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onMouseEnter={item.onMouseEnter}
              onTouchStart={item.onTouchStart}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 ${ isActive ? "text-[#55DEE8]" : "text-white/40 hover:text-white/60" }`}
            >
              <div className={`relative p-1.5 rounded-[8px] transition-all duration-300 ${ isActive ? "bg-[#55DEE8]/10 scale-110" : "" }`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#55DEE8] rounded-full shadow-[0_0_8px_#55DEE8]" />
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${ isActive ? "opacity-100" : "opacity-60" }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
