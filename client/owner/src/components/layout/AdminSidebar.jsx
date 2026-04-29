import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  Home,
  Users,
  Building,
  MapPin,
  DollarSign,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ToggleRight,
  Activity,
  ShieldAlert,
  FileText
} from "lucide-react";

const AdminSidebar = ({ isOpen, toggleSidebar, className }) => {
  const location = useLocation();
  const [ownerRequestsOpen, setOwnerRequestsOpen] = useState(false);

  const navItems = [
    { to: "/admin", label: "OVERVIEW", icon: Home },
    {
      label: "RECRUITS",
      icon: UserPlus,
      subItems: [
        { to: "/admin/owner-requests/new", label: "NEW MISSIONS" },
        { to: "/admin/owner-requests/rejected", label: "FAILED OPS" },
      ],
    },
    { to: "/admin/users", label: "PLAYERS", icon: Users },
    { to: "/admin/owners", label: "GENERALS", icon: Building },
    { to: "/admin/turfs", label: "ARENAS", icon: MapPin },
    { to: "/admin/transactions", label: "FUNDS", icon: DollarSign },
    { to: "/admin/marketing", label: "MARKETING", icon: Activity },
    { to: "/admin/blogs", label: "BLOGS", icon: FileText },
    { to: "/admin/features", label: "FEATURES", icon: ToggleRight },
  ];

  const toggleOwnerRequests = () => {
    setOwnerRequestsOpen(!ownerRequestsOpen);
  };

  const renderNavItem = (item) => {
    if (item.subItems) {
      const hasActiveSubItem = item.subItems.some(sub => location.pathname === sub.to);
      
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={toggleOwnerRequests}
            className={`flex items-center justify-between w-full px-4 py-3 group relative transition-all duration-300 ${
              hasActiveSubItem ? "text-primary" : "text-white/40 hover:text-white"
            }`}
          >
            <div className="flex items-center">
              <item.icon size={16} className={`mr-4 transition-colors ${hasActiveSubItem ? "text-primary" : "text-white/20 group-hover:text-primary"}`} />
              <span className="font-display-heavy text-lg tracking-widest pt-1">
                {item.label}
              </span>
            </div>
            {ownerRequestsOpen ? (
              <ChevronUp size={14} className="opacity-40" />
            ) : (
              <ChevronDown size={14} className="opacity-40" />
            )}
          </button>
          
          {ownerRequestsOpen && (
            <div className="ml-6 space-y-1 border-l border-white/5 mt-1 mb-4">
              {item.subItems.map((subItem) => {
                const isSubActive = location.pathname === subItem.to;
                return (
                  <Link
                    key={subItem.to}
                    to={subItem.to}
                    className={`flex items-center px-4 py-2 group relative overflow-hidden transition-all duration-300 ${
                      isSubActive ? "text-black" : "text-white/30 hover:text-white"
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                  >
                    {isSubActive && (
                      <div className="absolute inset-0 bg-primary notched-corner -z-10 transition-all duration-300" />
                    )}
                    <span className={`font-display-heavy tracking-wider pt-0.5 ${isSubActive ? "text-[12px]" : "text-[11px]"}`}>
                      {subItem.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

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
      </Link>
    );
  };

  return (
    <aside
      className={`${className} bg-surface border-r border-white/5 overflow-y-auto fixed 
          w-64 transition-transform duration-300 ease-in-out z-40
          min-h-screen`}
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
          <span className="telemetry-label text-[10px] text-primary/80 mb-1">Sector 7-Admin</span>
          <span className="font-display-heavy text-xl text-white tracking-widest leading-none">COMMAND_HUB</span>
        </div>
      </div>

      <div className="p-4 py-8 space-y-4">
        <div className="px-4 mb-4">
           <span className="telemetry-label text-[9px] text-white/20 uppercase tracking-[0.4em]">Main Modules</span>
        </div>
        <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-white/5 flex items-center justify-center notched-corner border border-white/10 group hover:border-primary transition-colors">
            <ShieldAlert size={20} className="text-white/20 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
               <span className="telemetry-label text-[9px] text-primary">System Secure</span>
            </div>
            <div className="text-[11px] font-display-heavy text-white/60 tracking-widest leading-none">ADMIN_ROOT</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
