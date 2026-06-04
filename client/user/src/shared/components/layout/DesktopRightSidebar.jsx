import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  Clock, Calendar, MapPin, Star, UserPlus, UserMinus, Trophy, ArrowRight, 
  Ticket, IndianRupee, Sparkles, Info, Plus, Users, Zap, Share2, 
  DollarSign, Activity, CheckCircle2, Wallet, ArrowUpRight, ChevronRight, ChevronLeft, Search
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { Liquid } from "../ui/button-1";
import SearchTurf from "@components/search/SearchTurf.jsx";

const LIQUID_COLORS = {
  color1: '#FFFFFF',
  color2: '#1E10C5',
  color3: '#9089E2',
  color4: '#FCFCFE',
  color5: '#F9F9FD',
  color6: '#B2B8E7',
  color7: '#0E2DCB',
  color8: '#0017E9',
  color9: '#4743EF',
  color10: '#7D7BF4',
  color11: '#0B06FC',
  color12: '#C5C1EA',
  color13: '#1403DE',
  color14: '#B6BAF6',
  color15: '#C1BEEB',
  color16: '#290ECB',
  color17: '#3F4CC0',
};
const TOP_5_LIVE_MATCHES = [
  {
    id: 1,
    venue: "Wankhede Stadium",
    type: "Cricket (T20)",
    crr: "7.8",
    target: "154",
    team1: { name: "Mumbai Indians", short: "MI", bg: "bg-[#111]", text: "text-white", score: "153/4", overs: "(20.0)" },
    team2: { name: "Chennai S.K.", short: "CSK", bg: "bg-yellow-500/20", text: "text-yellow-500", score: "112/5", overs: "(14.2)" },
  },
  {
    id: 2,
    venue: "Eden Gardens",
    type: "Cricket (T20)",
    crr: "9.2",
    target: "201",
    team1: { name: "Kolkata K.R.", short: "KKR", bg: "bg-[#3B215D]", text: "text-purple-300", score: "200/6", overs: "(20.0)" },
    team2: { name: "Royal Challengers", short: "RCB", bg: "bg-[#E83441]/20", text: "text-[#E83441]", score: "45/1", overs: "(4.5)" },
  },
  {
    id: 3,
    venue: "Chinnaswamy",
    type: "Cricket (T20)",
    crr: "6.5",
    target: "120",
    team1: { name: "Delhi Capitals", short: "DC", bg: "bg-[#004C93]", text: "text-blue-300", score: "119/8", overs: "(20.0)" },
    team2: { name: "Sunrisers Hyd", short: "SRH", bg: "bg-[#F26522]/20", text: "text-orange-500", score: "15/0", overs: "(2.1)" },
  },
  {
    id: 4,
    venue: "Narendra Modi St.",
    type: "Cricket (T20)",
    crr: "10.1",
    target: "215",
    team1: { name: "Gujarat Titans", short: "GT", bg: "bg-[#1B2133]", text: "text-teal-300", score: "214/4", overs: "(20.0)" },
    team2: { name: "Punjab Kings", short: "PBKS", bg: "bg-[#ED1B24]/20", text: "text-red-500", score: "55/3", overs: "(5.2)" },
  },
  {
    id: 5,
    venue: "Sawai Mansingh",
    type: "Cricket (T20)",
    crr: "8.4",
    target: "165",
    team1: { name: "Rajasthan Royals", short: "RR", bg: "bg-[#EA1A85]/20", text: "text-pink-500", score: "164/7", overs: "(20.0)" },
    team2: { name: "Lucknow S.G.", short: "LSG", bg: "bg-[#1795D4]/20", text: "text-cyan-400", score: "90/2", overs: "(10.4)" },
  },
];

export default function DesktopRightSidebar({ isRightDrawerOpen, setIsRightDrawerOpen }) {
  const location = useLocation();
  const [minRating, setMinRating] = useState(0.0);
  const [maxRating, setMaxRating] = useState(5.0);
  const dispatch = useDispatch();
  const { gateInteraction } = useLoginOnDemand();
  const { isLoggedIn, user, followingIds = [] } = useSelector((state) => state.auth);

  const nearbyScrollRef = useRef(null);
  const liveMatchesScrollRef = useRef(null);

  const scrollNearby = (direction) => {
    if (nearbyScrollRef.current) {
      const scrollAmount = 145 + 12; // card width (145px) + gap (12px = gap-3)
      nearbyScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollLiveMatches = (direction) => {
    if (liveMatchesScrollRef.current) {
      const scrollAmount = liveMatchesScrollRef.current.clientWidth;
      liveMatchesScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Parse path context
  const isHome = location.pathname === "/" || location.pathname === "/community";
  const isVenuePage = location.pathname.startsWith("/venues") || location.pathname.startsWith("/venue/");
  const isPlayerPage = location.pathname.startsWith("/players") || location.pathname.startsWith("/profile");
  const isTournamentPage = location.pathname.startsWith("/leaderboard") || location.pathname.startsWith("/match");
  const isMessagesPage = location.pathname.startsWith("/messages");

  // Local states for real-time fetched data
  const [bookings, setBookings] = useState([]);
  const [isInviteHovered, setIsInviteHovered] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [currentLiveMatchIndex, setCurrentLiveMatchIndex] = useState(0);
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

      <aside className={`fixed top-[77px] right-0 bottom-0 w-[440px] bg-[#050505] border-l border-white/5 p-6 overflow-y-auto no-scrollbar transition-transform duration-300 z-[74] xl:z-[60] xl:translate-x-0 xl:block ${isRightDrawerOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}`}>
        <div className="space-y-6">
          {/* ── HOME & GENERAL PORTAL VIEW WIDGETS ── */}
          {isHome && (
            <>
              {/* Host Your Venues CTA */}
              <Link to="/host" className="relative block overflow-hidden rounded-2xl h-[140px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] group border border-white/[0.05] hover:border-[#BFF367]/50 transition-all duration-300">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                  style={{ backgroundImage: "url('/host-venue-bg-custom-2.png')" }}
                />
                
                {/* Content Container (Left 40%) */}
                <div className="relative z-10 w-[45%] h-full p-4 flex flex-col justify-center gap-1.5 pl-5">
                  <h3 className="text-[16px] leading-tight font-black text-white uppercase drop-shadow-lg">
                    Host Your Venue
                  </h3>
                  <p className="text-[9px] font-medium text-white/90 leading-snug drop-shadow-md">
                    Partner with us to list your turf and manage bookings seamlessly.
                  </p>
                </div>
              </Link>

              {/* Live Now */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Live Now</h4>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => scrollLiveMatches('left')}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-[#E83441]/20 hover:border-[#E83441]/50 text-white hover:text-[#E83441] transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={() => scrollLiveMatches('right')}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-[#E83441]/20 hover:border-[#E83441]/50 text-white hover:text-[#E83441] transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={liveMatchesScrollRef}
                  className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
                >
                  {TOP_5_LIVE_MATCHES.map((match) => (
                    <Link key={match.id} to={`/match/live/${match.id}`} className="min-w-full shrink-0 snap-start block bg-gradient-to-br from-[#E83441]/20 via-[#0B0B0C] to-[#0B0B0C] border border-[#E83441]/20 rounded-xl p-4 hover:border-[#E83441]/40 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm group relative">
                      {/* Top section: Status & Info */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          <div className="bg-[#E83441] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] tracking-widest shadow-[0_0_10px_rgba(232,52,65,0.4)]">
                            LIVE
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-white leading-none">{match.venue}</h5>
                            <p className="text-[10px] text-white/50 mt-1 font-medium">{match.type}</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-medium text-right leading-tight">
                          <span className="text-[#BFF367]">CRR: {match.crr}</span><br/>
                          <span className="text-white/40 text-[9px]">Target: {match.target}</span>
                        </div>
                      </div>
                      
                      {/* Bottom section: Scoreboard */}
                      <div className="flex flex-col gap-2.5 relative pr-6">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${match.team1.bg} border border-white/10 flex items-center justify-center shrink-0`}>
                              <span className={`text-[10px] font-black ${match.team1.text}`}>{match.team1.short}</span>
                            </div>
                            <span className="text-[11px] font-bold text-white/60">{match.team1.name}</span>
                          </div>
                          <div className="text-[14px] font-black text-white/60 font-mono tracking-tight">
                            {match.team1.score} <span className="text-[9px] font-medium text-white/40 ml-0.5">{match.team1.overs}</span>
                          </div>
                        </div>
                        
                        {/* Team 2 (Batting) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${match.team2.bg} border border-white/10 flex items-center justify-center shrink-0`}>
                              <span className={`text-[10px] font-black ${match.team2.text}`}>{match.team2.short}</span>
                            </div>
                            <span className="text-[11px] font-bold text-white">{match.team2.name}</span>
                          </div>
                          <div className="text-[14px] font-black text-[#BFF367] font-mono tracking-tight">
                            {match.team2.score} <span className="text-[9px] font-medium text-[#BFF367]/60 ml-0.5">{match.team2.overs}</span>
                          </div>
                        </div>
                        
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/10 transition-all">
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ad Space */}
              <div className="relative block rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] group cursor-pointer h-[126px] bg-[#0B0B0C] border border-white/[0.05]">
                <img 
                  src="/ad_image.png" 
                  alt="Advertisement" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>



              {/* Tournaments Section */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Tournament</h4>
                </div>
                
                <Link to="/coming-soon" className="relative block w-full h-[120px] rounded-xl overflow-hidden group border border-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {/* Background Image */}
                  <img 
                    src="/tournament-bg-custom.png" 
                    alt="Tournament Background" 
                    className="absolute top-0 right-0 h-full w-auto max-w-none object-cover" 
                  />
                  
                  {/* Left-to-right fade gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#030114] via-[#030114]/90 to-transparent w-[75%]" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                  
                  {/* Content Container */}
                  <div className="relative z-10 w-full h-full p-4 flex flex-col justify-center">
                    <h3 className="text-[20px] font-black text-white leading-tight uppercase group-hover:text-[#BFF367] transition-colors">Kridaz Premier League</h3>
                    <p className="text-[12px] font-medium text-white/50 tracking-widest uppercase mt-1">COMING SOON</p>
                  </div>
                </Link>
              </div>

              {/* 8. Upcoming Bookings (Moved Above Players) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Upcoming Bookings</h4>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => scrollNearby('left')}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#BFF367]/50 text-white hover:text-[#BFF367] transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={() => scrollNearby('right')}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#BFF367]/50 text-white hover:text-[#BFF367] transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div 
                  ref={nearbyScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
                >
                  {isLoggedIn && bookings.length > 0 ? (
                    bookings.map((booking, idx) => {
                      const dateObj = new Date(booking.date || booking.timeSlot?.date || Date.now());
                      const dayStr = dateObj.getDate().toString().padStart(2, '0');
                      const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();

                      return (
                        <Link key={booking._id || booking.id} to={`/booking-pass/${booking.id || booking._id}`} className="min-w-[145px] w-[145px] flex flex-col rounded-xl border border-gray-600/60 bg-[#070708] overflow-hidden group shrink-0 shadow-sm transition-all hover:border-gray-500">
                          {/* Image Section */}
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-white/5">
                            <img 
                              src={booking.turf?.images?.[0] || "/default-turf.jpg"} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              onError={(e) => e.target.src = "https://images.unsplash.com/photo-1518605368461-1ee7111d4e7a?auto=format&fit=crop&q=80"} 
                              alt={booking.turf?.name}
                            />
                            {/* Pink Banner */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#E81E73] p-1 px-2">
                              <p className="text-[9px] font-bold text-white text-center">Booked • {booking.timeSlot?.formattedStartTime || "Slot"}</p>
                            </div>
                          </div>
                          
                          {/* Text Section */}
                          <div className="flex gap-2 p-2">
                            {/* Date Box */}
                            <div className="bg-[#2A2D34] rounded-lg p-1 w-[36px] h-[40px] flex flex-col items-center justify-center shrink-0">
                              <span className="text-[11px] font-black text-white leading-none">{dayStr}</span>
                              <span className="text-[7px] font-bold text-white/70 leading-none mt-1 uppercase">{monthStr}</span>
                            </div>
                            
                            {/* Text Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h5 className="text-[10px] font-bold text-white leading-tight group-hover:text-[#BFF367] transition-colors line-clamp-2">
                                {booking.turf?.name}
                              </h5>
                              <p className="text-[8px] text-white/50 truncate mt-0.5 font-medium">{booking.turf?.city || "Confirmed"}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-white/30 italic text-center w-full py-2">
                      {isLoggedIn ? "No upcoming matches booked" : "Please log in to view your bookings"}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested Players (Moved Below Upcoming Bookings) */}
              <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Players You May Know</h4>
                  <Link to="/players" className="text-[11px] font-bold text-[#BFF367] hover:underline">View All</Link>
                </div>
                
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                  {loadingPlayers ? (
                    <div className="text-[10px] text-white/40 font-medium py-3 text-center w-full">Loading players...</div>
                  ) : suggestedPlayers.length > 0 ? (
                    suggestedPlayers.slice(0, 4).map((player) => {
                      const playerId = player._id || player.id;
                      const isFollowed = followingIds.includes(playerId);
                      const mutualCount = player.mutualFriendsCount || player.mutualFriends || 0;
                      return (
                        <div key={playerId} className="flex flex-col items-center min-w-[70px] gap-1">
                          <div className="relative">
                            <Link to={`/profile/${playerId}`} className="block relative group cursor-pointer">
                              <img 
                                src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0 bg-white/5 border border-white/5 group-hover:border-[#BFF367]/50 transition-colors" 
                                alt={player.name}
                              />
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); handleFollowToggleLocal(player); }}
                              className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full transition-all border-[1.5px] border-[#0B0B0C] z-10 ${isFollowed ? "bg-[#2A2D34] text-white/40 hover:text-white" : "bg-[#BFF367] text-black hover:scale-110 active:scale-95 shadow-[0_0_12px_rgba(191,243,103,0.2)]"}`}
                            >
                              {isFollowed ? <UserMinus size={8} /> : <Plus size={9} strokeWidth={4} />}
                            </button>
                          </div>
                          <Link to={`/profile/${playerId}`} className="text-center mt-0.5 group">
                            <h5 className="text-[11px] md:text-[12px] font-bold text-white truncate max-w-[70px] group-hover:text-[#BFF367] transition-colors">{player.name.split(' ')[0]}</h5>
                            <span className="text-[8px] text-white/40 font-medium block mt-0.5">
                              {mutualCount > 0 ? `${mutualCount} mutual` : "No mutual"}
                            </span>
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-white/30 italic text-center w-full py-2">No suggested players found</div>
                  )}
                </div>
              </div>

              {/* Invite & Earn Strip (Moved to Bottom) */}
              <div className="w-full mt-4 flex justify-center">
                <Link
                  to="/wallet"
                  className="relative inline-block w-full h-[3.5em] group dark:bg-black bg-white dark:border-white border-black border rounded-xl overflow-visible">
                  
                  {/* Inner container */}
                  <div className="relative w-full h-full overflow-hidden rounded-xl">
                    <span className="absolute inset-0 rounded-xl bg-[#d9d9d9]"></span>
                    <span className="absolute inset-0 rounded-xl bg-black"></span>
                    <Liquid isHovered={isInviteHovered} colors={LIQUID_COLORS} />
                    
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`absolute inset-0 rounded-xl border-solid border-[3px] border-gradient-to-b from-transparent to-white mix-blend-overlay filter ${i <= 2 ? 'blur-[3px]' : i === 3 ? 'blur-[5px]' : 'blur-[4px]'}`}></span>
                    ))}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70.8%] h-[42.85%] rounded-xl filter blur-[15px] bg-[#006]"></span>
                  </div>
                  
                  {/* Button Content */}
                  <div
                    className="absolute inset-0 rounded-xl bg-transparent cursor-pointer flex items-center justify-between px-5"
                    onMouseEnter={() => setIsInviteHovered(true)}
                    onMouseLeave={() => setIsInviteHovered(false)}>
                    <span className="flex items-center gap-3">
                      <Share2 size={18} className="group-hover:text-yellow-400 text-white flex-shrink-0 transition-colors" />
                      <span className="group-hover:text-yellow-400 text-white text-[14px] font-black tracking-wide whitespace-nowrap transition-colors uppercase">Invite & Earn</span>
                    </span>
                    <span className="group-hover:text-yellow-400 text-white/80 font-bold text-[10px] uppercase tracking-widest transition-colors">Get ₹100 / Friend</span>
                  </div>
                </Link>
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
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 shadow-md">
                  <SearchTurf onSearch={() => {}} />

                  {/* Advanced Filters */}
                  <div className="mt-8 space-y-8 border-t border-white/[0.05] pt-6">
                    
                    {/* Slot Availability */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Slot Availability</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Show Only Available Venues</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Show Only Favorites</span>
                        </label>
                      </div>
                    </div>

                    {/* Slot Timings */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Slot Timings</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Morning (6:00 AM - 11:00 AM)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Afternoon (11:00 AM - 5:00 PM)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Evening (5:00 PM - 10:00 PM)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Late Night (After 10 PM)</span>
                        </label>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Star Rating: {minRating.toFixed(1)} - {maxRating.toFixed(1)}</h5>
                      <div className="space-y-5 px-1 pt-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            <span>Min Rating: {minRating.toFixed(1)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="5" step="0.5" 
                            value={minRating}
                            onChange={(e) => setMinRating(parseFloat(e.target.value))}
                            style={{ background: `linear-gradient(to right, #BFF367 ${(minRating / 5) * 100}%, #1F1F1F ${(minRating / 5) * 100}%)` }}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BFF367]" 
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            <span>Max Rating: {maxRating.toFixed(1)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="5" step="0.5" 
                            value={maxRating}
                            onChange={(e) => setMaxRating(parseFloat(e.target.value))}
                            style={{ background: `linear-gradient(to right, #BFF367 ${(maxRating / 5) * 100}%, #1F1F1F ${(maxRating / 5) * 100}%)` }}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BFF367]" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Price</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Less than ₹5000</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" defaultChecked className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">₹5000 and above</span>
                        </label>
                      </div>
                    </div>

                  </div>
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
