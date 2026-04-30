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
  FileText,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const AdminSidebar = ({ isOpen, toggleSidebar, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [ownerRequestsOpen, setOwnerRequestsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const navItems = [
    { to: "/admin", label: "OVERVIEW", icon: Home },
    {
      label: "REQUESTS",
      icon: UserPlus,
      subItems: [
        { to: "/admin/owner-requests/new", label: "NEW REQUESTS" },
        { to: "/admin/owner-requests/rejected", label: "REJECTED" },
      ],
    },
    { to: "/admin/users", label: "USERS", icon: Users },
    { to: "/admin/owners", label: "OWNERS", icon: Building },
    { to: "/admin/turfs", label: "VENUES", icon: MapPin },
    { to: "/admin/transactions", label: "TRANSACTIONS", icon: DollarSign },
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
              hasActiveSubItem ? "text-[#84CC16]" : "text-white/40 hover:text-white"
            }`}
          >
            <div className="flex items-center">
              <item.icon size={16} className={`mr-4 transition-colors ${hasActiveSubItem ? "text-[#84CC16]" : "text-white/20 group-hover:text-[#84CC16]"}`} />
              <span className="font-bold text-sm tracking-wider pt-0.5">
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
                      <div className="absolute inset-0 bg-[#84CC16] rounded-md -z-10 transition-all duration-300" />
                    )}
                    <span className={`font-bold tracking-wider pt-0.5 ${isSubActive ? "text-[12px]" : "text-[11px]"}`}>
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
          <div className="absolute inset-0 bg-[#84CC16] rounded-xl -z-10 transition-all duration-300 scale-105" />
        )}
        {!isActive && (
          <div className="absolute inset-0 bg-white/5 rounded-xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}
        
        <item.icon size={16} className={`mr-4 transition-colors ${isActive ? "text-black" : "text-white/20 group-hover:text-[#84CC16]"}`} />
        <span className="font-bold text-sm tracking-wider pt-0.5">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`${className} bg-surface border-r border-white/5 overflow-y-auto fixed 
          w-64 transition-transform duration-300 ease-in-out z-40
          top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]`}
    >
      <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
        <div className="flex items-center justify-end">
          <button onClick={toggleSidebar} className="text-white hover:text-[#84CC16] transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 py-8 space-y-4">
        <div className="px-4 mb-4">
           <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Main Modules</span>
        </div>
        <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#84CC16]/10 flex items-center justify-center rounded-lg border border-[#84CC16]/20">
              <Activity size={14} className="text-[#84CC16]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                 <div className="w-1 h-1 bg-[#84CC16] rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-[#84CC16]">Systems</span>
              </div>
              <div className="text-[9px] font-bold text-white/40 tracking-widest leading-none">OPERATIONAL</div>
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

export default AdminSidebar;
