import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
 X, 
 LayoutGrid, 
 BookOpen, 
 Calendar, 
 MapPin, 
 Clock, 
 Users, 
 IndianRupee, 
 BarChart3, 
 Star, 
 Tag, 
 Bell, 
 Settings, 
 HelpCircle, 
 LogOut,
 Landmark
} from "lucide-react";
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

 const mainNavItems = [
 { to: "/partner", label: "Dashboard", icon: LayoutGrid },
 { to: "/partner/bookings", label: "Bookings", icon: BookOpen },
 { to: "/partner/turfs", label: "Grounds", icon: MapPin },
 { to: "/partner/customers", label: "Customers", icon: Users },
 { to: "/partner/intelligence", label: "Intelligence", icon: BarChart3 },
 { to: "/partner/revenue", label: "Revenue", icon: IndianRupee },
 { to: "/partner/banking", label: "Payout & Banking", icon: Landmark },
 { to: "/partner/reviews", label: "Reviews", icon: Star },
 { to: "/partner/promotions", label: "Promotions", icon: Tag },
 { to: "/partner/support", label: "Docs & Support", icon: HelpCircle },
 { label: "Sign Out", icon: LogOut, action: "logout" },
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
 ? "text-[#999999] hover:text-red-500" 
 : isActive 
 ? "text-black" 
 : "text-[#999999] hover:text-white"
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
 <div className="absolute inset-x-2 inset-y-1 bg-[#CCFF00] rounded-xl -z-10 shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all duration-300" />
 )}
 
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
 ? "text-[#999999]/40 group-hover:text-red-500" 
 : isActive 
 ? "text-black" 
 : "text-[#999999]/40 group-hover:text-[#CCFF00]"
 }`} 
 />
 </div>

 <span className={`font-bold text-[11px] uppercase tracking-[0.2em] ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
 {item.label}
 </span>
 </Link>
 );
 };

 return (
 <aside
 className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-[#000000]/90 backdrop-blur-xl border-r border-[#2D2D2D] overflow-x-hidden transition-all duration-300 ease-in-out z-40 flex flex-col
 ${isMinimized ? "lg:w-20" : "w-64 lg:w-[280px]"}
 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
 ${className || ""}`}
 >
 <div className="flex flex-col p-4 border-b border-[#2D2D2D] bg-[#000000] gap-4 lg:hidden">
 <div className="flex items-center justify-end">
 <button onClick={toggleSidebar} className="text-[#999999] hover:text-[#CCFF00] transition-colors">
 <X size={20} />
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar py-6">
 <nav className="space-y-1">
 {mainNavItems.map(renderNavItem)}
 </nav>
 </div>

 </aside>
 );
};


export default PartnerSidebar;
