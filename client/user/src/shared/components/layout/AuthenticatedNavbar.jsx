import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  Bell, 
  LogOut, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus,
  Command,
  User,
  ChevronDown,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  History,
  ShieldAlert,
  ExternalLink,
  ArrowLeft,
  HelpCircle,
  Zap
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "@redux/slices/authSlice.js";
import axiosInstance from "@hooks/useAxiosInstance";
import ManualBookingModal from "@features/venue-owner/ManualBookingModal";
import useNotifications from "@hooks/shared/useNotifications";
import { useGetDashboardStatsQuery, useToggleOnlineMutation } from "@redux/api/professionalApi";
import { formatDistanceToNow } from 'date-fns';
import toast from "react-hot-toast";
import { getDynamicProfileRoute } from "@utils/routeUtils";

/**
 * AuthenticatedNavbar Rs � Role-aware top navigation.
 * Fully rebranded for Scorer users with Teal Green (#BFF367) and Inter typography.
 */

const AuthenticatedNavbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();
  const isProfessionalDashboard = location.pathname.startsWith('/professional');
  
  const user = useSelector((state) => state?.auth?.user);
  const role = useSelector((state) => state?.auth?.role);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";

  const { data: statsData } = useGetDashboardStatsQuery(undefined, { skip: !isProfessionalDashboard });
  const [toggleOnline, { isLoading: isToggling }] = useToggleOnlineMutation();
  const isOnline = user?.isOnline || false;

  const { notifications, loading, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  const getBasePath = () => {
    const r = role?.toLowerCase();
    if (r === "admin" || r === "bmsp_admin") return "/admin";
    if (r === "venu_owners" || r?.includes("venu_owners") || r === "owner" || r === "bmsp_owner" || r === "verified_venue_owner" || r === "venue_owner") return "/venue-owner";
    if (r === "coach" || r === "bmsp_coach") return "/professional/coach";
    if (r?.includes("umpire")) return "/umpire";
    if (r?.includes("scorer")) return "/scorer";
    return "";
  };

  const handleProfileClick = () => {
    navigate(getDynamicProfileRoute(user, role));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const handleCheckVenue = async () => {
    try {
      const response = await axiosInstance.get("/api/owner/turf/owner/all");
      const turfs = response.data;
      if (turfs && turfs.length > 0) {
        navigate(`/venue/${turfs[0]._id}`);
      } else {
        toast.error("You don't have any venues yet!");
      }
    } catch (err) {
      toast.error("Failed to load your venue");
    }
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    // Optimistic update — flip UI instantly before API responds
    dispatch(updateUser({ isOnline: newStatus }));
    try {
      await toggleOnline({ isOnline: newStatus }).unwrap();
      toast.success(newStatus ? "You are now online and visible to users" : "You are now offline");
    } catch (error) {
      // Rollback on failure
      dispatch(updateUser({ isOnline: !newStatus }));
      toast.error(error?.data?.message || "Failed to update online status");
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const trustScore = statsData?.stats?.trustScore || 100;
  const trustMax = 100;
  const trustPercent = Math.min(100, Math.max(0, (trustScore / trustMax) * 100));
  const trustLevel = trustScore >= 90 ? "Elite" : trustScore >= 70 ? "Pro" : trustScore >= 50 ? "Rising" : "Rookie";
  // SVG ring math (radius=18, circumference=~113)
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - trustPercent / 100);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BOOKING': return <History size={14} style={{ color: themeColor }} />;
      case 'PAYMENT': return <CreditCard size={14} className="text-green-500" />;
      case 'SUPPORT': return <MessageSquare size={14} className="text-blue-500" />;
      case 'WITHDRAWAL': return <AlertTriangle size={14} className="text-orange-500" />;
      case 'REVIEW': return <ShieldAlert size={14} className="text-yellow-500" />;
      default: return <Bell size={14} style={{ color: themeColor }} />;
    }
  };

  const handleNotificationClick = (notif) => {
    markRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
    }
    setShowNotifications(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col font-inter">
      <nav className="navbar bg-[#000000] border-b border-[#2D2D2D] px-4 md:px-8 h-16 lg:h-20 shadow-2xl flex items-center justify-between">
        

        
        <div className="flex items-center gap-4 lg:min-w-[200px]">
          {!isProfessionalDashboard ? (
            <button className="p-2 text-white hover:opacity-80 transition-opacity lg:hidden" style={{ color: themeColor }} onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
          ) : (
            <Link to="/" className="p-2 text-white hover:opacity-80 transition-opacity" style={{ color: themeColor }}>
              <ArrowLeft size={24} />
            </Link>
          )}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-20 h-10 sm:w-32 sm:h-12 bg-transparent flex items-center justify-center overflow-hidden">
               <img src="/logo.png" alt="Kridaz Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
        </div>


        
        <div className="flex items-center gap-3 sm:gap-5 lg:min-w-[200px] justify-end">
          

          
          {["venu_owners", "owner", "venue_owner", "verified_venue_owner", "bmsp_owner"].some(r => role?.toLowerCase()?.includes(r)) && (
            <>
              <button 
                onClick={handleCheckVenue}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 border border-[#BFF367] text-[#BFF367] hover:bg-[#BFF367]/10"
              >
                <ExternalLink size={14} strokeWidth={3} />
                <span>Check Venue</span>
              </button>
              <button 
                onClick={() => setIsManualBookingOpen(true)}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                style={{ background: 'linear-gradient(90deg, #BFF367 0%, #BFF367 100%)', color: '#000', boxShadow: `0 5px 15px ${themeColor}33` }}
              >
                <Plus size={14} strokeWidth={3} />
                <span>Manual Booking</span>
              </button>
              <ManualBookingModal 
                isOpen={isManualBookingOpen} 
                onClose={() => setIsManualBookingOpen(false)} 
              />
            </>
          )}


          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-[8px] transition-all duration-300 relative border ${ showNotifications ? "" : "bg-[#0d0d0d] text-[#999999] border-white/5 hover:border-white/10" }`}
              style={{ 
                backgroundColor: showNotifications ? themeColor : undefined, 
                color: showNotifications ? '#000' : undefined,
                borderColor: showNotifications ? themeColor : undefined 
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-[#000000] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                   <div className="flex items-center gap-2">
                      <h3 className="font-black text-white tracking-widest text-[10px] uppercase">Notification Vault</h3>
                      {unreadCount > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: themeColor, color: '#000' }}>{unreadCount}</span>}
                   </div>
                  <div className="flex gap-4">
                     <button onClick={markAllRead} className="text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-all" style={{ color: themeColor }}>
                        Mark All
                     </button>
                     <button onClick={clearAll} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">
                        Clear
                     </button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 border-b border-white/5 transition-colors cursor-pointer group ${notif.isRead ? 'opacity-60' : 'bg-white/[0.02]'}`}
                      >
                        <div className="flex gap-4">
                           <div className="mt-0.5 p-2 rounded-[8px] border border-white/5 flex items-center justify-center shrink-0" style={{ backgroundColor: notif.isRead ? 'rgba(255,255,255,0.05)' : themeColor + '1A', color: notif.isRead ? '#555' : themeColor }}>
                             {getNotificationIcon(notif.type)}
                           </div>
                           <div className="flex-1 space-y-1">
                             <div className="flex justify-between items-start">
                               <h4 className={`text-[12px] font-black transition-colors uppercase tracking-tight ${notif.isRead ? 'text-gray-500' : 'text-white'}`} style={{ '--hover-color': themeColor }}>
                                 {notif.title}
                               </h4>
                               <span className="text-[9px] text-neutral-600 font-bold flex items-center gap-1 uppercase">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }).replace('about ', '')}
                               </span>
                             </div>
                             <p className={`text-[11px] leading-relaxed font-medium ${notif.isRead ? 'text-gray-600' : 'text-neutral-400'}`}>{notif.message}</p>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center text-neutral-800"><Bell size={40} /></div>
                      <p className="text-[10px] text-neutral-600 font-black tracking-widest uppercase">Vault is empty</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-white/5 mx-1 hidden sm:block" />

          {isProfessionalDashboard && (
            <div className="relative">
              <Link 
                to={`/professional/${role}/support`}
                className="flex items-center justify-center p-2.5 bg-[#0d0d0d] border border-white/5 hover:border-[#BFF367]/30 rounded-[8px] hover:bg-[#BFF367]/10 hover:text-[#BFF367] text-[#999999] transition-all duration-300"
                title="Support"
              >
                <HelpCircle size={20} strokeWidth={2.5} />
              </Link>
            </div>
          )}

          {!isProfessionalDashboard && (
            <div className="relative">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center p-2.5 bg-[#0d0d0d] border border-white/5 hover:border-red-500/30 rounded-[8px] hover:bg-red-500/10 hover:text-red-500 text-[#999999] transition-all duration-300"
                title="Logout"
              >
                <LogOut size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Professional Sub-Bar — visible on ALL screen sizes */}
      {isProfessionalDashboard && user && (
        <div className="bg-[#0A0A0A] border-b border-[#1a1a1a] px-3 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Avatar + Greeting */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Avatar with online indicator ring and dropdown */}
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="relative block focus:outline-none transition-transform active:scale-95"
                >
                  <img 
                    src={user.profilePicture || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=111111&color=BFF367&bold=true&size=80`} 
                    alt={user.name} 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-offset-1 ring-offset-[#0A0A0A]" 
                    style={{ ringColor: isOnline ? '#BFF367' : '#555' }}
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${isOnline ? 'bg-[#BFF367]' : 'bg-gray-500'}`} />
                </button>

                {/* Dropdown containing Logout button */}
                {showProfileMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-[#141414] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-[#2D2D2D] bg-[#0d0d0d]">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{user.name}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                    >
                      <LogOut size={14} strokeWidth={2.5} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
              {/* Greeting */}
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">{getTimeGreeting()}</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</span>
              </div>
            </div>

            {/* Center: Trust Score Ring (industry-standard circular progress) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                {/* SVG Ring */}
                <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                  {/* Background track */}
                  <circle cx="22" cy="22" r={ringRadius} fill="transparent" stroke="#1a1a1a" strokeWidth="3" />
                  {/* Progress arc */}
                  <circle 
                    cx="22" cy="22" r={ringRadius} fill="transparent" 
                    stroke="#BFF367" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={ringCircumference} 
                    strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease', filter: 'drop-shadow(0 0 4px rgba(191,243,103,0.4))' }}
                  />
                </svg>
                {/* Center score */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-[#BFF367] leading-none">{trustScore}</span>
                </div>
              </div>
              {/* Label */}
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Trust</span>
                <span className="text-[10px] sm:text-xs font-black text-[#BFF367] uppercase">{trustScore} XP</span>
              </div>
            </div>

            {/* Right: Online Toggle (OverviewTab style) */}
            <div className="flex items-center gap-2 bg-[#222222] px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-[#2D2D2D]">
              <span className={`text-[10px] sm:text-xs font-semibold tracking-wide ${isOnline ? 'text-[#BFF367]' : 'text-gray-400'}`}>
                <span className="sm:hidden">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                <span className="hidden sm:inline">{isOnline ? 'ONLINE & AVAILABLE' : 'OFFLINE / BUSY'}</span>
              </span>
              <button 
                onClick={handleToggleOnline} 
                disabled={isToggling}
                className={`w-11 h-6 sm:w-12 sm:h-7 rounded-full p-1 transition-all duration-300 ${isOnline ? 'bg-[#BFF367]' : 'bg-gray-600'}`}
              >
                <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-black shadow-md transform transition-all duration-300 ${isOnline ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticatedNavbar;

