import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ShieldCheck, User, LogOut, ChevronDown } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";

const GuestNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { isLoggedIn, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userUrl = import.meta.env.VITE_USER_URL || "http://localhost:5173";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const navLinks = [
    { name: "Partner Overview", path: "/partners" },
    { name: "Venues", path: "/business/venue" },
    { name: "Coaches", path: "/business/coach" },
    { name: "Umpires", path: "/business/official" },
    { name: "Scorers", path: "/business/scorer" },
    { name: "Streamers", path: "/business/streamer" },
    { name: "Community", path: "/community" },
    { name: "Find Players", path: "/players" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-2" : "bg-transparent py-4"
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Brand Logo Unit */}
        <Link to="/" className="group flex items-center gap-4">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Kridaz" className="h-8 lg:h-10 w-auto transition-transform duration-500 group-hover:scale-105" />
          </div>
        </Link>

        {/* Navigation (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {/* Business Dropdown */}
          <div className="dropdown dropdown-hover group">
            <div 
              tabIndex={0} 
              className={`flex items-center gap-1 text-sm font-medium transition-all cursor-pointer ${
                location.pathname.startsWith("/business") || location.pathname === "/partners" ? "text-[#55DEE8]" : "text-white/60 hover:text-white"
              }`}
            >
              Business <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#55DEE8] transition-all duration-300 ${
                location.pathname.startsWith("/business") || location.pathname === "/partners" ? "w-full" : "w-0 group-hover:w-full"
              }`} />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-[#0d0d0d] border border-white/5 rounded-xl w-52 mt-0">
              <li>
                <Link to="/partners" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Partner Overview
                </Link>
              </li>
              <div className="h-px bg-white/5 my-1 mx-2" />
              <li>
                <Link to="/business/venue" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Venues
                </Link>
              </li>
              <li>
                <Link to="/business/coach" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Coaches
                </Link>
              </li>
              <li>
                <Link to="/business/official" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Umpires
                </Link>
              </li>
              <li>
                <Link to="/business/scorer" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Scorers
                </Link>
              </li>
              <li>
                <Link to="/business/streamer" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  Streamers
                </Link>
              </li>
            </ul>
          </div>

          <Link
            to="/community"
            className={`text-sm font-medium transition-all relative group ${
              location.pathname === "/community" ? "text-[#55DEE8]" : "text-white/60 hover:text-white"
            }`}
          >
            Community
            <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#55DEE8] transition-all duration-300 ${
              location.pathname === "/community" ? "w-full" : "w-0 group-hover:w-full"
            }`} />
          </Link>

          <Link
            to="/players"
            className={`text-sm font-medium transition-all relative group ${
              location.pathname === "/players" ? "text-[#55DEE8]" : "text-white/60 hover:text-white"
            }`}
          >
            Find Players
            <span className={`absolute -bottom-1 left-0 h-[2px] bg-[#55DEE8] transition-all duration-300 ${
              location.pathname === "/players" ? "w-full" : "w-0 group-hover:w-full"
            }`} />
          </Link>
        </div>

        {/* Action Unit */}
        <div className="flex items-center gap-6">
          {!isLoggedIn ? (
            <>
              <Link 
                to="/login" 
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-[#55DEE8] transition-all"
              >
                <ShieldCheck size={16} className="opacity-50" />
                Login
              </Link>
              
              <Link to="/partners" className="text-black h-10 px-6 rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#55DEE8]/30 hover:scale-105" style={{ background: "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)" }}>
                Join Now <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-4">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Account Type</span>
                <span className="text-sm font-bold text-[#55DEE8]">{role?.charAt(0).toUpperCase() + role?.slice(1) || "Partner"}</span>
              </div>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#55DEE8]/50 rounded-full transition-all cursor-pointer group">
                  <User size={20} className="text-white/60 group-hover:text-[#55DEE8] transition-colors" />
                </label>
                <ul tabIndex={0} className="dropdown-content mt-4 p-2 shadow-2xl bg-[#121212] border border-white/10 rounded-xl w-56 overflow-hidden backdrop-blur-xl">
                  <li>
                    <Link to="/partner/profile" className="flex items-center gap-3 p-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <User size={16} /> My Profile
                    </Link>
                  </li>
                  <li className="mt-1 pt-1 border-t border-white/5">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white/60 hover:text-white transition-colors">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-black/98 backdrop-blur-2xl transition-all duration-500 ${
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        <div className="flex flex-col h-full pt-28 px-8 gap-8">
          {navLinks.map((link) => (
            link.isExternal ? (
              <a
                key={link.name}
                href={link.path}
                className="text-4xl font-bold text-white/30 hover:text-[#55DEE8] transition-colors"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-4xl font-bold text-white/30 hover:text-[#55DEE8] transition-colors"
              >
                {link.name}
              </Link>
            )
          ))}
          
          <div className="mt-auto pb-12 space-y-6">
            <div className="h-[1px] w-full bg-white/10" />
            <div className="flex items-center justify-end">
               <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="text-sm font-bold text-[#55DEE8] border border-[#55DEE8]/30 px-6 py-2 rounded-lg"
               >
                 Login
               </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default GuestNavbar;
