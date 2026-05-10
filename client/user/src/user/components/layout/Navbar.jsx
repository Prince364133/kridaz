import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { User, Menu, X, LogOut, Activity, ShieldCheck, Zap, ArrowRight, Clock, Trophy, Target, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { logout } from "@redux/slices/authSlice";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";

const Navbar = () => {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerUrl = import.meta.env.VITE_PARTNER_URL || "http://localhost:5174";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  ] : [
    { name: "Home", path: "/" },
    { name: "Venues", path: "/turfs" },
    { name: "Pros", path: "/professionals" },
    { name: "Join Games", path: "/join-games" },
    { name: "Community", path: "/community" },
    { name: "Messages", path: "/messages" },
    { name: "Players", path: "/players" },
    { name: "Business", path: "#" },
  ];

  // Removed dedicated BOOKINGS link

  return (
    <nav className="relative z-[100] flex flex-col">

      <div className={`flex justify-center transition-all duration-500 ${isScrolled ? "pt-0" : "pt-0"}`}>
        <div 
          className={`relative w-full max-w-full h-16 sm:h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-12 transition-all duration-500 ${isScrolled ? "bg-black/90 backdrop-blur-2xl" : "bg-black/40 backdrop-blur-xl"}`}
          style={{ 
            boxShadow: isScrolled ? "0 20px 40px rgba(0, 0, 0, 0.4)" : "none"
          }}
        >
          {/* Logo Section */}
          <Link to="/" className="group flex items-center gap-6">
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="TurfSpot" className="h-8 lg:h-10 w-auto brightness-125 group-hover:scale-105 transition-transform duration-500" />
            </div>
          </Link>

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
                    </ul>
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
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
                
                <Link to="/signup" className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-11 px-8 text-sm font-bold flex items-center gap-3 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                  Join Now <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <div className="dropdown dropdown-end group/profile">
                  <label tabIndex={0} className="relative w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group overflow-hidden">
                    <User size={20} className="text-white/40 group-hover:text-[#84CC16] transition-colors absolute inset-0 m-auto" />
                    {user?.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover relative z-10" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center relative z-10"
                      style={{ display: user?.profilePicture ? 'none' : 'flex' }}
                    >
                      <User size={20} className="text-[#84CC16]" />
                    </div>
                    <div className="absolute inset-0 bg-[#84CC16]/10 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                  </label>
                  
                  <div tabIndex={0} className="dropdown-content mt-4 w-72 bg-[#0A0A0A] border border-white/10 rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* User Header */}
                    <div className="p-5 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                          <User size={24} className="text-[#84CC16] absolute inset-0 m-auto opacity-40" />
                          {user?.profilePicture ? (
                            <img 
                              src={user.profilePicture} 
                              alt="" 
                              className="w-full h-full object-cover absolute inset-0 z-10" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full flex items-center justify-center absolute inset-0 z-10"
                            style={{ display: user?.profilePicture ? 'none' : 'flex' }}
                          >
                            <span className="text-[#84CC16] font-black text-sm">
                              {user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : <User size={24} />}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user?.name || "User Account"}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider truncate">{user?.email || role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Groups */}
                    <div className="p-2 space-y-1">
                      {/* DASHBOARDS SECTION */}
                      {["bmsp_admin", "admin", "owner", "venue_owner", "verified_venue_owner", "coach", "umpire"].includes(role?.toLowerCase()) && (
                        <div className="px-3 py-2">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Management</p>
                          <div className="space-y-1">
                            {/* Admin Dashboard */}
                            {(role === "BMSP_ADMIN" || role === "admin") && (
                              <Link 
                                to="/admin"
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <ShieldCheck size={16} className="text-[#84CC16]" />
                                  <span className="text-xs font-bold uppercase tracking-tight">Admin Console</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                              </Link>
                            )}

                            {/* Partner Dashboard */}
                            {["owner", "venue_owner", "verified_venue_owner"].includes(role?.toLowerCase()) && (
                              <Link 
                                to="/partner"
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <Activity size={16} className="text-[#84CC16]" />
                                  <span className="text-xs font-bold uppercase tracking-tight">Partner Dashboard</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                              </Link>
                            )}

                            {/* Coach Dashboard */}
                            {["coach"].includes(role?.toLowerCase()) && (
                              <Link 
                                to="/coach"
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <Zap size={16} className="text-[#84CC16]" />
                                  <span className="text-xs font-bold uppercase tracking-tight">Coach Portal</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                              </Link>
                            )}

                            {/* Umpire Dashboard */}
                            {["umpire"].includes(role?.toLowerCase()) && (
                              <Link 
                                to="/umpire"
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <Activity size={16} className="text-[#84CC16]" />
                                  <span className="text-xs font-bold uppercase tracking-tight">Umpire Portal</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ACCOUNT SECTION */}
                      <div className="px-3 py-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Account</p>
                        <div className="space-y-1">
                          <Link 
                            to="/profile" 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <User size={16} />
                            <span className="text-xs font-bold uppercase tracking-tight">Personal Profile</span>
                          </Link>

                          <Link 
                            to="/messages" 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <MessageCircle size={16} />
                            <span className="text-xs font-bold uppercase tracking-tight">Messages</span>
                          </Link>
                          
                          <Link 
                            to="/profile?tab=bookings" 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase tracking-tight">My Bookings</span>
                          </Link>
                          
                          <Link 
                            to="/my-joined-games" 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/joined"
                          >
                            <Trophy size={16} className="text-[#84CC16] group-hover/joined:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-tight">My Joined Matches</span>
                          </Link>

                          <Link 
                            to="/wallet" 
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-[#84CC16] transition-all group/wallet"
                          >
                            <Zap size={16} className="text-[#84CC16]" />
                            <span className="text-xs font-bold uppercase tracking-tight">My Wallet</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Logout Section */}
                    <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 transition-all group/logout"
                      >
                        <LogOut size={16} className="group-hover/logout:translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors">Terminate Session</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button 
              className="lg:hidden text-white hover:text-primary transition-colors p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          {/* Header */}
          <div className="absolute top-0 w-full p-6 sm:p-10 flex justify-between items-center">
            <div className="w-32 h-12 bg-transparent overflow-hidden">
              <img src="/logo.png" alt="BookMySportz" className="h-10 w-full object-contain" />
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-primary/50 transition-all rounded-xl group"
            >
              <X size={24} className="text-white/50 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Links and Actions */}
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-8">
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col items-center gap-4">
                  <Link
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-3xl font-bold text-white hover:text-primary transition-all hover:scale-110"
                  >
                    {link.name}
                  </Link>
                  {(link.name === "Business") && (
                    <div className="flex flex-col items-center gap-3">
                      <Link to="/business/venue" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white/40 hover:text-primary transition-colors">Venue Owner</Link>
                      <Link to="/business/coach" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white/40 hover:text-primary transition-colors">Coaches</Link>
                      <Link to="/business/official" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-white/40 hover:text-primary transition-colors">Umpire</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              {isLoggedIn && ["BMSP_ADMIN", "owner", "VENUE_OWNER", "VERIFIED_VENUE_OWNER", "COACH", "coach", "UMPIRE", "umpire"].includes(role) && (
                <a 
                  href={
                    role === "BMSP_ADMIN" ? "/admin" :
                    ["owner", "VENUE_OWNER", "VERIFIED_VENUE_OWNER"].includes(role) ? "/partner" :
                    ["COACH", "coach"].includes(role) ? "/coach" :
                    "/umpire"
                  }
                  className="flex items-center gap-3 px-12 py-4 bg-primary/10 border border-primary/20 text-primary font-bold text-lg rounded-xl hover:bg-primary/20 transition-all"
                >
                  <Activity size={20} /> Dashboard
                </a>
              )}
              
              {!isLoggedIn ? (
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-bms px-16 py-4 text-lg font-semibold"
                >
                  Login
                </Link>
              ) : (
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-12 py-4 border border-red-500/30 text-red-500 font-bold text-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={20} /> Logout
                </button>
              )}
            </div>
          </div>
          
          {/* Footer Branding */}
          <div className="absolute bottom-10 flex flex-col items-center gap-4">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} BookMySportz Enterprise
            </p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
