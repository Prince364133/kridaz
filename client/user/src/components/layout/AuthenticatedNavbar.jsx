import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Menu, 
  Bell, 
  LogOut, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Search, 
  Cloud, 
  Plus,
  Command,
  User,
  Settings,
  ChevronDown
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import axiosInstance from "@hooks/useAxiosInstance";

const AuthenticatedNavbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  
  const user = useSelector((state) => state?.auth?.user);
  const role = useSelector((state) => state?.auth?.role);

  const getBasePath = () => {
    const r = role?.toLowerCase();
    if (r === "admin") return "/admin";
    if (r === "owner" || r === "bmsp_owner") return "/partner";
    if (r === "coach" || r === "bmsp_coach") return "/coach";
    if (r === "umpire" || r === "bmsp_umpire") return "/umpire";
    return "";
  };

  const handleProfileClick = () => {
    navigate(`${getBasePath()}/profile`);
  };

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Booking", message: "Pitch 1 booked for 6:00 PM", time: "5m ago", type: "booking" },
    { id: 2, title: "Payment Received", message: "Received ₹1200 for Booking #452", time: "1h ago", type: "payment" },
    { id: 3, title: "Review Alert", message: "Rahul G. gave you a 5-star review!", time: "2h ago", type: "review" },
    { id: 4, title: "System Update", message: "Dashboard maintenance tonight at 2 AM", time: "5h ago", type: "system" },
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      <nav className="navbar bg-[#000000] border-b border-[#2D2D2D] px-4 md:px-8 h-16 lg:h-20 shadow-[var(--shadow-4)] flex items-center justify-between">
        
        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-4 lg:min-w-[200px]">
          <button className="p-2 text-white hover:text-[#CCFF00] transition-colors lg:hidden" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-20 h-10 sm:w-32 sm:h-12 bg-transparent flex items-center justify-center overflow-hidden">
               <img src="/logo.png" alt="BookMySportz Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
        </div>

        {/* Center Section: Search & Greeting */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-6 max-w-4xl px-8">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#CCFF00] transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search bookings, players, or reports..."
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-12 pr-16 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all font-inter shadow-inner"
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-1.5">
              <div className="flex items-center justify-center w-5 h-5 rounded bg-white/5 text-[10px] text-white/30 border border-white/5"><Command size={10} /></div>
              <div className="flex items-center justify-center w-5 h-5 rounded bg-white/5 text-[10px] text-white/30 border border-white/5 font-bold">K</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">{getTimeGreeting()},</span>
            <span className="text-[#CCFF00] text-[11px] font-black uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
              {user?.name?.split(" ")[0] || user?.fullName?.split(" ")[0] || "User"}
            </span>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 sm:gap-5 lg:min-w-[200px] justify-end">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-[6px] transition-all duration-300 relative border border-transparent ${
                showNotifications ? "bg-[#CCFF00] text-black" : "bg-[#2D2D2D] text-[#999999] hover:bg-[#CCFF00]/10 hover:text-[#CCFF00] hover:border-[#CCFF00]/30"
              }`}
            >
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000000]" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-[#000000] border border-[#2D2D2D] rounded-[8px] shadow-[var(--shadow-4)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[#2D2D2D] flex items-center justify-between bg-[#151617]">
                  <h3 className="font-semibold text-white tracking-wide text-sm uppercase">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[10px] font-normal uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5 font-[Arial]">
                      <Trash2 size={12} /> Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-[#2D2D2D]/30 hover:bg-[#2D2D2D]/20 transition-colors cursor-pointer group">
                        <div className="flex gap-3">
                          <div className="mt-1 p-2 rounded-[4px] bg-[#CCFF00]/10 text-[#CCFF00]"><CheckCircle size={14} /></div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-[13px] font-semibold text-white group-hover:text-[#CCFF00] transition-colors uppercase tracking-tight">{notif.title}</h4>
                              <span className="text-[10px] text-[#878C9F] font-medium flex items-center gap-1"><Clock size={10} />{notif.time}</span>
                            </div>
                            <p className="text-[12px] text-[#999999] leading-relaxed">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#2D2D2D] flex items-center justify-center text-[#999999]"><Bell size={32} /></div>
                      <p className="text-sm text-[#999999] font-medium tracking-wide">No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-[#2D2D2D] mx-1 hidden sm:block" />

          {/* Profile Section */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1.5 pr-4 bg-[#0d0d0d] border border-white/5 rounded-[8px] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-[6px] bg-[#CCFF00] flex items-center justify-center text-black shadow-lg shadow-[#CCFF00]/10 group-hover:scale-105 transition-transform">
                <User size={22} strokeWidth={3} />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[12px] font-black text-white tracking-tight uppercase leading-none mb-1">{user?.name || user?.fullName || "User"}</span>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] leading-none">{role?.replace("BMSP_", "") || "OWNER"}</span>
              </div>
              <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-48 bg-[#000000] border border-[#2D2D2D] rounded-[8px] shadow-[var(--shadow-4)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-2">
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleProfileClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D2D2D]/50 hover:text-[#CCFF00] transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AuthenticatedNavbar;
