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

const AdminSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
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
        { to: "/admin/partner-requests/new", label: "NEW REQUESTS" },
        { to: "/admin/partner-requests/rejected", label: "REJECTED" },
      ],
    },
    { to: "/admin/users", label: "USERS", icon: Users },
    { to: "/admin/owners", label: "OWNERS", icon: Building },
    { to: "/admin/turfs", label: "VENUES", icon: MapPin },
    { to: "/admin/transactions", label: "TRANSACTIONS", icon: DollarSign },
    { to: "/admin/marketing", label: "MARKETING", icon: Activity },
    { to: "/admin/blogs", label: "BLOGS", icon: FileText },
    { to: "/admin/features", label: "FEATURES", icon: ToggleRight },
    { to: "#", label: "LOGOUT", icon: LogOut, action: "logout" },
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
            onClick={() => !isMinimized && toggleOwnerRequests()}
            className={`flex items-center justify-between w-full px-4 py-3 group relative transition-all duration-300 ${
              hasActiveSubItem ? "text-[#84CC16]" : "text-white/40 hover:text-white"
            } ${isMinimized ? "justify-center" : ""}`}
            title={isMinimized ? item.label : ""}
          >
            <div className="flex items-center">
              <item.icon size={16} className={`${isMinimized ? "mr-0" : "mr-4"} transition-all duration-300 ${hasActiveSubItem ? "text-[#84CC16]" : "text-white/20 group-hover:text-[#84CC16]"}`} />
              <span className={`font-bold text-sm tracking-wider pt-0.5 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100"}`}>
                {item.label}
              </span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isMinimized ? "max-w-0 opacity-0" : "max-w-[20px] opacity-100"}`}>
              {ownerRequestsOpen ? (
                <ChevronUp size={14} className="opacity-40" />
              ) : (
                <ChevronDown size={14} className="opacity-40" />
              )}
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${!isMinimized && ownerRequestsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
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
                    <span className={`font-bold tracking-wider pt-0.5 whitespace-nowrap ${isSubActive ? "text-[12px]" : "text-[11px]"}`}>
                      {subItem.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const isActive = location.pathname === item.to && item.to !== "#";
    return (
      <Link
        key={item.label}
        to={item.to}
        className={`flex items-center px-4 py-3 group relative overflow-hidden transition-all duration-300 ${
          item.action === 'logout' ? "text-white/40 hover:text-red-500 mt-8" : isActive ? "text-black" : "text-white/40 hover:text-white"
        } ${isMinimized ? "justify-center px-0" : ""}`}
        title={isMinimized ? item.label : ""}
        onClick={(e) => {
          if (item.action === "logout") {
            e.preventDefault();
            handleLogout();
            return;
          }
          if (window.innerWidth < 1024) {
            toggleSidebar();
          }
        }}
      >
        {isActive && item.action !== 'logout' && (
          <div className={`absolute inset-0 bg-[#84CC16] -z-10 transition-all duration-300 scale-105 ${isMinimized ? "rounded-full m-2" : "rounded-xl"}`} />
        )}
        {!isActive && item.action !== 'logout' && (
          <div className={`absolute inset-0 bg-white/5 -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 ${isMinimized ? "rounded-full m-2" : "rounded-xl"}`} />
        )}
        {item.action === 'logout' && (
          <div className={`absolute inset-0 bg-white/5 -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300 ${isMinimized ? "rounded-full m-2" : "rounded-xl"}`} />
        )}
        
        <item.icon size={16} className={`${isMinimized ? "mr-0" : "mr-4"} transition-all duration-300 ${item.action === 'logout' ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-white/20 group-hover:text-[#84CC16]"}`} />
        <span className={`font-bold text-sm tracking-wider pt-0.5 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100"}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`${className} bg-[#0a0a0a] border-r border-white/5 overflow-y-auto overflow-x-hidden fixed 
          ${isMinimized ? "w-20" : "w-64"} transition-all duration-300 ease-in-out z-40 no-scrollbar
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
        <div className={`px-4 mb-4 flex items-center transition-all duration-300 ${isMinimized ? "justify-center" : "justify-start"}`}>
          <span className={`text-[9px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>
            Main Modules
          </span>
        </div>
        <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
