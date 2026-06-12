import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Users, UserSearch, Trophy, Plus, PenSquare, MessageCircle, History, Gamepad2, Award, Wallet, Bookmark, Bell, Swords, Settings, Map, HelpCircle, Activity, Calendar, Store } from "lucide-react";
import { useSelector } from "react-redux";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Custom Icons State
  const [customIcons, setCustomIcons] = useState([null, null, null, null, null]);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const availableCustomIcons = [
    { title: "Hosted Games", path: "/my-hosted-games", icon: Swords },
    { title: "Professionals", path: "/professionals", icon: Award },
    { title: "Wallet", path: "/wallet", icon: Wallet },
    { title: "Saved Items", path: "/saved", icon: Bookmark },
    { title: "Notifications", path: "/notifications", icon: Bell },
    { title: "Start Scoring", path: "/my-teams", state: { openStartScoringModal: true }, icon: Gamepad2 },
    { title: "Find Venues", path: "/venues", icon: Map }
  ];

  const handleToggle = () => {
    if (isMenuOpen) {
      navigate('/search');
      handleClose();
    } else {
      setIsMenuOpen(true);
    }
  };

  const handleClose = () => {
    setIsMenuOpen(false);
    setShowIconSelector(false);
  };

  const handleEmptyIconClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSlotIndex(index);
    setShowIconSelector(true);
  };

  const handleSelectIcon = (selectedIcon) => {
    setCustomIcons(prev => {
      const newIcons = [...prev];
      newIcons[selectedSlotIndex] = selectedIcon;
      return newIcons;
    });
    setShowIconSelector(false);
  };

  const handleRemoveIcon = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomIcons(prev => {
      const newIcons = [...prev];
      newIcons[index] = null;
      return newIcons;
    });
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venues", path: "/venues", icon: Map },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "My Teams", path: "/my-teams", icon: Users },
  ];

  const popupItems = [
    { title: "Messages", path: "/messages", icon: MessageCircle, isSpecial: false },
    { title: "Create Post", path: "/new-post", icon: PenSquare, isSpecial: false },
    { title: "Join Game", path: "/join-games", icon: Trophy, isSpecial: false },
    { title: "Hosted Games", path: "/hosted-games", icon: Swords, isSpecial: false },
    { title: "Saved", path: "/saved", icon: Bookmark, isSpecial: false },
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
      {/* Transparent Click-away Overlay (No Masking) */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[90] pointer-events-auto"
          onClick={handleClose}
        />
      )}

      {/* Floating Bottom Nav Container */}
      <div 
        className="lg:hidden fixed left-4 right-4 z-[100] h-[60px] flex flex-col justify-end pointer-events-none mb-4"
        style={{ bottom: 'env(safe-area-inset-bottom)' }}
      >
        
        {/* Second Navbar (Custom Icons) */}
        <div 
          className={`absolute left-0 right-0 flex justify-center z-30 transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? "bottom-[125px] opacity-100 pointer-events-auto translate-y-0" 
              : "bottom-[30px] opacity-0 pointer-events-none translate-y-4"
          }`}
        >
          <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-1.5 md:gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {customIcons.map((item, i) => (
              <div key={`custom-${i}`} className="relative">
                {item ? (
                  <div className="relative flex items-center justify-center group">
                    <Link 
                      to={item.path}
                      state={item.state}
                      onClick={handleClose}
                      className="flex items-center justify-center"
                      title={item.title}
                    >
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-[12px] flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 bg-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]">
                        <item.icon size={16} strokeWidth={2.5} />
                      </div>
                    </Link>
                    {/* Tiny edit button to remove/change */}
                    <button 
                      onClick={(e) => handleRemoveIcon(e, i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1A1A1A] border border-white/20 text-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#BFF367] z-10 cursor-pointer"
                    >
                      <PenSquare size={8} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => handleEmptyIconClick(e, i)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-[12px] flex items-center justify-center transition-all duration-300 border border-dashed border-white/20 text-white/30 hover:border-white/50 hover:text-white/70 hover:bg-white/5"
                    title="Add Custom Shortcut"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Primary Popup Navbar (5 Pre-defined Icons) */}
        <div 
          className={`absolute left-0 right-0 flex justify-center z-40 transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? "bottom-[70px] opacity-100 pointer-events-auto translate-y-0" 
              : "bottom-[30px] opacity-0 pointer-events-none translate-y-4"
          }`}
        >
          {/* Adjusted padding/width for middle navbar */}
          <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-1.5 flex items-center gap-2 md:gap-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {popupItems.map((item, i) => (
              <Link 
                key={`primary-${i}`}
                to={item.path}
                state={item.state}
                onClick={handleClose}
                className="flex items-center justify-center group"
                title={item.title}
              >
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-125 ${
                  item.isSpecial 
                    ? "bg-[#BFF367]/20 text-[#BFF367] border border-[#BFF367]/40 group-hover:bg-[#BFF367] group-hover:text-black shadow-[0_0_15px_rgba(191,243,103,0.2)]" 
                    : "bg-white/5 text-white/70 border border-white/5 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20"
                }`}>
                  <item.icon size={18} strokeWidth={2.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Floating Bar */}
        <div className="relative w-full h-[60px] flex items-center justify-between px-2 pb-0 pointer-events-auto rounded-full z-50 transition-all duration-300">
          {/* Glass Background */}
          <div className="absolute inset-0 bg-[#050505]/70 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-0" />

          {/* Left Nav Items */}
          <div className="relative z-10 flex-1 flex justify-around items-center h-full">
            {leftItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleClose}
                  className="flex flex-col items-center justify-center p-2 transition-colors group"
                >
                  <div className={`relative flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? "w-11 h-11 bg-[#BFF367]/20 text-[#BFF367] rounded-full shadow-[0_0_15px_rgba(191,243,103,0.2)]" 
                      : "w-11 h-11 text-white/40 group-hover:text-white/80 group-hover:bg-white/10 group-hover:scale-110 rounded-full"
                  }`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Center Floating Actions Container */}
          <div className="relative z-50 flex justify-center items-center w-[60px] h-full">
            <div className="absolute bottom-[14px] flex justify-center items-center">
              
              {/* Floating + Button */}
              <button
                onClick={handleToggle}
                className={`relative flex items-center justify-center w-[44px] h-[44px] rounded-full text-black transition-all duration-500 shadow-[0_0_20px_rgba(191,243,103,0.3)] border-[3px] border-[#050505] ${
                  isMenuOpen ? "bg-[#aade55]" : "bg-[#BFF367] hover:scale-105"
                }`}
              >
                <Plus 
                  size={22} 
                  strokeWidth={3.5} 
                  className={`absolute transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}`} 
                />
                <Search 
                  size={20} 
                  strokeWidth={3} 
                  className={`absolute transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}`} 
                />
              </button>
            </div>
          </div>

          {/* Right Nav Items */}
          <div className="relative z-10 flex-1 flex justify-around items-center h-full">
            {rightItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleClose}
                  className="flex flex-col items-center justify-center p-2 transition-colors group"
                >
                  <div className={`relative flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? "w-11 h-11 bg-[#BFF367]/20 text-[#BFF367] rounded-full shadow-[0_0_15px_rgba(191,243,103,0.2)]" 
                      : "w-11 h-11 text-white/40 group-hover:text-white/80 group-hover:bg-white/10 group-hover:scale-110 rounded-full"
                  }`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Icon Selector Modal */}
      {showIconSelector && (
        <div className="lg:hidden fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIconSelector(false)}
          />
          <div className="relative w-full max-w-[320px] bg-[#111] border border-white/10 rounded-[20px] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-white font-black text-sm mb-3 text-center uppercase tracking-wider">Add Custom Shortcut</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableCustomIcons.map((iconOpt, idx) => {
                const isSelected = customIcons.some(item => item && item.title === iconOpt.title);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectIcon(iconOpt)}
                    disabled={isSelected}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-[12px] transition-all group ${
                      isSelected 
                        ? "bg-[#BFF367]/10 border border-[#BFF367]/50 text-[#BFF367] opacity-60 cursor-not-allowed" 
                        : "bg-white/5 border border-white/5 hover:bg-[#BFF367]/10 hover:border-[#BFF367]/30 hover:text-[#BFF367] text-white/70"
                    }`}
                  >
                    <div className="relative">
                      <iconOpt.icon size={18} strokeWidth={2} className={`${isSelected ? "" : "group-hover:scale-110"} transition-transform`} />
                    </div>
                    <span className="text-[8px] font-medium text-center leading-[1.1]">{iconOpt.title}</span>
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setShowIconSelector(false)}
              className="mt-4 w-full py-2.5 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
