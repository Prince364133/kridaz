import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, MapPin, Star, Calendar, PlusCircle, Activity, ShieldCheck, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const PartnerSidebar = ({ isOpen, toggleSidebar, className }) => {
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
  ];

  return (
    <aside
      className={`${className} bg-surface border-r border-white/5 overflow-y-auto fixed 
          w-64 transition-transform duration-300 ease-in-out z-40
          min-h-screen ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="flex flex-col p-8 border-b border-white/5 bg-black/20 gap-4">
        <div className="flex items-center justify-between">
          <div className="w-32 h-10 bg-transparent overflow-hidden">
            <img src="/logo.png" alt="BookMySportz" className="w-full h-full object-contain object-left" />
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-[#84CC16] transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 py-8 space-y-4">
        <div className="px-4 mb-4">
           <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">Operations</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-3 group relative overflow-hidden transition-all duration-300 ${
                  isActive ? "text-black" : "text-white/40 hover:text-white"
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-[#84CC16] rounded-xl -z-10 transition-all duration-300 scale-105" />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                )}
                
                <item.icon size={16} className={`mr-4 transition-colors ${isActive ? "text-black" : "text-white/20 group-hover:text-[#84CC16]"}`} />
                <span className="font-bold text-sm tracking-wider pt-0.5">
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
      
      <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#84CC16]/10 flex items-center justify-center rounded-lg border border-[#84CC16]/20">
              <ShieldCheck size={14} className="text-[#84CC16]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                 <div className="w-1 h-1 bg-[#84CC16] rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-[#84CC16]">Security</span>
              </div>
              <div className="text-[9px] font-bold text-white/40 tracking-widest leading-none">PROTECTED</div>
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
  );
};

export default PartnerSidebar;
