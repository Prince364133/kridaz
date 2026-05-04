import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, Users, Calendar, Video, LayoutDashboard, Target, Activity, LogOut } from "lucide-react";
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

  const navItems = [
    { to: "/coach", label: "OVERVIEW", icon: LayoutDashboard },
    { to: "/coach/students", label: "ROSTER", icon: Users },
    { to: "/coach/sessions", label: "SESSIONS", icon: Calendar },
    { to: "/coach/masterclass", label: "MASTERCLASS", icon: Video },
    { action: "logout", label: "SIGN OUT", icon: LogOut },
  ];

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
        className={`fixed left-0 bg-[#0a0a0a] border-r border-white/5 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 
          top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-x-hidden overflow-y-auto ${
          isMinimized ? "lg:w-20" : "w-64"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} ${className || ""}`}
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <button onClick={toggleSidebar} className="text-white hover:text-primary transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 py-8 space-y-4">
          <div className="px-4 mb-4 h-4">
             <span className={`text-[9px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isMinimized ? "opacity-0 w-0 overflow-hidden inline-block" : "opacity-100 w-auto"}`}>Navigation</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isLogout = item.action === "logout";
              const isActive = !isLogout && location.pathname === item.to;
              return (
                <Link
                  key={item.to || item.label}
                  to={item.to || "#"}
                  className={`flex items-center px-4 py-3 group relative overflow-hidden transition-all duration-500 rounded-xl ${
                    isLogout ? "text-white/40 hover:text-red-500 mt-8" : isActive ? "text-black" : "text-white/40 hover:text-white"
                  }`}
                  onClick={(e) => {
                    if (isLogout) {
                      e.preventDefault();
                      handleLogout();
                      return;
                    }
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                >
                  {isActive && !isLogout && (
                    <div className="absolute inset-0 bg-primary -z-10 animate-in fade-in zoom-in-95 duration-500" />
                  )}
                  {!isActive && !isLogout && (
                    <div className="absolute inset-0 bg-white/5 -z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  )}
                  {isLogout && (
                    <div className="absolute inset-0 bg-white/5 -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-500" />
                  )}
                  
                  <div className="flex-shrink-0 flex items-center justify-center w-6">
                    <item.icon size={16} className={`transition-transform duration-500 ${isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-white/20 group-hover:text-primary"}`} />
                  </div>
                  <span className={`text-sm font-bold tracking-widest pt-1 ml-4 uppercase whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
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
    </>
  );
};

export default CoachSidebar;
