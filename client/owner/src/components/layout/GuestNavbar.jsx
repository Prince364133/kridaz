import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Activity, Globe, ShieldCheck, User, LogOut } from "lucide-react";
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
    { name: "NETWORK", path: "/" },
    { name: "PARTNERS", path: "/partners" },
    { name: "VENUES", path: "/partner" },
    { name: "COACHES", path: "/coach-landing" },
    { name: "OFFICIALS", path: "/umpire-landing" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-6"
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Cinematic Logo Unit */}
        <Link to="/" className="group flex items-center gap-6">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="BookMySportz" className="h-8 lg:h-10 w-auto brightness-125 group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="hidden sm:block border-l-2 border-[#84CC16]/30 pl-6 h-10 flex flex-col justify-center">
            <span className="block text-[9px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase leading-none mb-1.5 opacity-80">Partner Portal</span>
            <span className="block text-xl font-display-heavy text-white tracking-[0.15em] leading-none">COMMANDER</span>
          </div>
        </Link>

        {/* Tactical Navigation (Desktop) */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-[11px] font-display-heavy tracking-[0.2em] transition-all relative group ${
                location.pathname === link.path ? "text-[#84CC16]" : "text-white/40 hover:text-white"
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-[#84CC16] transition-all duration-300 ${
                location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"
              }`} />
            </Link>
          ))}
        </div>

        {/* Action Unit */}
        <div className="flex items-center gap-6">
          {!isLoggedIn ? (
            <>
              <Link 
                to="/login" 
                className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-black text-white/40 hover:text-[#84CC16] tracking-[0.2em] uppercase transition-all hover:translate-x-1"
              >
                <ShieldCheck size={14} className="opacity-50" />
                Secure Login
              </Link>
              
              <Link to="/signup" className="btn-bms h-11 px-8 text-[11px] font-black tracking-[0.2em] flex items-center gap-3 shadow-[0_0_20px_rgba(132,204,22,0.2)]">
                ENLIST <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6 mr-1">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Operational_Node</span>
                <span className="text-[11px] font-display-heavy text-[#84CC16] tracking-[0.2em]">{role?.toUpperCase() || "COMMANDER"}</span>
              </div>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="w-12 h-12 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer notched-corner group">
                  <User size={20} className="text-white/40 group-hover:text-[#84CC16] transition-colors" />
                </label>
                <ul tabIndex={0} className="dropdown-content mt-4 p-1 shadow-2xl bg-black border border-white/10 notched-corner w-52 overflow-hidden backdrop-blur-xl">
                  <li>
                    <Link to="/partner/profile" className="flex items-center gap-3 p-4 text-[10px] font-mono text-white/60 hover:text-[#84CC16] hover:bg-white/5 transition-all uppercase tracking-widest">
                      <User size={14} /> Profile_Core
                    </Link>
                  </li>
                  <li className="border-t border-white/5">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-4 text-[10px] font-mono text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all uppercase tracking-widest"
                    >
                      <LogOut size={14} /> Abort_Session
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

      {/* Mobile Tactical Menu */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl transition-all duration-500 ${
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}>
        <div className="flex flex-col h-full pt-32 px-10 gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="text-5xl font-display-heavy italic text-white/20 hover:text-[#84CC16] transition-colors tracking-tighter uppercase"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="mt-auto pb-20 space-y-6">
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex items-center justify-between">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-mono text-white/20 uppercase">System Status</span>
                 <span className="text-[10px] font-mono text-[#84CC16] uppercase">All Nodes Online</span>
               </div>
               <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-mono text-[#84CC16] border border-[#84CC16]/30 px-4 py-2 rounded-full uppercase"
               >
                 Sign In
               </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default GuestNavbar;
