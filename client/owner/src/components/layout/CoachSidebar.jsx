import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, Users, Calendar, Video, LayoutDashboard, Target, Activity, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const CoachSidebar = ({ isOpen, toggleSidebar }) => {
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
        className={`fixed bg-surface border-r border-white/5 z-50 transition-transform duration-500 ease-in-out lg:translate-x-0 
          w-64 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
          <div className="px-4 mb-4">
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Navigation</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-3 group relative overflow-hidden transition-all duration-500 rounded-xl ${
                    isActive ? "text-black" : "text-white/40 hover:text-white"
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary -z-10 animate-in fade-in zoom-in-95 duration-500" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/5 -z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  )}
                  
                  <item.icon size={16} className={`mr-4 transition-transform duration-500 ${isActive ? "text-black" : "text-white/20 group-hover:text-primary"}`} />
                  <span className="text-sm font-bold tracking-widest pt-1 uppercase">
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <div className="absolute right-4 w-1 h-3 bg-black/20 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile / Status */}
        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20">
                <Target size={14} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                   <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-primary">Status</span>
                </div>
                <div className="text-[9px] font-bold text-white/40 tracking-widest leading-none uppercase">Online</div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 group"
              title="Sign Out"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default CoachSidebar;
