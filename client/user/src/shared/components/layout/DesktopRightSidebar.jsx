import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  Clock, Calendar, MapPin, Star, UserPlus, UserMinus, Trophy, ArrowRight, 
  Ticket, IndianRupee, Sparkles, Info, Plus, Users, Zap, Share2, 
  DollarSign, Activity, CheckCircle2, Wallet, ArrowUpRight, ChevronRight 
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

export default function DesktopRightSidebar({ isRightDrawerOpen, setIsRightDrawerOpen }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const { gateInteraction } = useLoginOnDemand();
  const { isLoggedIn, user, followingIds = [] } = useSelector((state) => state.auth);

  // Parse path context
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isVenuePage = location.pathname.startsWith("/venues") || location.pathname.startsWith("/venue/");
  const isPlayerPage = location.pathname.startsWith("/players") || location.pathname.startsWith("/profile");
  const isTournamentPage = location.pathname.startsWith("/leaderboard") || location.pathname.startsWith("/match");
  const isMessagesPage = location.pathname.startsWith("/messages");

  // Local states for real-time fetched data
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Dynamic greetings
  const [greeting, setGreeting] = useState("Welcome");

  // Page Specific Details
  const [activeTurf, setActiveTurf] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);

  const turfId = location.pathname.startsWith("/venue/") ? location.pathname.split("/venue/")[1] : null;
  const profileId = location.pathname.startsWith("/profile") ? location.pathname.split("/profile/")[1] : null;

  // Set time-based greeting
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Fetch Core/Home Widgets Data
  useEffect(() => {
    if (isHome) {
      // 1. Fetch suggested players (publicly available)
      setLoadingPlayers(true);
      axiosInstance.get("/api/user/players", { params: { limit: 3, sortBy: "newest" } })
        .then(res => setSuggestedPlayers(res.data.players || []))
        .catch(console.error)
        .finally(() => setLoadingPlayers(false));

      // 2. Fetch venues (publicly available)
      setLoadingVenues(true);
      axiosInstance.get("/api/user/turf/all", { params: { limit: 3 } })
        .then(res => setNearbyVenues(res.data.turfs || []))
        .catch(console.error)
        .finally(() => setLoadingVenues(false));

      if (isLoggedIn) {
        // 3. Fetch bookings (requires auth)
        setLoadingBookings(true);
        axiosInstance.get("/api/user/booking/get-bookings")
          .then(res => setBookings(res.data || []))
          .catch(console.error)
          .finally(() => setLoadingBookings(false));

        // 4. Fetch Wallet Balance (requires auth)
        setLoadingWallet(true);
        axiosInstance.get("/api/user/wallet/get")
          .then(res => {
            if (res.data?.success) {
              setWalletBalance(res.data.wallet?.balance || 0);
            }
          })
          .catch(console.error)
          .finally(() => setLoadingWallet(false));
      }
    }
  }, [isHome, isLoggedIn]);

  // Fetch Venue Context Details
  useEffect(() => {
    if (turfId) {
      axiosInstance.get(`/api/user/turf/details/${turfId}`)
        .then(res => setActiveTurf(res.data.turf))
        .catch(console.error);
    } else {
      setActiveTurf(null);
    }
  }, [turfId]);

  // Fetch Player Context Details
  useEffect(() => {
    if (profileId && profileId !== "undefined") {
      axiosInstance.get(`/api/user/players/${profileId}`)
        .then(res => setActivePlayer(res.data.player))
        .catch(console.error);
    } else {
      setActivePlayer(null);
    }
  }, [profileId]);

  // Handle Follow Toggle with Redux & Kridaz Login Gate
  const handleFollowToggleLocal = async (player) => {
    gateInteraction(async () => {
      const playerId = player._id || player.id;
      const isFollowing = followingIds.includes(playerId);
      
      // Optimistic Update
      dispatch(isFollowing ? unfollowUser(playerId) : followUser(playerId));

      try {
        if (isFollowing) {
          await axiosInstance.post(`/api/user/players/${playerId}/unfollow`);
          toast.success("Unfollowed player");
        } else {
          await axiosInstance.post(`/api/user/players/${playerId}/follow`);
          toast.success("Following player");
        }
      } catch (err) {
        // Revert on error
        dispatch(isFollowing ? followUser(playerId) : unfollowUser(playerId));
        toast.error("Failed to update follow status");
      }
    }, { 
      title: "Follow Player", 
      message: `Sign in to follow ${player.name} and stay updated.` 
    });
  };

  if (isMessagesPage) return null;

  const greetingName = isLoggedIn && user?.name ? user.name.split(' ')[0] : "Champion";

  return (
    <>
      {/* Tablet Drawer Backdrop Overlay */}
      {isRightDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[72] xl:hidden"
          onClick={() => setIsRightDrawerOpen(false)}
        />
      )}

      <aside className={`fixed top-[72px] right-0 bottom-0 w-[440px] bg-[#050505] border-l border-white/5 p-6 overflow-y-auto no-scrollbar transition-transform duration-300 z-[74] xl:z-[60] xl:translate-x-0 xl:block ${isRightDrawerOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}`}>
        <div className="space-y-6">
          {/* ── HOME & GENERAL PORTAL VIEW WIDGETS ── */}
          {isHome && (
            <>
              {/* 1. Welcome Card */}
              <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-[#BFF367]/20 flex items-center justify-center shrink-0">
                    {isLoggedIn && (user?.profilePicture || user?.profileImage) ? (
                      <img src={user.profilePicture || user.profileImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[#BFF367] font-black text-sm">
                        {isLoggedIn && user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : "KR"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-white uppercase tracking-tight leading-none">
                      {greeting}, {greetingName}!
                    </h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1.5 leading-none">
                      {isLoggedIn ? "Ready to dominate the field?" : "Connect, Book & Play Local Sports"}
                    </p>
                  </div>
                </div>

                {/* Wallet summary */}
                {isLoggedIn ? (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                        <Wallet size={11} className="text-[#BFF367]" />
                        Wallet Balance
                      </span>
                      <div className="text-xl font-black text-white flex items-center leading-none">
                        <IndianRupee size={15} className="mt-0.5" />
                        {walletBalance.toFixed(2)}
                      </div>
                    </div>
                    <Link 
                      to="/wallet"
                      className="px-3.5 py-2 bg-[#BFF367] hover:bg-[#a2d152] active:scale-95 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_12px_rgba(191,243,103,0.15)] flex items-center gap-1 shrink-0"
                    >
                      <Plus size={10} strokeWidth={3} /> Top Up
                    </Link>
                  </div>
                ) : (
                  <button 
                    onClick={() => gateInteraction(() => {}, { title: "Join Kridaz", message: "Sign in to access your wallet, check bookings, and schedule matches." })}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Wallet size={12} className="text-[#BFF367]" />
                    Log in to view wallet
                  </button>
                )}
              </div>

              {/* 2. Upcoming Bookings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Upcoming Bookings</h4>
                  <Link to="/booking-history" className="text-[9px] font-black uppercase text-[#BFF367] hover:underline flex items-center gap-1 tracking-wider">
                    View All <ChevronRight size={10} />
                  </Link>
                </div>

                {isLoggedIn && bookings.length > 0 ? (
                  <div className="space-y-2">
                    {bookings.slice(0, 2).map((booking) => (
                      <div key={booking._id || booking.id} className="bg-[#0B0B0C] border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-4 transition-all duration-300 shadow-md flex gap-3.5 group">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/5 shrink-0">
                          <img 
                            src={booking.turf?.images?.[0] || "https://images.unsplash.com/photo-1518605368461-1ee7111d4e7a?auto=format&fit=crop&q=80"} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            alt="" 
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-[#BFF367]/10 text-[#BFF367] rounded-[4px] text-[7px] font-black uppercase tracking-wider">{booking.turf?.sportType || "Sports"}</span>
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-[4px] text-[7px] font-black uppercase tracking-wider border border-green-500/10">Confirmed</span>
                            </div>
                            <h5 className="text-[12px] font-black text-white truncate uppercase mt-1.5 group-hover:text-[#BFF367] transition-colors">{booking.turf?.name}</h5>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-medium text-white/50 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-0.5"><Clock size={9} /> {booking.timeSlot?.formattedStartTime || "Slot"}</span>
                              <span className="flex items-center gap-0.5"><Calendar size={9} /> {booking.timeSlot?.date || "Date"}</span>
                            </div>
                            <Link to={`/booking-pass/${booking.id || booking._id}`} className="text-[#BFF367] hover:underline flex items-center gap-0.5 font-bold uppercase tracking-wider text-[8px]">
                              <Ticket size={9} /> Pass
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-3.5">
                    <p className="text-[10px] font-bold text-white/35 uppercase tracking-wide">
                      {isLoggedIn ? "No upcoming matches booked" : "Please log in to view your bookings"}
                    </p>
                    <Link to="/venues" className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#BFF367]/50 hover:bg-[#BFF367]/5 text-[9px] font-black text-[#BFF367] uppercase tracking-widest transition-all">
                      Book A Turf <ArrowRight size={10} />
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Recent Activity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Recent Activity</h4>
                  <Link to="/booking-history" className="text-[9px] font-black uppercase text-[#BFF367] hover:underline flex items-center gap-1 tracking-wider">
                    View All <ChevronRight size={10} />
                  </Link>
                </div>
                
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4.5 space-y-4 shadow-sm">
                  {[
                    { title: "Booking Confirmed", desc: "MRR Cricket Ground", time: "1 hour ago", icon: CheckCircle2, iconColor: "text-[#BFF367]" },
                    { title: "Payment Successful", desc: "Paid ₹1,200 via Wallet", time: "3 hours ago", icon: DollarSign, iconColor: "text-blue-400" },
                    { title: "Joined Match Lobby", desc: "T20 Practice League", time: "Yesterday", icon: Users, iconColor: "text-yellow-500" },
                    { title: "Registered Tournament", desc: "Hyderabad Super Sixes", time: "2 days ago", icon: Trophy, iconColor: "text-purple-400" }
                  ].map((act, index) => (
                    <div key={index} className="flex items-start gap-3 relative last:mb-0 group">
                      {index < 3 && (
                        <div className="absolute left-[9px] top-6 bottom-[-16px] w-[1.5px] bg-white/[0.04]" />
                      )}
                      <div className={`w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 mt-0.5 ${act.iconColor}`}>
                        <act.icon size={11} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h5 className="text-[11px] font-bold text-white leading-none uppercase">{act.title}</h5>
                          <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">{act.time}</span>
                        </div>
                        <p className="text-[10px] text-white/50 font-medium font-sans mt-1.5 leading-none">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest px-1">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Create Match", path: "/my-teams", state: { openStartScoringModal: true }, icon: Plus, subtitle: "Score matches live" },
                    { label: "Find Players", path: "/players", icon: Users, subtitle: "Local matchmaker" },
                    { label: "AI Matchmaking", path: "/join-games", icon: Zap, subtitle: "Auto lobby join" },
                    { label: "Invite & Earn", path: "/wallet", icon: Share2, subtitle: "Get ₹100 credit" }
                  ].map((action, i) => (
                    <Link 
                      key={i} 
                      to={action.path} 
                      state={action.state}
                      className="bg-[#0B0B0C] border border-white/[0.05] hover:border-[#BFF367]/30 rounded-xl p-3.5 transition-all duration-300 group flex flex-col justify-between h-[82px] shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <action.icon size={16} className="text-[#BFF367] group-hover:scale-110 transition-transform duration-300" />
                        <ArrowUpRight size={10} className="text-white/20 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-white uppercase tracking-wider leading-none">{action.label}</h5>
                        <p className="text-[8px] text-white/40 mt-1 font-bold uppercase tracking-wider leading-none">{action.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 5. Trending Tournaments */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest px-1">Trending Tournaments</h4>
                <Link to="/leaderboard" className="block bg-[#0B0B0C] border border-white/[0.05] hover:border-white/[0.1] rounded-xl overflow-hidden shadow-lg group transition-all duration-300">
                  <div className="h-28 w-full bg-gradient-to-br from-[#BFF367]/15 via-zinc-900 to-black p-4 flex flex-col justify-between relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-30 object-cover w-full h-full" />
                    <div className="flex justify-between items-start z-10">
                      <span className="px-2 py-0.5 bg-[#BFF367] text-black rounded text-[7px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(191,243,103,0.3)]">REGISTERING NOW</span>
                      <span className="text-white/40 text-[8px] font-black uppercase tracking-wider">CRICKET</span>
                    </div>
                    <div className="z-10">
                      <h4 className="text-[13px] font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#BFF367] transition-colors duration-300">Hyderabad Super Sixes 2026</h4>
                      <p className="text-[9px] text-[#BFF367] font-black uppercase tracking-widest mt-1">₹50,000 Cash Pool</p>
                    </div>
                  </div>
                  <div className="p-3 bg-black/60 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    <span>👥 28/32 Teams Registered</span>
                    <span className="text-[#BFF367] hover:underline flex items-center gap-0.5">Register <ChevronRight size={9} /></span>
                  </div>
                </Link>
              </div>

              {/* 6. Trending Matches */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest px-1">Trending Matches</h4>
                <div className="space-y-2.5">
                  {/* Live Match */}
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-3.5 space-y-2.5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-wider">LIVE SCORING</span>
                      </span>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">T20 LEAGUE</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-black uppercase">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="truncate text-white">Cyberabad Titans</span>
                        <span className="truncate text-white/50">Secunderabad Strikers</span>
                      </div>
                      <div className="text-right flex flex-col gap-1 text-[#BFF367]">
                        <span>142/3 (15.4)</span>
                        <span className="text-white/40 font-bold">Yet to bat</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-bold text-white/40 uppercase tracking-widest">
                      <span>📍 MRR Cricket Ground</span>
                      <Link to="/leaderboard" className="text-[#BFF367] flex items-center gap-0.5 hover:underline">
                        Spectate Match <ChevronRight size={9} />
                      </Link>
                    </div>
                  </div>

                  {/* Upcoming Match */}
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-3.5 space-y-2.5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[7px] font-black uppercase tracking-wider border border-yellow-500/20">UPCOMING</span>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">TODAY 18:00</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-black uppercase">
                      <span className="truncate max-w-[150px] text-white">Gachibowli Kings</span>
                      <span className="text-white/35 font-normal shrink-0 text-[9px] px-1">VS</span>
                      <span className="truncate max-w-[150px] text-right text-white">Kondapur Warriors</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Suggested Players */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest px-1">Suggested Players</h4>
                <div className="space-y-2">
                  {loadingPlayers ? (
                    <div className="text-[10px] text-white/40 font-medium py-3 text-center">Loading players...</div>
                  ) : suggestedPlayers.length > 0 ? (
                    suggestedPlayers.slice(0, 3).map((player) => {
                      const playerId = player._id || player.id;
                      const isFollowed = followingIds.includes(playerId);
                      return (
                        <div key={playerId} className="flex items-center justify-between bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-3 hover:border-white/10 transition-colors">
                          <Link to={`/profile/${playerId}`} className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                              className="w-8 h-8 rounded-full object-cover shrink-0 bg-white/5 border border-white/5" 
                              alt=""
                            />
                            <div className="min-w-0">
                              <h5 className="text-[12px] font-bold text-white truncate hover:text-[#BFF367] transition-colors">{player.name}</h5>
                              <span className="text-[9px] text-[#BFF367] font-bold uppercase tracking-wider block mt-0.5">{player.city || "Player"}</span>
                            </div>
                          </Link>
                          <button
                            onClick={() => handleFollowToggleLocal(player)}
                            className={`p-2 rounded-full transition-all shrink-0 ${isFollowed ? "bg-white/5 text-white/40 hover:text-white" : "bg-[#BFF367] text-black hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(191,243,103,0.1)]"}`}
                          >
                            {isFollowed ? <UserMinus size={11} /> : <UserPlus size={11} />}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-white/30 italic text-center py-2">No suggested players found</div>
                  )}
                </div>
              </div>

              {/* 8. Nearby Grounds */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest px-1">Nearby Grounds</h4>
                <div className="space-y-2">
                  {loadingVenues ? (
                    <div className="text-[10px] text-white/40 font-medium py-3 text-center">Loading grounds...</div>
                  ) : nearbyVenues.length > 0 ? (
                    nearbyVenues.slice(0, 3).map((venue, idx) => {
                      const mockDistances = ["1.2 km away", "2.8 km away", "3.5 km away"];
                      const distanceStr = venue.distance || mockDistances[idx % mockDistances.length];
                      return (
                        <Link key={venue._id} to={`/venue/${venue._id}`} className="block bg-[#0B0B0C] border border-white/[0.05] hover:border-[#BFF367]/30 rounded-xl p-3.5 transition-all group shadow-sm">
                          <div className="flex gap-3">
                            <img 
                              src={venue.images?.[0] || "/default-turf.jpg"} 
                              className="w-14 h-14 rounded-lg object-cover bg-white/5 shrink-0 border border-white/5" 
                              onError={(e) => {
                                const fallback = "https://images.unsplash.com/photo-1518605368461-1ee7111d4e7a?auto=format&fit=crop&q=80";
                                if (e.target.src !== fallback) {
                                  e.target.src = fallback;
                                }
                              }}
                              alt=""
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <h5 className="text-[12px] font-black text-white truncate uppercase group-hover:text-[#BFF367] transition-colors leading-none">{venue.name}</h5>
                                <p className="text-[10px] font-bold text-[#BFF367] uppercase tracking-wider mt-1.5 leading-none">₹{venue.pricePerHour || 1200}/hr</p>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-white/40 mt-1">
                                <span className="flex items-center gap-0.5"><MapPin size={9} /> {distanceStr}</span>
                                <span className="flex items-center gap-0.5 text-yellow-500 font-bold"><Star size={9} fill="currentColor" /> {venue.averageRating || venue.rating || "4.8"}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-white/30 italic text-center py-2">No grounds found</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── VENUE-SPECIFIC WIDGETS ── */}
          {isVenuePage && (
            <>
              {activeTurf ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Venue Summary Widget */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Venue Summary</h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                      <h3 className="text-[14px] font-black text-white uppercase tracking-tight leading-tight">{activeTurf.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#BFF367] font-bold">
                        <Star size={12} fill="currentColor" className="text-yellow-500" /> {activeTurf.averageRating || activeTurf.rating || "4.8"} ({activeTurf.totalReviews || 12} reviews)
                      </div>
                      <div className="text-[10px] text-white/50 leading-relaxed font-sans">{activeTurf.description || "Premium sports arena with top tier grass fields, floodlights, and professional training facilities."}</div>
                    </div>
                  </div>

                  {/* Pricing Card */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Pricing & Status</h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 flex justify-between items-center shadow-md">
                      <div>
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Hourly Price</span>
                        <div className="text-xl font-black text-white mt-1.5 flex items-center leading-none">
                          <IndianRupee size={15} />{activeTurf.pricePerHour || 1500}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[8px] font-black uppercase tracking-wider border border-green-500/20">AVAILABLE</span>
                        <p className="text-[8px] text-white/45 mt-1.5 uppercase font-bold tracking-widest">Instant Booking</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Booking card */}
                  <div className="bg-gradient-to-br from-[#BFF367]/10 to-transparent border border-[#BFF367]/20 rounded-xl p-4 space-y-3.5 shadow-lg">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#BFF367] font-black uppercase tracking-wider">
                      <Sparkles size={12} className="animate-pulse" />
                      <span>Ready to play?</span>
                    </div>
                    <p className="text-[10px] text-white/60 leading-normal font-sans">Reserve your preferred slot now. Secure payments and instant passes via wallet or online payment.</p>
                    <Link to={`/checkout/${activeTurf._id || activeTurf.id}`} className="block w-full text-center py-3 bg-[#BFF367] text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_15px_rgba(191,243,103,0.15)]">
                      Quick Book Now
                    </Link>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Location Info</h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex gap-2.5 text-[11px] text-white/70 font-sans">
                        <MapPin size={14} className="text-[#BFF367] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white uppercase">{activeTurf.city}, {activeTurf.state}</p>
                          <p className="text-[9px] text-white/40 mt-1 leading-normal uppercase">{activeTurf.address || "Main Sports Hub Area"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-2.5 shadow-md">
                  <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Venue Directory</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-sans uppercase font-bold tracking-wide">Select a venue from the list to see detailed summary, rates, location maps, and quick booking options.</p>
                </div>
              )}
            </>
          )}

          {/* ── TOURNAMENT-SPECIFIC WIDGETS ── */}
          {isTournamentPage && (
            <div className="space-y-6 animate-fade-in">
              {/* Tournament Information */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Active Tournament Info</h4>
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                  <span className="px-2 py-0.5 bg-[#BFF367]/10 text-[#BFF367] rounded text-[8px] font-black uppercase tracking-wider border border-[#BFF367]/20">BOX CRICKET</span>
                  <h3 className="text-[14px] font-black text-white uppercase tracking-tight">Kridaz Super Sixes 2026</h3>
                  <div className="flex flex-col gap-2 text-[10px] text-white/60 font-bold uppercase tracking-wider pt-1">
                    <span className="flex items-center gap-1.5">🏆 Prize Pool: <span className="text-white font-black">₹50,000</span></span>
                    <span className="flex items-center gap-1.5">📍 Venue: <span className="text-white font-black">PlayArena Gachibowli</span></span>
                    <span className="flex items-center gap-1.5">📅 Dates: <span className="text-white font-black">15 - 20 June 2026</span></span>
                  </div>
                </div>
              </div>

              {/* Registration status */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/25 rounded-xl p-4 space-y-3 shadow-lg">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} className="animate-pulse" /> REGISTRATIONS CLOSING SOON
                </h5>
                <p className="text-[10px] text-white/60 leading-normal font-sans">Only 3 team slots remaining. Connect with your team players and register to secure entry in the tournament grid.</p>
                <Link to="/my-teams" className="block w-full text-center py-2.5 bg-yellow-505 text-black bg-yellow-500 font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_12px_rgba(234,179,8,0.15)]">
                  Register Your Team
                </Link>
              </div>

              {/* Upcoming Matches */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Upcoming Matchup</h4>
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-white/40">15 Jun | 18:00</span>
                    <span className="text-[8px] font-black uppercase text-[#BFF367]">Match 01</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="truncate max-w-[120px] text-white">Secunderabad Strikers</span>
                    <span className="text-white/40 font-normal shrink-0 text-[10px]">VS</span>
                    <span className="truncate max-w-[120px] text-right text-white">Cyberabad Titans</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PLAYER-SPECIFIC WIDGETS ── */}
          {isPlayerPage && (
            <>
              {activePlayer ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Profile Summary */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Player Profile</h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-3.5 shadow-md">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-[#BFF367]/25 mx-auto">
                        <img src={activePlayer.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePlayer.name}`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black text-white truncate uppercase tracking-tight">{activePlayer.name}</h3>
                        <p className="text-[10px] text-white/40 uppercase font-bold mt-1 leading-none">@{activePlayer.username || activePlayer.name?.toLowerCase().replace(/\s+/g, '')}</p>
                      </div>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {activePlayer.interests?.slice(0, 3).map((item) => (
                          <span key={item} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-white/60 uppercase">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player Statistics */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Statistics</h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 grid grid-cols-3 gap-2.5 text-center shadow-md">
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">Matches</span>
                        <div className="text-[15px] font-black text-white mt-1.5 leading-none">{activePlayer.matchesPlayed || 14}</div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">Rating</span>
                        <div className="text-[15px] font-black text-[#BFF367] mt-1.5 leading-none">{activePlayer.rating || "4.9"}</div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">Followers</span>
                        <div className="text-[15px] font-black text-white mt-1.5 leading-none">{activePlayer.followersCount || 120}</div>
                      </div>
                    </div>
                  </div>

                  {/* Connect/Invite actions */}
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                    <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Player Actions</h5>
                    <div className="space-y-2">
                      <Link to="/messages" className="block w-full text-center py-3 bg-[#BFF367] text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_12px_rgba(191,243,103,0.15)]">
                        Send Message
                      </Link>
                      <button className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-white/10 transition-colors">
                        Invite to Match
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-2.5 shadow-md">
                  <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Player Profiles</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-sans uppercase font-bold tracking-wide">Select a profile from the directory to review their matchup statistics, ratings, and send games invites.</p>
                </div>
              )}
            </>
          )}

          {/* ── DEFAULT WIDGETS (Fallback for other general pages) ── */}
          {!isHome && !isVenuePage && !isPlayerPage && !isTournamentPage && (
            <>
              {/* Quick Info */}
              <div className="bg-gradient-to-br from-[#BFF367]/5 to-transparent border border-white/5 rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#BFF367] font-black uppercase tracking-wider">
                  <Info size={12} />
                  <span>Kridaz Arena</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-sans">Welcome to India's ultimate sports-tech platform. Score matches, secure venue bookings, hire professionals, and match-make in real-time.</p>
              </div>

              {/* Trending matches list */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Trending Leagues</h4>
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-3.5 space-y-3 shadow-md">
                  <div className="border-b border-white/5 pb-2.5">
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[7px] font-black uppercase tracking-wider">LIVE</span>
                    <h5 className="text-[11px] font-bold text-white mt-1.5 truncate">Hyderabad Super Sixes</h5>
                  </div>
                  <div>
                    <span className="px-1.5 py-0.5 bg-[#BFF367]/10 text-[#BFF367] rounded text-[7px] font-black uppercase tracking-wider">ACTIVE</span>
                    <h5 className="text-[11px] font-bold text-white mt-1.5 truncate">Telangana Corporate Cup</h5>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
