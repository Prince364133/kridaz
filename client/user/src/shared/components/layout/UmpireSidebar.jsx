import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  X, 
  LayoutDashboard, 
  Trophy, 
  Calendar, 
  Star, 
  Settings, 
  HelpCircle, 
  LogOut,
  ShieldCheck,
  Activity,
  IndianRupee,
  Landmark,
  Clock,
  User
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import { toast } from "react-hot-toast";

const UmpireSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);
  const { dashboardData, loading: dashLoading } = useUmpireDashboard();
  const isLimitedUmpire = role?.toLowerCase() === "limited_umpire";
  const upgradeRequested = dashboardData?.upgradeRequested || false;
  const [requestLoading, setRequestLoading] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const handleRequestUpgrade = async () => {
    setRequestLoading(true);
    try {
      const res = await axiosInstance.post("/api/user/auth/request-upgrade");
      if (res.data.success) {
        toast.success("Upgrade request sent to admin!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send upgrade request");
    } finally {
      setRequestLoading(false);
    }
  };

  const mainNavItems = [
    { to: "/umpire", label: "Overview", icon: LayoutDashboard },
    { to: "/umpire/matches", label: "Matches", icon: Trophy },
    { to: "/umpire/schedule", label: "Schedule", icon: Calendar },
    { to: "/umpire/availability", label: "Availability", icon: Clock },
    { to: "/umpire/bookings", label: "Bookings", icon: Activity },
    { to: "/umpire/revenue", label: "Earnings", icon: IndianRupee },
    { to: "/umpire/banking", label: "Payout & Banking", icon: Landmark },
    { to: "/umpire/profile", label: "Profile", icon: User },
    { to: "/umpire/support", label: "Docs & Support", icon: HelpCircle },
  ].filter(item => {
    if (isLimitedUmpire) {
      return item.to === "/umpire/matches";
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
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 ${
          isLogout 
            ? "text-white/40 hover:text-red-500" 
            : isActive 
              ? "text-black" 
              : "text-white/40 hover:text-white"
        }`}
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
        {/* Active Glow/Background */}
        {isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-[#55DEE8] rounded-xl -z-10 shadow-[0_0_15px_rgba(85,222,232,0.3)] transition-all duration-300" />
        )}
        
        {/* Hover Background */}
        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        {isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
        )}
        
        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon 
            size={18} 
            className={`transition-colors duration-300 ${
              isLogout 
                ? "text-white/20 group-hover:text-red-500" 
                : isActive 
                  ? "text-black" 
                  : "text-white/20 group-hover:text-[#55DEE8]"
            }`} 
          />
        </div>

        <span className={`font-medium text-sm tracking-wide ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#0a0a0a] border-r border-white/5 overflow-x-hidden transition-all duration-300 ease-in-out z-50 flex flex-col
          ${isMinimized ? "lg:w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className || ""}`}
      >
        <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <button onClick={toggleSidebar} className="text-white hover:text-[#55DEE8] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className={`px-4 py-6 border-b border-white/5 transition-all duration-300 ${isMinimized ? "items-center" : ""}`}>
          <div className="flex items-center gap-3">
             <div className={`flex-shrink-0 w-2 h-2 rounded-full ${isLimitedUmpire ? "bg-amber-500 animate-pulse" : "bg-[#55DEE8] shadow-[0_0_10px_rgba(85,222,232,0.5)]"}`} />
             {!isMinimized && (
               <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none mb-1">Status</p>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${isLimitedUmpire ? "text-amber-500" : "text-[#55DEE8]"}`}>
                    {isLimitedUmpire ? "Unverified" : "Verified"}
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


export default UmpireSidebar;
