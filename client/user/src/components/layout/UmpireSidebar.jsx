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
  LogOut 
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const UmpireSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const mainNavItems = [
    { to: "/umpire", label: "Overview", icon: LayoutDashboard },
    { to: "/umpire/matches", label: "Matches", icon: Trophy },
    { to: "/umpire/schedule", label: "Schedule", icon: Calendar },
    { to: "/umpire/feedback", label: "Ratings", icon: Star },
  ];

  const bottomNavItems = [
    { to: "/umpire/settings", label: "Settings", icon: Settings },
    { to: "/umpire/support", label: "Support", icon: HelpCircle },
    { action: "logout", label: "SIGN OUT", icon: LogOut },
  ];

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
          <div className="absolute inset-x-2 inset-y-1 bg-[#84CC16] rounded-xl -z-10 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-all duration-300" />
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
                  : "text-white/20 group-hover:text-[#84CC16]"
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
            <button onClick={toggleSidebar} className="text-white hover:text-[#84CC16] transition-colors">
              <X size={20} />
            </button>
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
