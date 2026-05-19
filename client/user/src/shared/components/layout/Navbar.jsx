import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { User, Users, Menu, X, LogOut, Activity, ShieldCheck, Zap, ArrowRight, Clock, Trophy, Target, MessageCircle, MapPin, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { logout } from "@redux/slices/authSlice";
import { reelsApi } from "@redux/api/reelsApi";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";

const Navbar = () => {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  console.log("Navbar Auth State:", { isLoggedIn, role, userRole: user?.role });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerUrl = import.meta.env.VITE_PARTNER_URL || "http://localhost:5174";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isPartnerPortal = location.pathname.startsWith("/partners");

  const navLinks = isPartnerPortal ? [
    { name: "Venues", path: "/business/venue" },
    { name: "Coaches", path: "/business/coach" },
    { name: "Officials", path: "/business/official" },
    { name: "Scorers", path: "/business/scorer" },
    { name: "Streamers", path: "/business/streamer" },
  ] : [
    { name: "Home", path: "/" },
    { name: "Venues", path: "/turfs" },
    { name: "Reels", path: "/reels" },
    { name: "Pros", path: "/professionals" },
    { name: "Join Games", path: "/join-games" },
    { name: "Community", path: "/community" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Players", path: "/players" },
    { name: "Business", path: "#" },
  ];

  // Removed dedicated BOOKINGS link

  return (
    <nav className="sticky top-0 z-[100] flex flex-col">

      <div className={`flex justify-center transition-all duration-500 ${isScrolled ? "pt-0" : "pt-0"}`}>
        <div 
          className={`relative w-full max-w-full h-16 sm:h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-12 transition-all duration-500 ${isScrolled ? "bg-black/90 backdrop-blur-2xl" : "bg-black/40 backdrop-blur-xl"}`}
          style={{ 
            boxShadow: isScrolled ? "0 20px 40px rgba(0, 0, 0, 0.4)" : "none"
          }}
        >
          {/* Logo & Mobile Location Section */}
          <div className="flex flex-col items-start justify-center">
            <Link to="/" className="group flex items-center justify-center">
              <img src="/logo.png" alt="Kridaz" className="h-8 lg:h-10 w-auto brightness-125 group-hover:scale-105 transition-transform duration-500" />
            </Link>

            <div className="lg:hidden flex items-center gap-1 mt-0.5 ml-1 text-white/50">
              <MapPin size={10} className="text-[#84CC16]" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate max-w-[100px]">
                Set Location
              </span>
            </div>
          </div>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              if (link.name === "Business") {
                return (
                  <div key={link.name} className="dropdown dropdown-hover group/link">
                    <label 
                      tabIndex={0} 
                      className={`text-sm font-semibold transition-all hover:text-primary relative flex items-center gap-1 cursor-pointer ${
                        location.pathname.startsWith("/partners") ? "text-primary" : "text-white/60"
                      }`}
                    >
                      {link.name}
                      <span className={`absolute -bottom-2 left-0 h-[2px] bg-primary transition-all duration-300 ${location.pathname.startsWith("/partners") ? "w-full" : "w-0 group-hover/link:w-full"}`} />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[100] mt-4 p-1 shadow-2xl bg-[#0A0A0A] border border-white/10 rounded-xl w-48 overflow-hidden backdrop-blur-xl">
                      <li>
                        <Link to="/business/venue" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Venue Owner
                        </Link>
                      </li>
                      <li>
                        <Link to="/business/coach" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Coaches
                        </Link>
                      </li>
                      <li>
                        <Link to="/business/official" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Umpire
                        </Link>
                      </li>
                      <li>
                        <Link to="/business/scorer" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          Scorer
                        </Link>
                      </li>
                      <li>
                        <Link to="/business/streamer" className="flex items-center gap-3 p-4 text-sm font-medium text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all">
                          YouTube Streamer
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
                  onMouseEnter={() => {
                    if (link.name === "Reels") {
                      dispatch(reelsApi.util.prefetch("getReelsFeed", undefined, { force: true }));
                    }
                  }}
                  className={`text-sm font-semibold transition-all hover:text-primary relative group/link ${
                    location.pathname === link.path ? "text-primary" : "text-white/60"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-2 left-0 h-[2px] bg-primary transition-all duration-300 ${location.pathname === link.path ? "w-full" : "w-0 group-hover/link:w-full"}`} />
                </Link>
              );
            })}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 sm:gap-6">
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-all hover:translate-x-1"
                >
                  <ShieldCheck size={16} className="opacity-50" />
                  Login
                </Link>
                
                <Link to="/signup" className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-9 sm:h-11 px-4 sm:px-8 text-xs sm:text-sm font-bold flex items-center gap-2 sm:gap-3 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                  Join Now <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">

                <div className="flex items-center gap-2">
                  {/* Greeting text - shown only on mobile */}
                  {user?.name && (
                    <span className="lg:hidden text-xs text-white/50 font-medium whitespace-nowrap">
                      Hey, <span className="text-white font-semibold">{user.name.split(' ')[0]}</span>
                    </span>
                  )}

                  {/* PROFILE DROPDOWN */}
                  <div className="dropdown dropdown-end group/profile">
                    <div tabIndex={0} role="button" className="relative w-10 sm:w-12 h-10 sm:h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group overflow-hidden">
                      <User size={22} className="text-white/40 group-hover:text-[#84CC16] transition-colors absolute inset-0 m-auto" />
                      {(user?.profilePicture || user?.profileImage) ? (
                        <img 
                          src={user.profilePicture || user.profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover relative z-10" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center relative z-10"
                        style={{ display: (user?.profilePicture || user?.profileImage) ? 'none' : 'flex' }}
                      >
                        <span className="text-[#84CC16] font-bold text-sm">
                          {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : <User size={22} />}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-[#84CC16]/10 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                    </div>
                    
                    <div tabIndex={0} className="dropdown-content mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
                      {/* Navigation Groups */}
                      <div className="p-2 space-y-1">
                        {/* User info / Profile Link */}
                        <Link 
                          to="/profile" 
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-white transition-all mb-2"
                        >
                          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/10 flex items-center justify-center shrink-0">
                            {(user?.profilePicture || user?.profileImage) ? (
                              <img src={user.profilePicture || user.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <User size={16} className="text-[#84CC16]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.name || "Profile"}</p>
                            <p className="text-[10px] text-white/40 truncate">{user?.email || "View Account"}</p>
                          </div>
                        </Link>

                        <div className="h-[1px] bg-white/5 my-1" />

                        {/* DASHBOARDS SECTION */}
                        {(["bmsp_admin", "admin", "venu_owners", "venue_owners", "venue", "coach", "umpire", "limited_umpire", "scorer", "limited_scorer", "streamer"].some(r => role?.toLowerCase().includes(r)) || 
                          ["bmsp_admin", "admin", "venu_owners", "venue_owners", "venue", "coach", "umpire", "limited_umpire", "scorer", "limited_scorer", "streamer"].some(r => user?.role?.toLowerCase().includes(r))) && (
                          <>
                            {(role?.toLowerCase() === "admin" || role?.toLowerCase().includes("bmsp_admin") || user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase().includes("bmsp_admin")) && (
                              <Link to="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <ShieldCheck size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Admin Panel</span>
                              </Link>
                            )}
                            {(role?.toLowerCase().includes("venu_owners") || user?.role?.toLowerCase().includes("venu_owners") || role?.toLowerCase().includes("venue") || user?.role?.toLowerCase().includes("venue") || role?.toLowerCase().includes("owner") || user?.role?.toLowerCase().includes("owner")) && (
                              <Link to="/partner" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <Activity size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Partner Dashboard</span>
                              </Link>
                            )}
                            {(role?.toLowerCase().includes("coach") || user?.role?.toLowerCase().includes("coach")) && (
                              <Link to="/coach" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <Zap size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Coach Portal</span>
                              </Link>
                            )}
                             {(role?.toLowerCase().includes("umpire") || user?.role?.toLowerCase().includes("umpire")) && (
                              <Link to="/umpire" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <Zap size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Umpire Portal</span>
                              </Link>
                            )}
                            {(role?.toLowerCase().includes("scorer") || user?.role?.toLowerCase().includes("scorer")) && (
                              <Link to="/scorer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <Zap size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Scorer Portal</span>
                              </Link>
                            )}
                            {(role?.toLowerCase().includes("streamer") || user?.role?.toLowerCase().includes("streamer")) && (
                              <Link to="/streamer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                <Zap size={18} className="text-white/40" />
                                <span className="text-sm font-medium">Streamer Portal</span>
                              </Link>
                            )}
                            <div className="h-[1px] bg-white/5 my-1" />
                          </>
                        )}

                        {/* ACCOUNT SECTION */}
                        <Link 
                          to="/messages" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <MessageCircle size={18} className="text-white/40" />
                          <span className="text-sm font-medium">Messages</span>
                        </Link>
                        
                        <Link 
                          to="/my-teams" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Users size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Teams</span>
                        </Link>
                        
                        <Link 
                          to="/profile?tab=bookings" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Clock size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Bookings</span>
                        </Link>
                        
                        <Link 
                          to="/my-hosted-games" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Target size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Hosted Games</span>
                        </Link>

                        <Link 
                          to="/my-joined-games" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Trophy size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Joined Matches</span>
                        </Link>

                        <Link 
                          to="/leaderboard" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 text-primary border border-primary/10 transition-all"
                        >
                          <Trophy size={18} className="text-primary/70" />
                          <span className="text-sm font-bold">Global Leaderboard</span>
                        </Link>

                        <Link 
                          to="/wallet" 
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                        >
                          <Zap size={18} className="text-white/40" />
                          <span className="text-sm font-medium">My Wallet</span>
                        </Link>

                        <div className="h-[1px] bg-white/5 my-1" />

                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
                        >
                          <LogOut size={18} className="opacity-70" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
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
