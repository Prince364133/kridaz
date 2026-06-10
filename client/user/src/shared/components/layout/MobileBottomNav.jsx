import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Users, UserSearch, Trophy, Plus, PenSquare, Gamepad2, Award } from "lucide-react";
import { useSelector } from "react-redux";
import { getDynamicProfileRoute } from "@utils/routeUtils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggle = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/venues", icon: Search },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "My Teams", path: "/my-teams", icon: Users },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter(item => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  // Split into left (before +) and right (after +)
  const leftItems = visibleItems.slice(0, 2);
  const rightItems = visibleItems.slice(2, 4);

  return (
    <>
      {/* Full Screen Blur Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[90] bg-black/40 backdrop-blur-md pointer-events-auto"
          onClick={handleClose}
        />
      )}

      {/* Fixed Bottom Nav Bar */}
      <div 
        className="lg:hidden fixed left-0 right-0 z-[100] flex justify-center items-end"
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Floating Actions Container (Arc above + button) */}
        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex justify-center items-center">
          
          {/* Create Post (Far Left) */}
          <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[100ms] translate-x-[-100px] translate-y-[-30px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
            <Link to="/new-post" onClick={handleClose} title="Create Post" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
              <PenSquare size={22} />
            </Link>
          </div>

          {/* Join Game (Inner Left) */}
          <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[150ms] translate-x-[-65px] translate-y-[-80px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
            <Link to="/join-games" onClick={handleClose} title="Join Game" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
              <Trophy size={22} />
            </Link>
          </div>

          {/* Search (Center Top) */}
          <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[200ms] translate-x-[0px] translate-y-[-105px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
            <Link to="/search" onClick={handleClose} title="Search" className="w-14 h-14 rounded-full bg-[#1A1A1A] border-2 border-[#BFF367] text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-[0_0_15px_rgba(191,243,103,0.3)]">
              <Search size={26} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Professionals (Inner Right) */}
          <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[250ms] translate-x-[65px] translate-y-[-80px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
            <Link to="/professionals" onClick={handleClose} title="Professionals" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
              <Award size={22} />
            </Link>
          </div>

          {/* Scoring (Far Right) */}
          <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[300ms] translate-x-[100px] translate-y-[-30px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
            <Link to="/my-teams" state={{ openStartScoringModal: true }} onClick={handleClose} title="Scoring" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
              <Gamepad2 size={22} />
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative flex items-center justify-center gap-0 w-full">
          {/* Background Bar */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/10 shadow-[0_-4px_32px_rgba(0,0,0,0.5)]" />

          {/* Left Nav Items */}
          {leftItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleClose}
                className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-3
                  ${isActive ? "text-[#BFF367]" : "text-white/40 hover:text-white/60"}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? "opacity-100" : "opacity-60"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Center + Button */}
          <div className="relative z-10 flex items-center justify-center px-3">
            <button
              onClick={handleToggle}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full text-black transition-all duration-700 shadow-[0_0_20px_rgba(191,243,103,0.2)] border-[4px] border-black/80 ${isMenuOpen ? "bg-[#aade55] rotate-[135deg]" : "bg-[#BFF367] rotate-0 hover:scale-105"}`}
            >
              <Plus size={26} strokeWidth={3.5} />
            </button>
          </div>

          {/* Right Nav Items */}
          {rightItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleClose}
                className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-3
                  ${isActive ? "text-[#BFF367]" : "text-white/40 hover:text-white/60"}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? "opacity-100" : "opacity-60"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
