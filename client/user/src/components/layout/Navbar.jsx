import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { User, ShoppingCart, Bell, Menu, X, LogOut, Activity, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { logout } from "../../redux/slices/authSlice";
import ThemeSwitcher from "../common/ThemeSwitcher";

const Navbar = () => {
  const { isLoggedIn, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navLinks = [
    { name: "HOME", path: isLoggedIn ? "/auth" : "/" },
    { name: "ARENAS", path: isLoggedIn ? "/auth/turfs" : "/turfs" },
    { name: "PARTNERS", path: "/partners" },
  ];

  if (isLoggedIn) {
    navLinks.push({ name: "MISSION LOG", path: "/auth/booking-history" });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col">

      <div className={`flex justify-center transition-all duration-500 ${isScrolled ? "pt-0" : "pt-0"}`}>
        <div 
          className={`relative w-full max-w-full h-16 sm:h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-12 transition-all duration-500 ${isScrolled ? "bg-black/90 backdrop-blur-2xl" : "bg-black/40 backdrop-blur-xl"}`}
          style={{ 
            boxShadow: isScrolled ? "0 20px 40px rgba(0, 0, 0, 0.4)" : "none"
          }}
        >
          {/* Cinematic Logo Unit */}
          <Link to={isLoggedIn ? "/auth" : "/"} className="group flex items-center gap-6">
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="TurfSpot" className="h-8 lg:h-10 w-auto brightness-125 group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="hidden sm:block border-l-2 border-[#84CC16]/30 pl-6 h-10 flex flex-col justify-center">
              <span className="block text-[9px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase leading-none mb-1.5 opacity-80">Operational_Hub</span>
              <span className="block text-xl font-display-heavy text-white tracking-[0.15em] leading-none uppercase">TurfSpot</span>
            </div>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[11px] font-mono font-bold tracking-[0.3em] transition-all hover:text-primary relative group/link ${
                  location.pathname === link.path ? "text-primary" : "text-white/60"
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-2 left-0 h-[2px] bg-primary transition-all duration-300 ${location.pathname === link.path ? "w-full" : "w-0 group-hover/link:w-full"}`} />
              </Link>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-5 text-white/40 border-r border-white/5 pr-6 mr-1">
              <button className="hover:text-primary transition-colors relative group">
                <ShoppingCart size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full group-hover:animate-ping" />
              </button>
              <button className="hover:text-primary transition-colors">
                <Bell size={18} />
              </button>
            </div>

            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-black text-white/40 hover:text-[#84CC16] tracking-[0.2em] uppercase transition-all hover:translate-x-1"
                >
                  <ShieldCheck size={14} className="opacity-50" />
                  Login
                </Link>
                
                <Link to="/signup" className="btn-bms h-11 px-8 text-[11px] font-black tracking-[0.2em] flex items-center gap-3 shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                  JOIN NOW <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6 mr-1">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Player_Rank</span>
                  <span className="text-[11px] font-display-heavy text-[#84CC16] tracking-[0.2em]">{role?.toUpperCase() || "ATHLETE"}</span>
                </div>
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer notched-corner group">
                    <User size={20} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
                  </label>
                  <ul tabIndex={0} className="dropdown-content mt-4 p-1 shadow-2xl bg-black border border-white/10 notched-corner w-52 overflow-hidden backdrop-blur-xl">
                    <li>
                      <Link to="/profile" className="flex items-center gap-3 p-4 text-[10px] font-mono text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all uppercase tracking-widest">
                        <User size={14} /> Profile_View
                      </Link>
                    </li>
                    <li className="border-t border-white/5">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-4 text-[10px] font-mono text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all uppercase tracking-widest"
                      >
                        <LogOut size={14} /> Disconnect
                      </button>
                    </li>
                  </ul>
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
              className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-primary/50 transition-all notched-corner group"
            >
              <X size={24} className="text-white/50 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Links and Actions */}
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="telemetry-label text-[8px] opacity-40">System Version 1.0.4</span>
              <div className="h-[1px] w-12 bg-primary/30" />
            </div>

            <div className="flex flex-col items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-4xl font-display-heavy text-white hover:text-primary transition-all hover:scale-110 tracking-widest"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              {!isLoggedIn ? (
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-bms px-16 py-5 text-xl tracking-widest"
                >
                  LOGIN
                </Link>
              ) : (
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-12 py-4 border border-red-500/30 text-red-500 font-display-heavy text-xl hover:bg-red-500/10 transition-colors tracking-widest"
                >
                  TERMINATE_SESSION
                </button>
              )}
            </div>
          </div>
          
          {/* Footer Telemetry */}
          <div className="absolute bottom-10 flex flex-col items-center gap-4">
            <p className="text-[9px] font-mono text-white/20 tracking-[0.4em] uppercase">
              &copy; {new Date().getFullYear()} BookMySportz // Engineered for Athletes
            </p>
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
              <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
