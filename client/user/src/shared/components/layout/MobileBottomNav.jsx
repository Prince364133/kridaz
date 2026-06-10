import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Users, UserSearch, Trophy, Plus, PenSquare, Gamepad2, Award, MessageCircle, History, Wallet, Bookmark, Bell, Swords } from "lucide-react";
import { useSelector } from "react-redux";
import { getDynamicProfileRoute } from "@utils/routeUtils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = React.useRef(null);
  const touchStartX = React.useRef(null);
  const hasSwiped = React.useRef(false);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    hasSwiped.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    handleDragMove(currentX, currentY);
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchStartX.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    touchStartY.current = e.clientY;
    touchStartX.current = e.clientX;
    hasSwiped.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    touchStartY.current = null;
    touchStartX.current = null;
    setIsDragging(false);
  };

  const handleDragMove = (currentX, currentY) => {
    const deltaY = currentY - touchStartY.current;
    const deltaX = currentX - touchStartX.current;
    
    if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
      hasSwiped.current = true;
    }
    
    const delta = deltaY + deltaX; 
    setWheelRotation(prev => {
      let newRot = prev + delta * 0.4;
      return Math.max(-210, Math.min(newRot, 0));
    });
    
    touchStartY.current = currentY;
    touchStartX.current = currentX;
  };

  const handleWheel = (e) => {
    setWheelRotation(prev => {
      let newRot = prev + e.deltaY * 0.1;
      return Math.max(-210, Math.min(newRot, 0));
    });
  };

  const handleToggle = () => {
    setIsMenuOpen(prev => {
      if (!prev) setWheelRotation(0);
      return !prev;
    });
  };

  const handleClose = () => {
    setIsMenuOpen(false);
    setTimeout(() => setWheelRotation(0), 300);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/venues", icon: Search },
    { name: "Messages", path: "/messages", icon: MessageCircle },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "My Teams", path: "/my-teams", icon: Users },
  ];

  const floatingItems = [
    { title: "Search", path: "/search", icon: Search, size: "w-14 h-14", isSpecial: true },
    { title: "Create Post", path: "/new-post", icon: PenSquare, size: "w-12 h-12", isSpecial: false },
    { title: "Join Game", path: "/join-games", icon: Trophy, size: "w-12 h-12", isSpecial: false },
    { title: "Hosted Games", path: "/hosted-games", icon: Swords, size: "w-12 h-12", isSpecial: false },
    { title: "Professionals", path: "/professionals", icon: Award, size: "w-12 h-12", isSpecial: false },
    { title: "Bookings", path: "/booking-history", icon: History, size: "w-12 h-12", isSpecial: false },
    { title: "My Teams", path: "/my-teams", state: { openStartScoringModal: true }, icon: Gamepad2, size: "w-12 h-12", isSpecial: false },
    { title: "Wallet", path: "/wallet", icon: Wallet, size: "w-12 h-12", isSpecial: false },
    { title: "Saved Items", path: "/saved", icon: Bookmark, size: "w-12 h-12", isSpecial: false },
    { title: "Notifications", path: "/notifications", icon: Bell, size: "w-12 h-12", isSpecial: false },
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
          className={`lg:hidden fixed inset-0 z-[90] bg-black/40 backdrop-blur-md pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onClick={(e) => {
            if (!hasSwiped.current) handleClose();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      )}

      {/* Fixed Bottom Nav Bar */}
      <div 
        className="lg:hidden fixed left-0 right-0 z-[100] flex justify-center items-end"
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Floating Actions Container (Bottom Right) */}
        <div className="absolute right-4 bottom-[80px] flex justify-center items-center">
          
          {/* Dynamic Scrollable Wheel */}
          {floatingItems.map((item, i) => {
            const baseAngle = 90 + i * 22.5;
            const currentAngle = baseAngle + wheelRotation;
            const rad = currentAngle * Math.PI / 180;
            const radius = 145;
            
            const x = isMenuOpen ? radius * Math.cos(rad) : 0;
            const y = isMenuOpen ? -radius * Math.sin(rad) : 0;
            
            let opacity = 0;
            if (isMenuOpen) {
              if (currentAngle >= 85 && currentAngle <= 185) {
                opacity = 1;
              } else if (currentAngle >= 65 && currentAngle < 85) {
                opacity = (currentAngle - 65) / 20;
              } else if (currentAngle > 185 && currentAngle <= 205) {
                opacity = (205 - currentAngle) / 20;
              }
            }

            const pointerEvents = (isMenuOpen && opacity > 0.5) ? "auto" : "none";

            return (
              <div 
                key={i}
                className="absolute z-50 ease-out"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${isMenuOpen ? 1 : 0})`,
                  opacity,
                  pointerEvents,
                  transitionProperty: 'all',
                  transitionDuration: isDragging ? '0ms' : '200ms',
                  transitionDelay: (isMenuOpen && wheelRotation === 0 && !isDragging) ? `${100 + i * 25}ms` : '0ms'
                }}
              >
                <Link 
                  to={item.path} 
                  state={item.state} 
                  onClick={handleClose} 
                  title={item.title} 
                  className={`${item.size} rounded-full bg-[#1A1A1A] ${item.isSpecial ? "border-2 border-[#BFF367] shadow-[0_0_15px_rgba(191,243,103,0.3)]" : "border border-[#BFF367]/30 shadow-xl"} text-[#BFF367] flex items-center justify-center hover:bg-[#222] transition-colors`}
                >
                  <item.icon size={item.isSpecial ? 26 : 22} strokeWidth={item.isSpecial ? 2.5 : 2} />
                </Link>
              </div>
            );
          })}

          {/* Floating + Button */}
          <div className="relative z-[60] flex items-center justify-center">
            <button
              onClick={handleToggle}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full text-black transition-all duration-700 shadow-[0_0_20px_rgba(191,243,103,0.2)] border-[4px] border-black/80 ${isMenuOpen ? "bg-[#aade55] rotate-[135deg]" : "bg-[#BFF367] rotate-0 hover:scale-105"}`}
            >
              <Plus size={26} strokeWidth={3.5} />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative flex items-center justify-center gap-0 w-full">
          {/* Background Bar */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/10 shadow-[0_-4px_32px_rgba(0,0,0,0.5)]" />

          {/* All Nav Items */}
          {visibleItems.map((item) => {
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
