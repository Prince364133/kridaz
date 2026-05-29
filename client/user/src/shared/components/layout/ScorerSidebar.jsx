import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  X, 
  LayoutDashboard, 
  Trophy, 
  Calendar, 
  Settings, 
  HelpCircle, 
  Activity,
  IndianRupee,
  Landmark,
  Clock,
  User,
  Zap
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import useScorerDashboard from "@hooks/owner/useScorerDashboard";

const ScorerSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, user } = useSelector((state) => state.auth);
  const { dashboardData, loading: dashLoading } = useScorerDashboard();
  const isLimitedScorer = role?.toLowerCase() === "limited_scorer";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const mainNavItems = [
    { to: "/scorer", label: "Overview", icon: LayoutDashboard },
    { to: "/scorer/matches", label: "Matches", icon: Trophy },
    { to: "/scorer/schedule", label: "Schedule", icon: Calendar },
    { to: "/scorer/availability", label: "Availability", icon: Clock },
    { to: "/scorer/bookings", label: "Bookings", icon: Activity },
    { to: "/scorer/revenue", label: "Earnings", icon: IndianRupee },
    { to: "/scorer/banking", label: "Payout & Banking", icon: Landmark },
    { to: getDynamicProfileRoute(user, role), label: "Profile", icon: User },
    { to: "/scorer/support", label: "Docs & Support", icon: HelpCircle },
  ].filter(item => {
    if (isLimitedScorer) {
      return item.to === "/scorer/matches" || item.to.startsWith("/scoring/");
    }
    return true;
  });

  const bottomNavItems = [];

  const renderNavItem = (item) => {
    const isLogout = item.action === "logout";
    const isActive = !isLogout && location.pathname === item.to;
    const Icon = item.icon;

    return (
      <Link
        key={item.to || item.label}
        to={item.to || "#"}
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 font-inter ${ isLogout ? "text-white/40 hover:text-red-500" : isActive ? "text-black" : "text-white/40 hover:text-white" }`}
        onClick={(e) => {
          if (isLogout) {
            e.preventDefault();
            handleLogout();
            return;
          }
          if (window.innerWidth < 1024) {
            toggleSidebar();
          }
        }}
      >
        {isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-[#00C187] rounded-[8px] -z-10 shadow-[0_0_15px_rgba(0,193,135,0.3)] transition-all duration-300" />
        )}
        
        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon 
            size={18} 
            className={`transition-colors duration-300 ${ isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-white/20 group-hover:text-[#00C187]" }`} 
          />
        </div>

        <span className={`font-semibold text-[13px] uppercase tracking-wider ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#000000] border-r border-white/5 overflow-x-hidden transition-all duration-300 ease-in-out z-50 flex flex-col font-inter ${isMinimized ? "lg:w-20" : "w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className || ""}`}
      >
        <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <button onClick={toggleSidebar} className="text-white hover:text-[#00C187] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={`px-4 py-6 border-b border-white/5 transition-all duration-300 ${isMinimized ? "items-center" : ""}`}>
          <div className="flex items-center gap-3">
             <div className={`flex-shrink-0 w-2 h-2 rounded-full ${isLimitedScorer ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] animate-pulse" : "bg-[#00C187] shadow-[0_0_10px_rgba(0,193,135,0.5)]"}`} />
             {!isMinimized && (
               <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#878C9F] leading-none mb-1">Professional Status</p>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${isLimitedScorer ? "text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" : "text-[#00C187]"}`}>
                    {isLimitedScorer ? "Limited Access" : "Verified Scorer"}
                  </p>
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          <nav className="px-2 space-y-1">
            {mainNavItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="p-2 border-t border-white/5 space-y-1 mb-4">
          {bottomNavItems.map(renderNavItem)}
        </div>
      </aside>
    </>
  );
};

export default ScorerSidebar;
