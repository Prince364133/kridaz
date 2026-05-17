import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Video, 
  Settings, 
  HelpCircle, 
  LogOut,
  Home,
  Target,
  Activity,
  Clock,
  MessageSquare,
  User,
  IndianRupee,
  Landmark
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const CoachSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const mainNavItems = [
    { to: "/coach", label: "Overview", icon: LayoutDashboard },
    { to: "/coach/students", label: "Roster", icon: Users },
    { to: "/coach/sessions", label: "Sessions", icon: Calendar },
    { to: "/coach/availability", label: "Availability", icon: Clock },
    { to: "/coach/bookings", label: "Bookings", icon: Activity },
    { to: "/coach/revenue", label: "Earnings", icon: IndianRupee },
    { to: "/coach/banking", label: "Payout & Banking", icon: Landmark },
    { to: "/coach/profile", label: "Profile", icon: User },
    { to: "/coach/masterclass", label: "Masterclass", icon: Video },
    { to: "/coach/support", label: "Docs & Support", icon: HelpCircle },
  ];

  const bottomNavItems = [];

  const renderNavItem = (item) => {
    const isLogout = item.action === "logout";
    const isActive = !isLogout && location.pathname === item.to;
    const Icon = item.icon;

    return (
      <Link
        key={item.to || item.label}
        to={item.to || "#"}
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 font-inter ${
          isLogout 
            ? "text-white/40 hover:text-red-500" 
            : isActive 
              ? "text-black" 
              : "text-[#878C9F] hover:text-white"
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
          <div className="absolute inset-x-2 inset-y-1 bg-[#CCFF00] rounded-[6px] -z-10 shadow-[var(--shadow-2)] transition-all duration-300" />
        )}
        
        {/* Hover Background */}
        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-[#2D2D2D]/30 border border-[#2D2D2D] rounded-[6px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        {isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[6px] -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
        )}
        
        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon 
            size={18} 
            className={`transition-colors duration-300 ${
              isLogout 
                ? "text-white/20 group-hover:text-red-500" 
                : isActive 
                  ? "text-black" 
                  : "text-[#878C9F] group-hover:text-[#CCFF00]"
            }`} 
          />
        </div>

        <span className={`font-semibold text-[13px] tracking-wide ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
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
        className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#000000] border-r border-[#2D2D2D] overflow-x-hidden transition-all duration-300 ease-in-out z-50 flex flex-col font-open-sans
          ${isMinimized ? "lg:w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className || ""}`}
      >
        <div className="flex flex-col p-4 border-b border-[#2D2D2D] bg-[#000000] gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <button onClick={toggleSidebar} className="text-white hover:text-[#CCFF00] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          <nav className="px-2 space-y-1">
            {mainNavItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="p-2 border-t border-[#2D2D2D] space-y-1 mb-4">
          {bottomNavItems.map(renderNavItem)}
        </div>
      </aside>
    </>
  );
};


export default CoachSidebar;
