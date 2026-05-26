import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { User, Users, Menu, X, LogOut, Activity, ShieldCheck, Zap, ArrowRight, Clock, Trophy, Target, MessageCircle, MapPin, ChevronRight, Bell, UserSearch } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { logout } from "@redux/slices/authSlice";
import { reelsApi } from "@redux/api/reelsApi";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import useNotifications from "@hooks/shared/useNotifications";
import { useScrollDirection } from "@hooks/useScrollDirection.js";

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
  // Auth state log removed
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerUrl = import.meta.env.VITE_PARTNER_URL || "http://localhost:5174";
  const isPartnerPortal = location.pathname.startsWith("/partners");
  const { scrollDirection, scrolled: isScrolled } = useScrollDirection();

  // ── Auto-detect city + state via browser Geolocation + Nominatim reverse-geocode ──
  const [geoLabel, setGeoLabel] = useState(null); // null = not yet tried
  const [geoLoading, setGeoLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          const state = data.address?.state || "";
          setGeoLabel(city && state ? `${city}, ${state}` : city || state || "Unknown");
        } catch {
          setGeoLabel(null);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        // Permission denied or unavailable — fall back to "Set Location"
        setGeoLabel(null);
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  // Attempt auto-detect once on mount
  useEffect(() => { detectLocation(); }, [detectLocation]);

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
    { name: "Venues", path: "/business/venue" },
    { name: "Professionals", path: "/business/professional" },
  ] : [
    { name: "Home", path: "/" },
    { name: "Venues", path: "/venues" },
    { name: "Pros", path: "/professionals" },
    { name: "Join Games", path: "/join-games" },
    { name: "Players", path: "/players" },
    { name: "Business", path: "#" },
  ];

  // Removed dedicated BOOKINGS link

  return (
    <nav className={`sticky top-0 lg:fixed lg:top-0 lg:left-0 z-[90] flex flex-col transition-transform duration-500 
      ${ scrollDirection === "down" && window.innerWidth < 1024 ? "-translate-y-full" : "translate-y-0" }
      lg:transform-none lg:h-screen lg:w-64 lg:border-r lg:border-white/10 bg-black/40 lg:bg-[#050505] backdrop-blur-xl lg:backdrop-blur-none
    `}>
      <div className={`flex justify-center transition-all duration-500 lg:h-full`}>
        <div className={`relative w-full max-w-full h-16 sm:h-20 lg:h-auto border-b border-white/10 lg:border-none flex items-center lg:items-start lg:flex-col justify-between lg:justify-start px-6 sm:px-12 lg:px-6 lg:pt-8 transition-all duration-500`}>
          {/* Logo & Mobile Location Section */}
          <div className="flex flex-col items-start justify-center lg:mb-8">
            <Link to="/" className="group flex items-center justify-center">
              <img src="/logo.png" alt="Kridaz" className="h-8 lg:h-10 w-auto brightness-125 group-hover:scale-105 transition-transform duration-500" />
            </Link>

            <div className="lg:hidden flex items-center gap-1 mt-0.5 ml-1 text-white/50">
              <MapPin size={10} className={geoLoading ? "text-[#84CC16] animate-pulse" : "text-[#84CC16]"} />
              {geoLoading ? (
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 animate-pulse">
                  Locating...
                </span>
              ) : geoLabel ? (
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px] text-white/70">
                  {geoLabel}
                </span>
              ) : (
                <button
                  onClick={detectLocation}
                  className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-[#84CC16] transition-colors"
                >
                  Set Location
                </button>
              )}
            </div>
          </div>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex lg:flex-col lg:items-start gap-2 lg:w-full">
            {navLinks.map((link) => {
              if (link.name === "Business") {
                return (
                  <div key={link.name} className="dropdown dropdown-hover group/link w-full">
                    <label
                      tabIndex={0}
                      className={`flex w-full px-4 py-3 rounded-xl text-base font-bold items-center gap-1 cursor-pointer transition-all ${location.pathname.startsWith("/partners") ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(85,222,232,0.1)]" : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"}`}
                    >
                      {link.name}
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[100] mt-1 p-1 shadow-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] w-48 overflow-hidden backdrop-blur-xl">
                      <li>
                        <Link to="/business/venue" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Venue Owner
                        </Link>
                      </li>
                      <li>
                        <Link to="/business/professional" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Professionals
                        </Link>
                      </li>
                    </ul>
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onMouseEnter={() => {}}
                  className={`block w-full px-4 py-3 rounded-xl text-base font-bold transition-all ${location.pathname === link.path ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(85,222,232,0.1)]" : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 sm:gap-6 lg:fixed lg:top-4 lg:right-6 lg:z-[100]">
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

                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className="relative w-10 sm:w-11 h-10 sm:h-11 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group"
                >
                  <Bell size={20} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
                  <NotificationBadge />
                </Link>



                <div className="flex items-center gap-2">


                  {/* PROFILE SIDEBAR TOGGLE */}
                  <div className="relative">
                    <div onClick={() => setIsSidebarOpen(true)} role="button" className="relative w-10 sm:w-12 h-10 sm:h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group overflow-hidden">
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
                      <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-10">
                        <span className="font-bold text-white uppercase tracking-widest text-sm">Account</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>

                      {/* Navigation Groups */}
                      <div className="p-4 space-y-2">
                        {/* User info / Profile Link */}
                        <Link
                          to="/profile"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-4 p-3 rounded-[8px] bg-white/5 hover:bg-white/10 text-white transition-all mb-4"
                        >
                          <div className="w-10 h-10 rounded-full border border-white/10 bg-white/10 flex items-center justify-center shrink-0">
                            {(() => {
                              if (user?.profilePicture || user?.profileImage) {
                                return <img src={user.profilePicture || user.profileImage} alt="" className="w-full h-full object-cover rounded-full" />;
                              }
                              const gender = user?.gender?.toLowerCase();
                              if (gender === 'male' || gender === 'm') {
                                return <img src={`https://avatar.iran.liara.run/public/boy?username=${user?.name || 'user'}`} alt="" className="w-full h-full object-cover rounded-full" />;
                              }
                              if (gender === 'female' || gender === 'f') {
                                return <img src={`https://avatar.iran.liara.run/public/girl?username=${user?.name || 'user'}`} alt="" className="w-full h-full object-cover rounded-full" />;
                              }
                              if (user?.name) {
                                return (
                                  <span className="text-[#84CC16] font-bold text-sm">
                                    {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                  </span>
                                );
                              }
                              return <User size={20} className="text-[#84CC16]" />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white truncate">{user?.name || "Profile"}</p>
                            <p className="text-xs text-white/40 truncate">{user?.email || "View Account"}</p>
                          </div>
                        </Link>

                        <div className="h-[1px] bg-white/5 my-2" />

                        {/* DASHBOARDS SECTION */}
                        {(["bmsp_admin", "admin", "venu_owners", "venue_owners", "venue", "coach", "umpire", "limited_umpire", "scorer", "limited_scorer", "streamer"].some(r => role?.toLowerCase().includes(r)) ||
                          ["bmsp_admin", "admin", "venu_owners", "venue_owners", "venue", "coach", "umpire", "limited_umpire", "scorer", "limited_scorer", "streamer"].some(r => user?.role?.toLowerCase().includes(r))) && (
                            <>
                              {(role?.toLowerCase() === "admin" || role?.toLowerCase().includes("bmsp_admin") || user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase().includes("bmsp_admin")) && (
                                <Link to="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                  <ShieldCheck size={18} className="text-white/40" />
                                  <span className="text-sm font-medium">Admin Panel</span>
                                </Link>
                              )}
                              {(role?.toLowerCase().includes("venu_owners") || user?.role?.toLowerCase().includes("venu_owners") || role?.toLowerCase().includes("venue") || user?.role?.toLowerCase().includes("venue") || role?.toLowerCase().includes("owner") || user?.role?.toLowerCase().includes("owner")) && (
                                <Link to="/venue-owner" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                  <Activity size={18} className="text-white/40" />
                                  <span className="text-sm font-medium">Venue Owner Dashboard</span>
                                </Link>
                              )}
                              {(["coach", "umpire", "streamer", "commentator", "limited_umpire", "limited_streamer", "scorer"].some(r => role?.toLowerCase().includes(r) || user?.role?.toLowerCase().includes(r))) && (
                                <Link to={`/professional/${role?.toLowerCase() || user?.role?.toLowerCase()}`} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                  <Zap size={18} className="text-white/40" />
                                  <span className="text-sm font-medium">Professional Portal</span>
                                </Link>
                              )}
                              <div className="h-[1px] bg-white/5 my-2" />
                            </>
                          )}

                        {/* ACCOUNT SECTION */}
                        <Link
                          to="/messages"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <MessageCircle size={18} className="text-white/40" />
                          <span className="text-sm font-medium">Messages</span>
                        </Link>

                        <Link
                          to="/my-teams"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Users size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Teams</span>
                        </Link>

                        <Link
                          to="/booking-history"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Clock size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Bookings</span>
                        </Link>

                        <Link
                          to="/my-hosted-games"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Target size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Hosted Games</span>
                        </Link>

                        <Link
                          to="/my-joined-games"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Trophy size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Joined Matches</span>
                        </Link>

                        <Link
                          to="/leaderboard"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-primary/10 text-primary border border-primary/10 transition-all"
                        >
                          <Trophy size={18} className="text-primary/70" />
                          <span className="text-sm font-bold">Global Leaderboard</span>
                        </Link>

                        <Link
                          to="/wallet"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Zap size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Wallet</span>
                        </Link>

                        <div className="h-[1px] bg-white/5 my-2" />

                        <button
                          onClick={() => {
                            setIsSidebarOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-[8px] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
                        >
                          <LogOut size={18} className="opacity-70" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
