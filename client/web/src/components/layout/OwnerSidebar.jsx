import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, MapPin, Star, Calendar, PlusCircle, Activity, ShieldCheck, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const PartnerSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const navItems = [
    { to: "/partner", label: "OVERVIEW", icon: Home },
    { to: "/partner/turfs", label: "VENUES", icon: MapPin },
    { to: "/partner/reviews", label: "REVIEWS", icon: Star },
    { to: "/partner/bookings", label: "BOOKINGS", icon: Calendar },
    { action: "logout", label: "SIGN OUT", icon: LogOut },
  ];

  return (
    <aside
      className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#0a0a0a] border-r border-white/5 overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out z-40
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

      <div className="p-4 py-8 space-y-4">
        <div className="px-4 mb-4 h-4">
           <span className={`text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] whitespace-nowrap transition-all duration-300 ${isMinimized ? "opacity-0 w-0 overflow-hidden inline-block" : "opacity-100 w-auto"}`}>Operations</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isLogout = item.action === "logout";
            const isActive = !isLogout && location.pathname === item.to;
            return (
              <Link
                key={item.to || item.label}
                to={item.to || "#"}
                className={`flex items-center px-4 py-3 group relative overflow-hidden transition-all duration-300 ${
                  isLogout ? "text-white/40 hover:text-red-500 mt-8" : isActive ? "text-black" : "text-white/40 hover:text-white"
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
                {isActive && !isLogout && (
                  <div className="absolute inset-0 bg-[#84CC16] rounded-xl -z-10 transition-all duration-300 scale-105" />
                )}
                {!isActive && !isLogout && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                )}
                {isLogout && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
                )}
                
                <div className="flex-shrink-0 flex items-center justify-center w-6">
                  <item.icon size={16} className={`transition-colors ${isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-white/20 group-hover:text-[#84CC16]"}`} />
                </div>
                <span className={`font-bold text-sm tracking-wider pt-0.5 ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
                  {item.label}
                </span>
                
                {isActive && !isMinimized && (
                  <div className="absolute right-4 w-1 h-3 bg-black/20 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default PartnerSidebar;
