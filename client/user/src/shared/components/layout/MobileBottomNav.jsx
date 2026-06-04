import React, { useState } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Users, UserSearch, Trophy, Plus, PenSquare, Gamepad2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import { getDynamicProfileRoute } from "@utils/routeUtils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const { scrollDirection, scrolled } = useScrollDirection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScattered, setIsScattered] = useState(false);
  
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [savedPos, setSavedPos] = useState({ x: 0, y: 0 });

  const handleToggle = () => {
    if (isMenuOpen) {
      setIsScattered(false);
      setIsMenuOpen(false);
      // Wait for the fast closing animation to finish before moving back to original dragged position
      setTimeout(() => {
        controls.start({ x: savedPos.x, y: savedPos.y, transition: { type: "spring", stiffness: 300, damping: 25 } });
      }, 200);
    } else {
      setSavedPos({ x: x.get(), y: y.get() });
      controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
      setIsMenuOpen(true);
      setTimeout(() => setIsScattered(true), 250);
    }
  };

  const getDashboardPath = () => {
    const roleStr = role?.toLowerCase() || "";
    if (roleStr.includes("admin")) return "/admin";
    if (["venu_owners", "owner", "venue_owner", "verified_venue_owner"].some(r => roleStr.includes(r))) return "/venue-owner";
    if (roleStr.includes("coach")) return "/professional/coach";
    if (roleStr.includes("umpire")) return "/umpire";
    return getDynamicProfileRoute(user, role);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/venues", icon: Search },
    { name: "Create", isAction: true },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "My Teams", path: "/my-teams", icon: Users },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter(item => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  const dragConstraintsRef = React.useRef(null);

  return (
    <>
      {/* Invisible Drag Constraints Area */}
      <div className="lg:hidden fixed inset-4 z-[-1] pointer-events-none" ref={dragConstraintsRef} />

      {/* Full Screen Blur Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[90] bg-black/40 backdrop-blur-md pointer-events-auto"
          onClick={handleToggle}
        />
      )}

      {/* Free Floating Draggable Container */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 z-[100] pointer-events-none flex justify-center items-end">
        <motion.div
          drag
          dragConstraints={dragConstraintsRef}
          dragElastic={0.2}
          dragMomentum={false}
          style={{ x, y }}
          animate={controls}
          className="relative flex flex-col items-center justify-center pointer-events-auto"
        >
          
          {/* Floating Actions Container (Arc Navbar) */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 flex justify-center items-center">
            
            {/* Create Post (Far Left) */}
            <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[100ms] translate-x-[-90px] translate-y-[-40px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
              <Link to="/new-post" onClick={handleToggle} title="Create Post" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
                <PenSquare size={22} />
              </Link>
            </div>

            {/* Join Game (Inner Left) */}
            <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[150ms] translate-x-[-40px] translate-y-[-90px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
              <Link to="/join-games" onClick={handleToggle} title="Join Game" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
                <Trophy size={22} />
              </Link>
            </div>

            {/* Professionals (Inner Right) */}
            <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[200ms] translate-x-[40px] translate-y-[-90px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
              <Link to="/professionals" onClick={handleToggle} title="Professionals" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
                <UserSearch size={22} />
              </Link>
            </div>

            {/* Scoring (Far Right) */}
            <div className={`absolute z-50 transition-all ${isMenuOpen ? "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-[250ms] translate-x-[90px] translate-y-[-40px] scale-100 opacity-100 pointer-events-auto" : "duration-200 ease-in delay-0 translate-x-[0px] translate-y-[20px] scale-0 opacity-0 pointer-events-none"}`}>
              <Link to="/my-teams" state={{ openStartScoringModal: true }} onClick={handleToggle} title="Scoring" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#BFF367]/30 text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors shadow-xl">
                <Gamepad2 size={22} />
              </Link>
            </div>
          </div>

          {/* Horizontal Side Nav Icons (Home, Venues, Players, My Teams) */}
          {visibleItems.filter(item => !item.isAction).slice(0, 4).map((item, idx) => {
            const isActive = location.pathname === item.path;
            
            // Fixed horizontal translation relative to the dragged FAB
            let targetTranslate = "";
            if (idx === 0) targetTranslate = "translate-x-[-140px]"; // Far left
            if (idx === 1) targetTranslate = "translate-x-[-70px]"; // Inner left
            if (idx === 2) targetTranslate = "translate-x-[70px]"; // Inner right
            if (idx === 3) targetTranslate = "translate-x-[140px]"; // Far right

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleToggle}
                className={`absolute top-1/2 left-1/2 -mt-7 -ml-7 min-w-[56px] w-auto px-1 h-14 flex flex-col items-center justify-center gap-1 transition-all ease-out
                  ${!isMenuOpen ? "duration-200 translate-x-0 translate-y-0 scale-0 opacity-0 pointer-events-none" : isScattered ? `duration-500 ${targetTranslate} translate-y-0 scale-100 opacity-100 pointer-events-auto` : "duration-500 translate-x-0 translate-y-0 scale-100 opacity-100 pointer-events-none"}
                  ${isActive ? "text-[#BFF367]" : "text-white/40 hover:text-white/60"} -z-10`}
              >
                <div className={`relative p-1 rounded-[8px] transition-all duration-300 ${ isActive ? "scale-110" : "" }`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${ isActive ? "opacity-100" : "opacity-60" }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Main Action Button */}
          <button
            onClick={handleToggle}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full text-black transition-all duration-700 shadow-[0_0_20px_rgba(191,243,103,0.2)] border-[4px] border-black ${isMenuOpen ? "bg-[#aade55] rotate-[1035deg]" : "bg-[#BFF367] rotate-0 hover:scale-105"}`}
          >
            <Plus size={26} strokeWidth={3.5} />
          </button>
        </motion.div>
      </div>
    </>
  );
};

export default MobileBottomNav;
