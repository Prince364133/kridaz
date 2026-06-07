import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import { useSelector, useDispatch } from "react-redux";
import { User, Users, X, LogOut, Activity, ShieldCheck, Zap, ArrowRight, Clock, Trophy, Target, MessageCircle, MapPin, Bell, UserSearch, Search, Plus, Bookmark, FileText, Home, Briefcase, ChevronDown, Award, Mail, HelpCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { logout } from "@redux/slices/authSlice";
import { setUserLocation, setLocationStatus, openLocationSidebar } from "@redux/slices/uiSlice";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import useNotifications from "@hooks/shared/useNotifications";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import Dock from "./Dock";

/**
 * NotificationBadge — Shows unread notification count as a red dot/badge.
 * Extracted as a sub-component to isolate the useNotifications hook call.
 */
const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  if (unreadCount <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-[8px] flex items-center justify-center text-[9px] font-black text-white border-2 border-[#050505]">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
};

const Navbar = () => {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);
  // Auth state log removed
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerUrl = import.meta.env.VITE_PARTNER_URL || "http://localhost:5174";
  const isPartnerPortal = location.pathname.startsWith("/partners");
  const { scrollDirection, scrolled: isScrolled } = useScrollDirection();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const geoLoading = locationStatus === "detecting";
  const geoLabel = userLocation 
    ? (userLocation.city && userLocation.state 
        ? `${userLocation.city}, ${userLocation.state}` 
        : userLocation.city || userLocation.state || "Unknown")
    : null;

  const detectLocation = useCallback(() => {
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }
        dispatch(setUserLocation({ lat, lng, city, state }));
        dispatch(setLocationStatus("granted"));
      },
      () => {
        dispatch(setLocationStatus("denied"));
      },
      { timeout: 8000 }
    );
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, clear local state
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const navLinks = isPartnerPortal ? [
    { name: "Venues", path: "/business/venue", icon: MapPin },
    { name: "Professionals", path: "/business/professional", icon: Briefcase },
  ] : [
    { name: "Home", path: "/", icon: Home },
    { name: "My Teams", path: "/my-teams", icon: Users },
    { name: "Pros", path: "/professionals", icon: Award },
    { name: "Join Games", path: "/join-games", icon: Trophy },
    { name: "Players", path: "/players", icon: Users },
    { name: "Business", path: "#", icon: Briefcase },
  ];

  const dockItems = isPartnerPortal ? [
    { 
      icon: <MapPin size={22} className={location.pathname === "/business/venue" ? "text-[#BFF367]" : ""} />, 
      label: "Venues", 
      onClick: () => navigate("/business/venue"),
      className: location.pathname === "/business/venue" ? "active-dock-item" : ""
    },
    { 
      icon: <Briefcase size={22} className={location.pathname === "/business/professional" ? "text-[#BFF367]" : ""} />, 
      label: "Pros", 
      onClick: () => navigate("/business/professional"),
      className: location.pathname === "/business/professional" ? "active-dock-item" : ""
    },
  ] : [
    { 
      icon: <Home size={22} className={location.pathname === "/" ? "text-[#BFF367]" : ""} />, 
      label: "Home", 
      onClick: () => navigate("/"),
      className: location.pathname === "/" ? "active-dock-item" : ""
    },
    { 
      icon: <MapPin size={22} className={location.pathname === "/venues" ? "text-[#BFF367]" : ""} />, 
      label: "Venues", 
      onClick: () => navigate("/venues"),
      className: location.pathname === "/venues" ? "active-dock-item" : ""
    },
    { 
      icon: <Award size={22} className={location.pathname === "/professionals" ? "text-[#BFF367]" : ""} />, 
      label: "Pros", 
      onClick: () => navigate("/professionals"),
      className: location.pathname === "/professionals" ? "active-dock-item" : ""
    },
    { 
      icon: <Target size={22} className={location.pathname === "/join-games" ? "text-[#BFF367]" : ""} />, 
      label: "Join Games", 
      onClick: () => navigate("/join-games"),
      className: location.pathname === "/join-games" ? "active-dock-item" : ""
    },
    { 
      icon: <Users size={22} className={location.pathname === "/players" ? "text-[#BFF367]" : ""} />, 
      label: "Players", 
      onClick: () => navigate("/players"),
      className: location.pathname === "/players" ? "active-dock-item" : ""
    },
    { 
      icon: <Briefcase size={22} className={location.pathname.startsWith("/business") ? "text-[#BFF367]" : ""} />, 
      label: "Business", 
      onClick: () => {},
      subItems: [
        { label: "Register as Pro", onClick: () => navigate("/business/professional") },
        { label: "Host Venue", onClick: () => navigate("/business/venue") }
      ],
      className: location.pathname.startsWith("/business") ? "active-dock-item" : ""
    },
  ];

  const searchParams = new URLSearchParams(location.search);
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isSingleVenue = location.pathname.startsWith("/venue/");
  const isVenue = (location.pathname.startsWith("/venue") || location.pathname === "/venues") && !isSingleVenue;
  const isPlayer = location.pathname.startsWith("/players");
  const isProfessional = location.pathname.startsWith("/professionals");
  const isJoinGames = location.pathname.startsWith("/join-games");
  const isUploadReel = location.pathname.startsWith("/reels/upload") || location.pathname.startsWith("/shorts/upload");
  const isTeamsPage = location.pathname.startsWith("/my-teams");
  const isMessagesPage = location.pathname.startsWith("/messages");
  const useRestrictedWidth = isHome || isVenue || isUploadReel || isTeamsPage || isPlayer || isProfessional || isJoinGames;

  return (
    <>      {/* Mobile Top Header (100% original layout and classes) */}
      <nav className={`sticky top-0 w-full z-[90] flex flex-col transition-all duration-300 group/nav overflow-hidden bg-black/40 backdrop-blur-xl lg:hidden
          ${ scrollDirection === "down" && window.innerWidth < 1024 ? "-translate-y-full" : "translate-y-0" }
        `}>
          <div className="flex justify-center">
            <div className="relative w-full max-w-full h-16 sm:h-20 border-b border-white/10 flex items-center justify-between px-2 sm:px-4">
            {/* Logo & Mobile Location Section */}
            <div className="flex flex-col items-start justify-center w-full overflow-hidden">
              {isLoggedIn ? (
                <div className="flex flex-col items-start justify-center py-1 w-full">
                  {/* Mobile Location Header */}
                  <div 
                    className="flex flex-col items-start cursor-pointer group mt-1"
                    onClick={() => dispatch(openLocationSidebar())}
                  >
                    <svg width="0" height="0" className="absolute">
                      <linearGradient id="mapPinGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60E5D0" />
                        <stop offset="100%" stopColor="#A2F86D" />
                      </linearGradient>
                    </svg>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mb-0.5">
                      YOUR LOCATION
                    </span>
                    <div className="flex items-center gap-1.5 mt-[2px]">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                          <g fill="none">
                            <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q-.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                            <path fill="url(#mapPinGradientMobile)" d="M12 2a9 9 0 0 1 9 9c0 3.074-1.676 5.59-3.442 7.395a20.4 20.4 0 0 1-2.876 2.416l-.426.29l-.2.133l-.377.24l-.336.205l-.416.242a1.87 1.87 0 0 1-1.854 0l-.416-.242l-.52-.32l-.192-.125l-.41-.273a20.6 20.6 0 0 1-3.093-2.566C4.676 16.589 3 14.074 3 11a9 9 0 0 1 9-9m0 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6" />
                          </g>
                        </svg>
                      </div>
                      
                      {geoLoading ? (
                        <span className="text-[18px] sm:text-[20px] font-medium text-white tracking-tight leading-none animate-pulse">
                          Locating...
                        </span>
                      ) : geoLabel ? (
                        <span className="text-[18px] sm:text-[20px] font-medium text-white tracking-tight leading-none truncate max-w-[150px] sm:max-w-[200px]">
                          {userLocation?.city || geoLabel.split(',')[0]}
                        </span>
                      ) : (
                        <span
                          className="text-[18px] sm:text-[20px] font-medium text-white tracking-tight leading-none hover:text-white/80 transition-colors"
                        >
                          Set Location
                        </span>
                      )}
                      
                      <ChevronDown size={14} className="text-white mt-0.5 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/" className="group flex items-center justify-start w-full overflow-hidden transition-all duration-300">
                  <img src="/logo.png" alt="Kridaz" className="h-10 sm:h-12 lg:h-10 w-auto max-w-none brightness-125 group-hover:scale-105 transition-transform duration-500" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Top Header */}
      <nav className="hidden lg:flex sticky top-0 w-full z-[90] flex-col transition-all duration-300 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex justify-center h-16 sm:h-20 w-full">
          <div className="relative w-full max-w-[1400px] h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <Link to="/" className="group flex items-center justify-start overflow-hidden">
                <img src="/logo.png" alt="Kridaz" className="h-8 sm:h-10 w-auto max-w-none brightness-125 group-hover:scale-105 transition-transform duration-500" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Left Dock for Desktop */}
      <div className={`hidden lg:block fixed top-1/2 -translate-y-1/2 z-[100] transition-all duration-300 ${
        useRestrictedWidth 
          ? "left-6 lg:left-[max(16px,calc(50vw-454px))] xl:left-[max(24px,calc(50vw-430px))]" 
          : "left-6"
      }`}>
        <Dock items={dockItems} direction="vertical" panelHeight={64} baseItemSize={50} magnification={75} />
      </div>

      {/* ACTIONS (Moved outside nav to prevent dropdown clipping) */}
      <div className={`flex items-center gap-2 sm:gap-4 fixed right-4 sm:right-6 z-[100] transition-all duration-300 ${ scrollDirection === "down" && window.innerWidth < 1024 ? "-translate-y-full top-[-100px]" : "translate-y-0 top-4" }`}>
        {!isLoggedIn ? (
          <>
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-all hover:translate-x-1"
            >
              <ShieldCheck size={16} className="opacity-50" />
              Login
            </Link>

            <Link to="/signup" className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-9 sm:h-11 px-4 sm:px-8 text-xs sm:text-sm font-bold flex items-center gap-2 sm:gap-3 rounded-[8px] transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]">
              Join Now <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Search Icon */}
            {!isMessagesPage && (
              <Link
                to="/search"
                className="hidden sm:flex relative w-9 sm:w-11 h-9 sm:h-11 border border-white/10 items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group"
              >
                <Search size={18} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
              </Link>
            )}

            {/* Message Button */}
            {!isMessagesPage && (
              <Link
                to="/messages"
                className="relative w-9 sm:w-11 h-9 sm:h-11 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group"
              >
                <MessageCircle size={18} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
              </Link>
            )}

            {/* Plus Dropdown */}
            {!isMessagesPage && (
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className="relative w-9 sm:w-11 h-9 sm:h-11 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group"
                >
                  <Plus size={18} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
                </label>
              <ul tabIndex={0} className="dropdown-content z-[100] mt-1 p-1 shadow-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] w-48 overflow-hidden backdrop-blur-xl">
                <li>
                  <Link 
                    to="/my-teams" 
                    state={{ openStartScoringModal: true }}
                    className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all"
                  >
                    Score Match
                  </Link>
                </li>
                <li>
                  <Link to="/?createPost=true" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                    Share Post
                  </Link>
                </li>
                <li>
                  <Link to="/reels/upload" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                    Share Reel
                  </Link>
                </li>
                <li>
                  <Link to="/create-story" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                    Share Story
                  </Link>
                </li>
              </ul>
            </div>
            )}

            <div className="flex items-center gap-2">

              {/* PROFILE SIDEBAR TOGGLE */}
              <div className="relative">
                <div onClick={() => setIsSidebarOpen(true)} role="button" className="relative w-9 sm:w-12 h-9 sm:h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group overflow-hidden">
                  {(() => {
                    if (user?.profilePicture || user?.profileImage) {
                      return (
                        <img
                          src={user.profilePicture || user.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      );
                    }
                    
                    const gender = user?.gender?.toLowerCase();
                    if (gender === 'male' || gender === 'm') {
                      return <img src={`https://avatar.iran.liara.run/public/boy?username=${user?.name || 'user'}`} alt="Profile" className="w-full h-full object-cover relative z-10" />;
                    }
                    if (gender === 'female' || gender === 'f') {
                      return <img src={`https://avatar.iran.liara.run/public/girl?username=${user?.name || 'user'}`} alt="Profile" className="w-full h-full object-cover relative z-10" />;
                    }

                    if (user?.name) {
                      return (
                        <div className="fallback-avatar w-full h-full flex items-center justify-center relative z-10 bg-white/5">
                          <span className="text-[#84CC16] font-bold text-sm">
                            {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                      );
                    }

                    return <User size={22} className="text-white/40 group-hover:text-[#84CC16] transition-colors absolute inset-0 m-auto fallback-avatar" />;
                  })()}
                  <div className="absolute inset-0 bg-[#84CC16]/10 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                </div>

                {/* OVERLAY */}
                {isSidebarOpen && createPortal(
                  <div className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />,
                  document.body
                )}

                {/* SIDEBAR PANEL */}
                {createPortal(
                  <div className={`fixed top-0 right-0 h-[100dvh] w-72 sm:w-80 bg-[#0A0A0A] border-l border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-y-auto z-[1000] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0A0A0A] z-50">
                    <span className="font-bold text-white uppercase tracking-widest text-sm">Account</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Navigation Groups */}
                  <div className="p-4 flex flex-col gap-6">
                    {/* Profile Card */}
                    <Link
                      to={getDynamicProfileRoute(user, role)}
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-[12px] bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-md mb-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#111] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {(() => {
                          if (user?.profilePicture || user?.profileImage) {
                            return <img src={user.profilePicture || user.profileImage} alt="" className="w-full h-full object-cover" />;
                          }
                          const gender = user?.gender?.toLowerCase();
                          if (gender === 'male' || gender === 'm') {
                            return <img src={`https://avatar.iran.liara.run/public/boy?username=${user?.name || 'user'}`} alt="" className="w-full h-full object-cover" />;
                          }
                          if (gender === 'female' || gender === 'f') {
                            return <img src={`https://avatar.iran.liara.run/public/girl?username=${user?.name || 'user'}`} alt="" className="w-full h-full object-cover" />;
                          }
                          if (user?.name) {
                            return (
                              <span className="text-[#BFF367] font-bold text-sm">
                                {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            );
                          }
                          return <User size={20} className="text-[#BFF367]" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black tracking-tight text-white truncate">{user?.name || "Profile"}</p>
                        <p className="text-[12px] font-medium text-white/40 truncate">{user?.email || "View Account"}</p>
                      </div>
                    </Link>

                    {/* COMMUNICATION */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">Communication</span>
                      <div className="flex flex-col gap-1">
                        <Link to="/messages" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <MessageCircle size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Messages</span>
                        </Link>
                        <Link to="/notifications" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <div className="relative">
                            <Bell size={18} className="text-white/40" />
                            <NotificationBadge />
                          </div>
                          <span className="text-sm font-semibold">Notifications</span>
                        </Link>
                      </div>
                    </div>

                    {/* PLAY */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">Play</span>
                      <div className="flex flex-col gap-1">
                        <Link to="/booking-history" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Clock size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">My Bookings</span>
                        </Link>
                        <Link to="/my-teams" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Users size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">My Teams</span>
                        </Link>
                        <Link to="/my-joined-games" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Trophy size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">My Joined Matches</span>
                        </Link>
                        <Link to="/my-hosted-games" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Target size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">My Hosted Games</span>
                        </Link>
                        <Link to="/wallet" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Zap size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">My Wallet</span>
                        </Link>
                      </div>
                    </div>

                    {/* PROFESSIONAL HUB */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">Professional Hub</span>
                      <div className="flex flex-col gap-1">
                        {/* Venue Option */}
                        {(["bmsp_admin", "admin", "venu_owners", "venue_owners", "venue", "owner"].some(r => role?.toLowerCase().includes(r) || user?.role?.toLowerCase().includes(r))) ? (
                          <Link to="/venue-owner" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                            <Activity size={18} className="text-[#BFF367]" />
                            <span className="text-sm font-semibold">Venue Dashboard</span>
                          </Link>
                        ) : (
                          <Link to="/business/venue" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                            <Briefcase size={18} className="text-[#BFF367]" />
                            <span className="text-sm font-semibold">Host Venue</span>
                          </Link>
                        )}

                        {/* Professional Option */}
                        {(["coach", "umpire", "streamer", "commentator", "scorer", "cheerleader"].some(r => role?.toLowerCase().includes(r) || user?.role?.toLowerCase().includes(r))) ? (
                          <Link to={`/professional/${role?.toLowerCase() || user?.role?.toLowerCase()}`} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                            <Zap size={18} className="text-[#BFF367]" />
                            <span className="text-sm font-semibold">Professional Portal</span>
                          </Link>
                        ) : (
                          <Link to="/business/professional" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                            <Zap size={18} className="text-[#BFF367]" />
                            <span className="text-sm font-semibold">Register as Pro</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* COMMUNITY */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">Community</span>
                      <div className="flex flex-col gap-1">
                        <Link to="/leaderboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Trophy size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Global Leaderboard</span>
                        </Link>
                        <Link to="/saved" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Bookmark size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Saved Items</span>
                        </Link>
                        <Link to="/blogs" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <FileText size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Blogs</span>
                        </Link>
                      </div>
                    </div>

                    {/* SUPPORT & LEGAL */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">Support & Legal</span>
                      <div className="flex flex-col gap-1">
                        <Link to="/contact-us" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <Mail size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Contact Us</span>
                        </Link>
                        <Link to="/faq" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <HelpCircle size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">FAQ</span>
                        </Link>
                        <Link to="/terms-of-service" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <FileText size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Terms & Conditions</span>
                        </Link>
                        <Link to="/privacy-policy" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                          <ShieldCheck size={18} className="text-white/40" />
                          <span className="text-sm font-semibold">Privacy Policy</span>
                        </Link>
                      </div>
                    </div>

                    {/* BOTTOM FIXED (LOGOUT) */}
                    <div className="pt-4 border-t border-white/5 mt-auto">
                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-[8px] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 transition-all"
                      >
                        <LogOut size={16} className="opacity-70" />
                        <span className="text-sm font-bold tracking-wide">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Navbar;
