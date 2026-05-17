import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlayCircle, Users, User, Zap, Coins } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { reelsApi } from "../../../redux/api/reelsApi";
import { useCallback } from "react";

const MobileBottomNav = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoggedIn, role } = useSelector((state) => state.auth);

  const getDashboardPath = () => {
    const roleStr = role?.toLowerCase() || "";
    if (roleStr.includes("admin")) return "/admin";
    if (["venu_owners", "owner", "venue_owner", "verified_venue_owner"].some(r => roleStr.includes(r))) return "/partner";
    if (roleStr.includes("coach")) return "/coach";
    if (roleStr.includes("umpire")) return "/umpire";
    return "/profile";
  };

  // Predictive Prefetching for Reels
  const handlePrefetchReels = useCallback(() => {
    // This will pre-load the Reels feed data in the background
    // so the page is "instant" when they click it.
    dispatch(
      reelsApi.util.prefetch("getReelsFeed", undefined, { force: true })
    );
  }, [dispatch]);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/turfs", icon: Search },
    { 
      name: "Reels", 
      path: "/reels", 
      icon: PlayCircle,
      onMouseEnter: handlePrefetchReels,
      onTouchStart: handlePrefetchReels
    },
    { name: "Games", path: "/join-games", icon: Zap },
    { name: "Profile", path: "/profile", icon: User },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter(item => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-2xl border-t border-white/10 px-4 pb-safe-area-inset-bottom">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onMouseEnter={item.onMouseEnter}
              onTouchStart={item.onTouchStart}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 ${
                isActive ? "text-[#84CC16]" : "text-white/40 hover:text-white/60"
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                isActive ? "bg-[#84CC16]/10 scale-110" : ""
              }`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#84CC16] rounded-full shadow-[0_0_8px_#84CC16]" />
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                isActive ? "opacity-100" : "opacity-60"
              }`}>
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
