import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, MapPin, Star, Calendar, PlusCircle, Activity, ShieldCheck } from "lucide-react";

const PartnerSidebar = ({ isOpen, toggleSidebar, className }) => {
  const location = useLocation();

  const navItems = [
    { to: "/partner", label: "OVERVIEW", icon: Home },
    { to: "/partner/turfs", label: "ARENAS", icon: MapPin },
    { to: "/partner/add-turf", label: "RECRUIT", icon: PlusCircle },
    { to: "/partner/reviews", label: "INTEL", icon: Star },
    { to: "/partner/bookings", label: "MISSIONS", icon: Calendar },
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
          <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col">
          <span className="telemetry-label text-[10px] text-primary/80 mb-1">Sector 2-Partner</span>
          <span className="font-display-heavy text-xl text-white tracking-widest leading-none">ARENA_COMMAND</span>
        </div>
      </div>

      <div className="p-4 py-8 space-y-4">
        <div className="px-4 mb-4">
           <span className="telemetry-label text-[9px] text-white/20 uppercase tracking-[0.4em]">Operations</span>
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
                  <div className="absolute inset-0 bg-primary notched-corner -z-10 transition-all duration-300 scale-105" />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 notched-corner -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                )}
                
                <item.icon size={16} className={`mr-4 transition-colors ${isActive ? "text-black" : "text-white/20 group-hover:text-primary"}`} />
                <span className="font-display-heavy text-lg tracking-widest pt-1">
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
      
      <div className="absolute bottom-0 left-0 w-full p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4 group">
          <div className="w-11 h-11 bg-white/5 notched-corner border border-white/10 flex items-center justify-center text-primary group-hover:border-primary transition-all duration-500">
             <ShieldCheck size={20} className="text-white/20 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
               <span className="telemetry-label text-[9px] text-primary">Sector Secure</span>
            </div>
            <div className="text-[11px] font-display-heavy text-white/60 tracking-widest leading-none">PARTNER_AUTH</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PartnerSidebar;
