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
  User,
  Video
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import axiosInstance from "@hooks/useAxiosInstance";
import useStreamerDashboard from "@hooks/owner/useStreamerDashboard";
import { toast } from "react-hot-toast";

const StreamerSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, user } = useSelector((state) => state.auth);
  const { dashboardData, loading: dashLoading } = useStreamerDashboard();
  const isLimitedStreamer = role?.toLowerCase() === "limited_streamer";
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
    { to: "/streamer", label: "Overview", icon: LayoutDashboard },
    { to: "/streamer/matches", label: "Stream Matches", icon: Video },
    { to: "/streamer/schedule", label: "Schedule", icon: Calendar },
    { to: "/streamer/availability", label: "Availability", icon: Clock },
    { to: "/streamer/bookings", label: "Bookings", icon: Activity },
    { to: "/streamer/revenue", label: "Earnings", icon: IndianRupee },
    { to: "/streamer/banking", label: "Payout & Banking", icon: Landmark },
    { to: getDynamicProfileRoute(user, role), label: "Profile", icon: User },
    { to: "/streamer/support", label: "Docs & Support", icon: HelpCircle },
  ].filter(item => {
    if (isLimitedStreamer) {
      return item.to === "/streamer/matches";
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
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 ${ isLogout ? "text-white/40 hover:text-red-500" : isActive ? "text-white" : "text-white/40 hover:text-white" }`}
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
          <div className="absolute inset-x-2 inset-y-1 bg-violet-500 rounded-[8px] -z-10 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300" />
        )}
        
        {/* Hover Background */}
        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        {isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
        )}
        
        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon 
            size={18} 
            className={`transition-colors duration-300 ${ isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-white" : "text-white/20 group-hover:text-violet-500" }`} 
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
        className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#0a0a0a] border-r border-white/5 overflow-x-hidden transition-all duration-300 ease-in-out z-50 flex flex-col ${isMinimized ? "lg:w-20" : "w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className || ""}`}
      >
        <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <button onClick={toggleSidebar} className="text-white hover:text-violet-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className={`px-4 py-6 border-b border-white/5 transition-all duration-300 ${isMinimized ? "items-center" : ""}`}>
          <div className="flex items-center gap-3">
             <div className={`flex-shrink-0 w-2 h-2 rounded-full ${isLimitedStreamer ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] animate-pulse" : "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"}`} />
             {!isMinimized && (
               <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none mb-1">Status</p>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${isLimitedStreamer ? "text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" : "text-violet-500"}`}>
                    {isLimitedStreamer ? "Unverified" : "Verified"}
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

export default StreamerSidebar;
