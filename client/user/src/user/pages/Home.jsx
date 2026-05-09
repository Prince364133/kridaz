import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import useTurfData from "../hooks/useTurfData";
import { Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, User, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award, CheckCircle, Heart, MessageCircle, MessageSquare, Share2, Info, Check, X, RefreshCcw, Timer, Zap, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { AdBannerSection } from "../components/Marketing/AdBannerSection";
import { VideoSection } from "../components/Marketing/VideoSection";
import BlogSection from "../components/Blogs/BlogSection";
import SearchPlayers from "../components/search/SearchPlayers";
import SearchTurf from "../components/search/SearchTurf";
import InterestsModal from "../components/modals/InterestsModal";
import { updateUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const PRI = "#84CC16";
const S2 = "#1A1A1A";
const BDR = "#2A2A2A";

const stats = [
  { value: "500+", label: "Venues" },
  { value: "50K+", label: "Players" },
  { value: "1M+", label: "Bookings" },
  { value: "25+", label: "Cities" },
];

const socialPosts = [
  { image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80", likes: "1.2k", comments: "84" },
  { image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", likes: "2.5k", comments: "120" },
  { image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80", likes: "890", comments: "45" },
  { image: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&q=80", likes: "1.8k", comments: "62" },
  { image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80", likes: "3.1k", comments: "156" },
];


const highlights = [
  { image: "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200", span: "col-span-3" }, // Stadium
  { image: "https://images.pexels.com/photos/159515/football-american-football-runner-player-159515.jpeg?auto=compress&cs=tinysrgb&w=800", span: "col-span-3" }, // Football Action
  { image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80", span: "col-span-2" }, // Cricket/Turf
  { image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80", span: "col-span-2" }, // Basketball/Football
  { image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80", span: "col-span-2" }, // Tennis
];

const comparisonFeatures = [
  { name: "Ground Booking", others: "Basic Search", bms: "Ultra-Fast Booking", status: "essential" },
  { name: "Matchmaking", others: "WhatsApp Groups", bms: "AI Skill Matching", status: "unique" },
  { name: "Social Arena", others: "Not Available", bms: "Live Feed & Chats", status: "unique" },
  { name: "Voice Rooms", others: "Not Available", bms: "In-Game Comms", status: "unique" },
  { name: "Pro Coaches", others: "Manual Search", bms: "One-Tap Hiring", status: "premium" },
  { name: "Live Updates", others: "Delayed Sync", bms: "Real-Time Slots", status: "essential" },
  { name: "Player Ratings", others: "No Tracking", bms: "Career Stats", status: "premium" },
];

const features = [
  { img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80", icon: Calendar, title: "Sportz Booking", desc: "Search and book premium venues instantly with real-time confirmation." },
  { img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80", icon: Users, title: "Find Players Near You", desc: "Match with local athletes and build your ultimate squad." },
  { img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=80", icon: Award, title: "Pro Coaches", desc: "Train with professional coaches to elevate your game." },
  { img: "https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=600&q=80", icon: Shield, title: "Hire Umpires", desc: "Book certified officials for fair and competitive matches." },
  { img: "https://images.unsplash.com/photo-1518605363189-cdb72b0e6bf3?w=600&q=80", icon: Activity, title: "Live Match Scoring", desc: "Record and broadcast live scores for your local tournaments." },
  { img: "https://images.unsplash.com/photo-1529661161859-45041a7d65bd?w=600&q=80", icon: Trophy, title: "Social Community", desc: "Join sport tribes, share your achievements, and connect." },
];



// player skill levels based on booking count
const getLevel = (count = 0) => {
  if (count >= 100) return { label: "LEGEND", color: "#F472B6" };
  if (count >= 50) return { label: "ELITE", color: "#818CF8" };
  if (count >= 20) return { label: "PRO", color: PRI };
  return { label: "BEGINNER", color: "#94A3B8" };
};

// initials avatar color
const avatarColors = ["#1a3300", "#001a33", "#330033", "#331a00", "#003333", "#1a0033"];
const avatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || "#1a1a1a";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const [showInterests, setShowInterests] = useState(false);
  const [activeTab, setActiveTab] = useState("venues");
  const [players, setPlayers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [turfFilters, setTurfFilters] = useState({});
  const [playerFilters, setPlayerFilters] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const { turfs, loading: turfLoading, error } = useTurfData(turfFilters);
  const [locationStatus, setLocationStatus] = useState("detecting");
  const [marketing, setMarketing] = useState({ banners: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState({});
  const [realSocialPosts, setRealSocialPosts] = useState([]);
  const [hostedGames, setHostedGames] = useState([]);
  const [hostedGamesLoading, setHostedGamesLoading] = useState(true);
  const [selectedGameSport, setSelectedGameSport] = useState("ALL SPORTS");

  useEffect(() => {
    if (isLoggedIn && role === 'user' && user && (!user.sportTypes || user.sportTypes.length === 0)) {
      setShowInterests(true);
    }
  }, [isLoggedIn, role, user]);

  const detectLocation = () => {
    setLocationStatus("detecting");
    if (!navigator.geolocation) {
      fallbackToIPLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }
        setUserLocation({ lat, lng, city, state });
        setLocationStatus("granted");
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        fallbackToIPLocation();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const fallbackToIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setUserLocation({ lat: data.latitude, lng: data.longitude, city: data.city, state: data.region });
        setLocationStatus("granted");
      } else {
        setLocationStatus("denied");
      }
    } catch (error) {
      setLocationStatus("denied");
    }
  };

  // useEffect(() => {
  //   detectLocation();
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch features and marketing in parallel
        const results = await Promise.allSettled([
          axiosInstance.get("/api/features"),
          axiosInstance.get("/api/features/marketing"),
          axiosInstance.get("/api/user/community")
        ]);

        const [venuesRes, marketingRes, communityRes] = results;

        if (marketingRes.status === 'fulfilled') {
          setMarketing(marketingRes.value.data || { banners: [], videos: [] });
        }
        
        if (venuesRes.status === 'fulfilled') {
          setFeatureFlags(venuesRes.value.data?.flagsMap || {});
        }

        if (communityRes.status === 'fulfilled' && communityRes.value.data?.posts) {
          const latestPosts = communityRes.value.data.posts.slice(0, 10);
          setRealSocialPosts(latestPosts);
        }
      } catch (error) {
        console.error("Home.jsx: Critical error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const params = {
          ...playerFilters,
          sortBy: 'newest',
        };
        const res = await axiosInstance.get("/api/user/players", { params });
        setPlayers(res.data.players || []);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    const fetchFollowingStatus = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await axiosInstance.get("/api/user/players/network");
        const ids = (response.data.following || []).filter(p => p).map(p => p._id);
        setFollowingIds(ids);
      } catch (error) {
        console.error("Error fetching network:", error);
      }
    };

    fetchPlayers();
    fetchFollowingStatus();
  }, [playerFilters, userLocation, isLoggedIn]);

  useEffect(() => {
    const fetchHostedGames = async () => {
      try {
        setHostedGamesLoading(true);
        let url = "/api/hosted-game/list";
        const params = {};
        if (user?.city) params.city = user.city;
        if (selectedGameSport !== "ALL SPORTS") params.gameType = selectedGameSport;
        
        const res = await axiosInstance.get(url, { params });
        setHostedGames(res.data.games || []);
      } catch (err) {
        console.error("Error fetching hosted games:", err);
      } finally {
        setHostedGamesLoading(false);
      }
    };
    fetchHostedGames();
  }, [user?.city, selectedGameSport]);

  const handleTurfSearch = (filters) => {
    setTurfFilters(filters);
  };

  const handlePlayerSearch = (filters) => {
    setPlayerFilters(filters);
  };

  const handleFollowToggle = async (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    
    gateInteraction(async () => {
      const isFollowing = followingIds.includes(p._id);
      try {
        const endpoint = `/api/user/players/${p._id}/${isFollowing ? 'unfollow' : 'follow'}`;
        await axiosInstance.post(endpoint);
        
        if (isFollowing) {
          setFollowingIds(prev => prev.filter(id => id !== p._id));
          toast.success(`Unfollowed ${p.name}`);
        } else {
          setFollowingIds(prev => [...prev, p._id]);
          toast.success(`Following ${p.name}`);
        }
      } catch (err) {
        console.error("Follow toggle failed:", err);
        toast.error("Failed to update follow status");
      }
    }, { 
      title: "Join the Network", 
      message: "Connect with players, build your squad, and stay updated on the latest games. Sign in to follow athletes." 
    });
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#000" }}>

      {/* ── HERO ── */}
      {/* ── HERO ── */}
      <section className="relative lg:min-h-screen flex items-start pt-24 lg:pt-5 pb-24 overflow-hidden">
        {/* Further Enhanced Cinematic Background */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[75%] z-0 pointer-events-none overflow-hidden">
          <div className="relative h-full w-full">
            <img
              src="/hero%20image.png"
              alt="Hero Background"
              className="absolute inset-0 w-full h-full object-cover object-center lg:object-[right_15%] opacity-70 brightness-[75%] transform scale-110 transition-transform duration-1000"
            />
            {/* Blending Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent lg:from-black lg:via-black/30 lg:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          </div>
        </div>

        <div className="absolute inset-0 opacity-[0.03] z-1"
          style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

        <div className="relative w-full px-4 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center pt-4 md:pt-0">
          <div className="space-y-4 lg:space-y-6 relative z-10">
            <div>
              <h1 className="font-display leading-[0.9] lg:leading-[0.85] tracking-tighter uppercase" style={{ fontSize: "clamp(2.5rem,10vw,6.5rem)" }}>
                More Than <span style={{ color: PRI }}>Booking.</span><br />
                Where Players<br />Belong.
              </h1>
              <p className="font-script text-xl lg:text-2xl mt-2 lg:mt-3" style={{ color: PRI }}>where champions play</p>
            </div>
            <p className="text-sm lg:text-xl opacity-70 max-w-xl leading-relaxed mb-4 lg:mb-10">
              Discover premium sports venues, book your slot instantly, and connect with players across India.
            </p>

            <Link
              to={isLoggedIn ? "/turfs" : "/signup"}
              className="block w-fit group mb-4 lg:mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-[#84CC16] text-black px-8 py-3.5 rounded-full font-bold group-hover:scale-105 transition-all text-sm lg:text-base shadow-[0_0_20px_rgba(132,204,22,0.4)]">
                Book Now <ArrowRight size={18} />
              </div>
            </Link>
          </div>

          <div className="relative hidden lg:block h-[600px]">
            {/* Arena Gallery at bottom */}
            <div className="absolute bottom-0 right-0 w-full flex items-center justify-end gap-4 z-20 pb-4 pr-12">
              {[
                { img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=700&q=80", label: "Football Ground", cls: "w-56 h-36 opacity-80" },
                { img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=700&q=80", label: "Cricket Campus", cls: "w-72 h-52 z-10" },
                { img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=700&q=80", label: "Badminton Hub", cls: "w-56 h-36 opacity-80" },
              ].map(c => (
                <Link
                  key={c.label}
                  to="/arenas"
                  className={`relative ${c.cls} rounded-2xl overflow-hidden border shadow-2xl transition-all hover:scale-105 hover:z-20 hover:opacity-100 duration-500 group flex-shrink-0`}
                  style={{ borderColor: BDR }}
                >
                  <img src={c.img} alt={c.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }} />
                  <p className="absolute bottom-3 left-3 font-display text-lg uppercase tracking-tighter">{c.label}</p>
                </Link>
              ))}
            </div>

            {/* 1M+ Bookings Card - Moved to Top Right Corner */}
            <div className="absolute top-12 right-12 rounded-2xl p-4 border z-20"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", borderColor: "rgba(132,204,22,0.25)" }}>
              <p className="font-display text-2xl text-primary leading-none">1M+</p>
              <p className="text-[10px] uppercase tracking-wider mt-1 opacity-60" style={{ color: "#fff" }}>Bookings Made</p>
            </div>
          </div>
        </div>
      </section>


      {/* ── STATS ── */}
      <section className="border-y" style={{ borderColor: "#1A1A1A", backgroundColor: "#0A0A0A" }}>
        <div className="w-full px-4 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-0 divide-[#1A1A1A] md:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-1 md:px-8 text-center flex flex-col justify-center overflow-hidden group">
              <p className="font-display text-xl sm:text-3xl lg:text-5xl leading-none tracking-tighter group-hover:text-white transition-colors" style={{ color: PRI }}>{s.value}</p>
              <p className="font-mono text-[6px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.3em] mt-1 sm:mt-2 text-gray-500 group-hover:text-primary transition-colors">{s.label}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── FIND YOUR ARENA ── */}
      <section className="py-6 lg:py-12 px-6 md:px-10 w-full">
        <div className="text-center mb-6 lg:mb-10">
          <h2 className="font-display text-6xl md:text-7xl leading-none uppercase">
            Find Your <span style={{ color: PRI }}>Arena</span>
          </h2>
          <p className="font-script text-xl mt-2" style={{ color: PRI }}>where champions play</p>
        </div>

        {/* Search & Tabs Combined Row */}
        <div className="flex flex-col gap-8 mb-16 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-2 p-1 rounded-full bg-[#1A1A1A] border border-white/5 overflow-x-auto no-scrollbar">
              {[{ key: "venues", label: "🏟 VENUES" }, { key: "marketplace", label: "🛒 MARKETPLACE" }].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
                  className={`px-8 py-2.5 rounded-full font-bold text-xs transition-all duration-300 uppercase tracking-widest ${activeTab === tab.key ? "bg-[#84CC16] text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]" : "text-gray-500 hover:text-white"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
                <button 
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] hover:text-[#84CC16] transition-colors"
                >
                  {userLocation?.city ? `${userLocation.city}, ${userLocation.state}` : "SELECT LOCATION"}
                </button>
          </div>

          <div className="w-full animate-fade-in relative z-20">
            {activeTab === "venues" ? (
              <SearchTurf onSearch={handleTurfSearch} userLocation={userLocation} />
            ) : (
              <div className="w-full py-20 px-6 md:px-10 rounded-[40px] border border-white/5 bg-[#0a0a0a] flex flex-col items-center justify-center text-center overflow-hidden relative group animate-fade-in">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#84CC16]/10 blur-[120px] rounded-full pointer-events-none" />

                <ShoppingBag size={48} className="text-gray-600 mb-6 group-hover:text-[#84CC16] transition-colors duration-500" />
                <h3 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-tight">
                  Marketplace <br />
                  <span style={{ color: PRI }}>Coming Soon</span>
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-6 max-w-md mx-auto">
                  We're building the ultimate destination for sports gear, equipment, and exclusive TurfSpot merchandise.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Venue grid */}
        {loading || turfLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border animate-pulse" style={{ height: 320, backgroundColor: "#111", borderColor: BDR }} />
            ))}
          </div>
        ) : (error || (turfs || []).length === 0) ? (
          <div className="text-center py-24 animate-fadeIn">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-600" />
            </div>
            <p className="font-display text-3xl mb-3 uppercase tracking-tight">Venues Not Found</p>
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-8">Try adjusting your search or filters</p>
            <button
              onClick={() => setTurfFilters({ searchTerm: "", city: "", state: "" })}
              className="px-8 py-3 bg-[#84CC16] text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]"
            >
              View All Venues
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(turfs || []).slice(0, 8).map((t, i) => (
              <Link to={`/turf/${t._id}`} key={t._id} className="bms-card group flex flex-col no-underline bg-[#111] rounded-2xl border border-[#2a2a2a] overflow-hidden">
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img src={t.image || "/banner-1.png"}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/banner-1.png"; }}
                    alt={t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {i === 0 && <span className="absolute top-3 left-3 bg-[#84CC16] text-black text-xs font-bold px-2 py-1 rounded">Featured</span>}
                </div>
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <h3 className="font-display text-base uppercase tracking-wide text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">{t.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#888" }}>
                      <MapPin size={11} style={{ color: PRI }} />
                      <span className="truncate">{t.location || t.city || "—"}</span>
                    </div>
                    {t.distance && (
                      <span className="text-[10px] font-black text-[#84CC16] uppercase tracking-wider bg-[#84CC16]/5 px-1.5 py-0.5 rounded">
                        {t.distance} km
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-semibold">{t.avgRating || "4.5"}</span>
                    </div>
                    <span className="bg-[#1a1a1a] text-white text-[10px] px-2 py-0.5 rounded border border-[#2a2a2a] uppercase">{t.sportTypes?.[0] || "Sport"}</span>
                  </div>
                  {t.pricePerHour && (
                    <p className="text-xs font-bold" style={{ color: PRI }}>₹{t.pricePerHour}/hr</p>
                  )}
                  <div className="mt-auto pt-3">
                    <span className="block w-full text-center font-bold text-sm py-2.5 rounded-full text-black"
                      style={{ backgroundColor: PRI }}>Book Now</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-6 lg:mt-10">
          <Link to="/turfs" className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-full border transition-all hover:border-[#84CC16] hover:text-[#84CC16]"
            style={{ borderColor: BDR, color: "#888" }}>
            View All Venues <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FIND PLAYERS NEAR YOU ── */}
      <section className="py-6 lg:py-12 px-6 md:px-10" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-2xl min-[375px]:text-3xl md:text-4xl lg:text-5xl tracking-tight uppercase leading-none">
                Find Players <span style={{ color: PRI }}>Near You</span>
              </h2>
            </div>
            <Link to="/players" className="text-sm font-bold flex items-center gap-2 hover:text-[#84CC16] transition-colors" style={{ color: "#888" }}>
              View All Players <ChevronRight size={16} />
            </Link>
          </div>

          {/* Player cards */}
          {loading ? (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pt-8 pb-8 mt-2 no-scrollbar scroll-smooth">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shrink-0 w-[180px] md:w-[220px] h-[300px] md:h-[360px] rounded-[32px] border border-white/5 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#888" }}>
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-display text-2xl">No Players Yet</p>
              <p className="text-sm mt-1">Be the first to join the community!</p>
              <Link to="/signup" className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full"
                style={{ backgroundColor: PRI }}>Join Now</Link>
            </div>
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pt-8 pb-8 mt-2 no-scrollbar scroll-smooth px-0 md:px-2">
              {players.map(p => {
                const initials = p.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
                const isFollowing = followingIds.includes(p._id);
                
                return (
                  <div
                    key={p._id}
                    className="shrink-0 w-[180px] md:w-[220px] group transition-all duration-500"
                  >
                    <div className="relative bg-[#111] rounded-[32px] border border-white/5 overflow-hidden hover:border-[#84CC16]/30 transition-all duration-500 h-full flex flex-col">
                      {/* Card Image Section */}
                      <Link to={`/profile/${p._id}`} className="relative aspect-square overflow-hidden block">
                        <div className="w-full h-full bg-[#84CC16]/5 flex items-center justify-center">
                          {p.profilePicture ? (
                            <img 
                              src={p.profilePicture} 
                              alt={p.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="relative z-10 flex items-center justify-center w-full h-full bg-[#1a1a1a]"
                            style={{ display: p.profilePicture ? 'none' : 'flex' }}
                          >
                            <span className="text-[#84CC16] font-black text-4xl tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                              {initials}
                            </span>
                          </div>
                        </div>

                        {/* Top Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Dismiss Button (Like photo) */}
                        <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all z-20">
                          <X size={14} />
                        </button>
                      </Link>

                      {/* Card Info Section */}
                      <div className="p-3.5 flex flex-col flex-grow">
                        <Link to={`/profile/${p._id}`} className="block mb-0.5">
                          <h3 className="text-white font-bold text-[13px] md:text-[15px] tracking-tight truncate group-hover:text-[#84CC16] transition-colors">
                            {p.name || "Player"}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-1.5 text-white/40 mb-3.5">
                          <MapPin size={9} className="text-[#84CC16]" />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate">
                            {p.city || "Nearby"}
                          </span>
                        </div>

                        {/* Follow Button */}
                        <button 
                          onClick={(e) => handleFollowToggle(e, p)}
                          className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 mt-auto
                            ${isFollowing 
                              ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10' 
                              : 'bg-[#84CC16]/10 border border-[#84CC16]/20 text-[#84CC16] hover:bg-[#84CC16] hover:text-black hover:scale-[1.02]'}`}
                        >
                          {isFollowing ? (
                            <>
                              <CheckCircle size={14} /> Following
                            </>
                          ) : (
                            <>
                              <Plus size={14} /> Follow
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>



      {/* ── AD BANNERS ── */}
      <AdBannerSection banners={marketing.banners} />

      {/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}
      {featureFlags['join_games'] && (
        <section className="py-6 lg:py-12 px-6 md:px-10" style={{ backgroundColor: "#0A0A0A" }}>
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 lg:mb-8">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-7xl lg:text-8xl uppercase leading-none text-white flex items-center gap-2 md:gap-3">
                  JOIN <span style={{ color: PRI }}>GAMES NEAR YOU</span>
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest mt-2" style={{ color: "#888" }}>
                  No team? No problem. Find your people. Build your network. Play together.
                </p>
              </div>
              <Link to="/join-games" className="text-sm font-bold flex items-center gap-2 hover:text-[#84CC16] transition-colors" style={{ color: "#888" }}>
                View More Games <ChevronRight size={16} />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {["ALL SPORTS", "BADMINTON", "CRICKET", "FOOTBALL", "TENNIS", "PICKLEBALL"].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setSelectedGameSport(tab)}
                  className="px-6 py-2 rounded-full font-bold text-xs shrink-0 transition-colors border"
                  style={selectedGameSport === tab ? { backgroundColor: PRI, color: "#000", borderColor: PRI } : { backgroundColor: "transparent", color: "#888", borderColor: BDR }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Game Cards */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 md:pb-0">
              {hostedGamesLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[75vw] md:min-w-0 snap-center h-[360px] rounded-3xl bg-neutral-900 border animate-pulse" style={{ borderColor: BDR }} />
                ))
              ) : hostedGames.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-3xl">
                  <p className="text-neutral-500 font-bold uppercase tracking-widest">No games hosted yet</p>
                </div>
              ) : (
                hostedGames.slice(0, 4).map((g, i) => {
                  const openSlots = g.teams.teamA.slots.filter(s => s.status === 'OPEN').length + 
                                    g.teams.teamB.slots.filter(s => s.status === 'OPEN').length;
                  const totalSlots = g.teams.teamA.slots.length + g.teams.teamB.slots.length;
                  const filled = totalSlots - openSlots;
                  
                  let status = "Open";
                  let statusColor = PRI;
                  if (g.status === 'CANCELLED') {
                    status = "Cancelled";
                    statusColor = "#EF4444";
                  } else if (openSlots === 0) {
                    status = "Slot Full";
                    statusColor = "#6B7280";
                  } else if (g.status === 'STARTED') {
                    status = "Started";
                    statusColor = "#F97316";
                  }

                  const game = {
                    time: g.time,
                    status: status,
                    statusColor: statusColor,
                    name: g.host?.name || "Host",
                    sport: g.gameType,
                    loc: g.ground?.name || g.city || "Venue",
                    dist: g.ground?.location || g.state || "",
                    filled: filled,
                    total: totalSlots,
                    img: g.ground?.images?.[0] || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80"
                  };

                  return (
                    <div key={i} className="min-w-[75vw] md:min-w-0 snap-center relative rounded-3xl overflow-hidden border group shrink-0 md:shrink cursor-pointer" 
                      onClick={() => navigate('/join-games')}
                      style={{ height: "360px", borderColor: BDR }}
                    >
                      <img src={game.img} alt={game.sport} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.9) 100%)" }} />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: PRI }}>{game.time}</span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md" style={{ backgroundColor: "rgba(0,0,0,0.5)", border: `1px solid ${game.statusColor}` }}>{game.status}</span>
                      </div>

                      {/* Bottom Content */}
                      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-2xl text-white uppercase leading-none">{game.name}</h3>
                            <span className="px-2 py-0.5 rounded border text-[9px] font-bold tracking-widest text-white backdrop-blur-md" style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)" }}>{game.sport}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="flex items-center gap-1 text-gray-300"><MapPin size={10} style={{ color: PRI }} /> {game.loc}</span>
                            <span className="font-bold truncate max-w-[100px]" style={{ color: PRI }}>{game.dist}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                            <span className="flex items-center gap-1"><Users size={10} style={{ color: PRI }} /> {game.filled}/{game.total} Going</span>
                            <span>{Math.round((game.filled / game.total) * 100)}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ backgroundColor: PRI, width: `${(game.filled / game.total) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FIND PROFESSIONALS (Feature Flag) ── */}
      {featureFlags['find_professionals'] && (
        <section className="py-6 lg:py-12 px-6 md:px-10 border-b" style={{ backgroundColor: "#000", borderColor: "#1A1A1A" }}>
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 lg:mb-8">
              <div>
                <h2 className="font-display text-5xl md:text-6xl uppercase leading-none text-white">
                  Find <span style={{ color: PRI }}>Professionals</span>
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest mt-2" style={{ color: "#888" }}>
                  Book certified experts for your next session
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS"].map((tab, i) => (
                  <button key={tab} className="px-6 py-2 rounded-full font-bold text-xs shrink-0 transition-colors border"
                    style={i === 0 ? { backgroundColor: PRI, color: "#000", borderColor: PRI } : { backgroundColor: "transparent", color: "#888", borderColor: "transparent" }}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Professionals Grid */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible no-scrollbar pb-6 md:pb-0">
              {[
                { name: "ROGER FEDERER", exp: "20+ Years", spec: "Grand Slam Expert", price: "₹5,000/hr", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80", rating: "5.0 (500 reviews)" },
                { name: "SARAH WILLIAMS", exp: "10+ Years", spec: "Fitness & Conditioning", price: "₹2,500/hr", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80", rating: "4.9 (320 reviews)" },
                { name: "VIRAT KOHLI", exp: "15+ Years", spec: "Masterclass Batting", price: "₹10,000/hr", img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&q=80", rating: "5.0 (1k+ reviews)" },
                { name: "JOHN DOE", exp: "8+ Years", spec: "Certified Umpire", price: "₹1,000/match", img: "https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=400&q=80", rating: "4.8 (150 reviews)" },
              ].map((pro, i) => (
                <div key={i} className="w-[280px] md:w-full h-[480px] snap-center rounded-3xl border overflow-hidden flex flex-col group shrink-0" style={{ backgroundColor: "#111", borderColor: BDR }}>
                  {/* Image Section */}
                  <div className="relative h-[280px] overflow-hidden shrink-0">
                    <img src={pro.img} alt={pro.name} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111 0%, transparent 50%)" }} />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white border backdrop-blur-md flex items-center gap-1" style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <Award size={10} style={{ color: PRI }} /> PRO
                      </span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: PRI }}>
                        <CheckCircle size={14} className="text-black" />
                      </div>
                    </div>

                    {/* Overlay Info */}
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold mb-1" style={{ color: "#888" }}>
                        <Star size={10} style={{ color: PRI, fill: PRI }} /> {pro.rating}
                      </div>
                      <h3 className="font-display text-2xl uppercase italic text-white leading-none">{pro.name}</h3>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">EXPERIENCE</p>
                        <p className="text-xs font-semibold text-white">{pro.exp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">SPECIALTY</p>
                        <p className="text-xs font-semibold text-white">{pro.spec}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">STARTING FROM</p>
                        <p className="font-bold text-white">{pro.price}</p>
                      </div>
                      <button className="px-6 py-2 rounded-lg font-bold text-black text-xs transition-transform hover:scale-105" style={{ backgroundColor: "#fff" }}>
                        BOOK NOW
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BENTO GRID ── */}
      <section className="pt-10 lg:pt-20 pb-4 lg:pb-6 px-6 md:px-10 w-full">
        <div className="text-center mb-8 lg:mb-14">
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase italic leading-[0.9]">
            ALL IN ONE <span className="text-gray-500">SPORTS</span><br />
            EXPERIENCE <span className="inline-block px-4 py-2 ml-2 align-middle rounded-full font-script text-3xl md:text-4xl not-italic text-black" style={{ backgroundColor: PRI }}>Powered by AI ✨</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: "400px" }}>
          {/* Left Large Card */}
          <div className="lg:col-span-1 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-end min-h-[300px]" style={{ background: "linear-gradient(135deg, #0d1f00, #0a0a0a)", border: `1px solid ${BDR}` }}>
            <div className="absolute top-6 left-6 w-12 h-12 rounded-2xl flex items-center justify-center border z-20" style={{ borderColor: PRI, backgroundColor: "rgba(132,204,22,0.1)" }}>
              <BookOpen size={20} style={{ color: PRI }} />
            </div>
            <div className="absolute right-0 top-0 w-3/4 h-3/4 bg-no-repeat bg-contain bg-right-top z-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80')", opacity: 0.3 }} />
            <div className="relative z-20">
              <h3 className="font-display text-5xl italic mb-2 leading-none">BOOK VENUES</h3>
              <p className="text-gray-400 mb-6 max-w-sm">Find the perfect spot for Cricket, Football, Swimming, and more.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Cricket", "Football", "Swimming", "Badminton"].map(t => (
                  <span key={t} className="px-4 py-1.5 rounded-full text-xs font-bold border" style={{ borderColor: BDR, backgroundColor: "rgba(255,255,255,0.05)" }}>{t}</span>
                ))}
              </div>
              <Link to="/turfs" className="inline-block bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors">Find Venues</Link>
            </div>
          </div>

          {/* Right Column Grid */}
          <div className="lg:col-span-2 grid grid-rows-2 gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Challenge Players */}
              <div className="rounded-3xl p-8 relative overflow-hidden border min-h-[200px]" style={{ borderColor: BDR, backgroundColor: "#111" }}>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80')", opacity: 0.4 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111, transparent)" }} />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#84CC16] font-bold text-xs uppercase tracking-widest flex items-center gap-1"><Trophy size={14} /> COMPETITIVE</span>
                  </div>
                  <div>
                    <h3 className="font-display text-4xl italic mb-1 leading-none">CHALLENGE<br />PLAYERS</h3>
                    <p className="text-gray-400 text-sm mb-4">Skill-matched opponents.</p>
                    <Link to="/players" className="font-bold text-white flex items-center gap-2 hover:text-[#84CC16] transition-colors">Start Match <ArrowRight size={16} /></Link>
                  </div>
                </div>
              </div>
              {/* Community Feed / Highlights */}
              <div className="rounded-3xl p-6 relative border flex flex-col justify-between min-h-[200px] overflow-hidden group" style={{ borderColor: BDR, backgroundColor: "#000" }}>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <Users size={14} className="text-[#84CC16]" />
                      </div>
                      <h3 className="font-display text-xl italic uppercase">COMMUNITY FEED</h3>
                    </div>
                    <Link to="/community" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest">See All</Link>
                  </div>

                  <div className="flex-1 space-y-3">
                    {realSocialPosts.length > 0 ? (
                      realSocialPosts.slice(0, 2).map((post) => {
                        const author = post.adminId || post.userId || post.ownerId;
                        return (
                          <div key={post._id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group/post hover:border-[#84CC16]/30 transition-all">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-900 shrink-0 relative">
                              {author?.profilePicture ? (
                                <img 
                                  src={author.profilePicture} 
                                  alt="" 
                                  className="w-full h-full object-cover relative z-10"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center font-bold text-[10px] uppercase text-white absolute inset-0 z-0" 
                                style={{ 
                                  backgroundColor: avatarColor(author?.name || "A"),
                                  display: author?.profilePicture ? 'none' : 'flex'
                                }}
                              >
                                {(author?.name || "A")[0]}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">{author?.name || "Anonymous"}</p>
                              <p className="text-[9px] text-gray-500 truncate">{post.content || post.title || "Shared a new post"}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-600 group-hover/post:text-[#84CC16] transition-colors" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <MessageCircle size={24} className="mb-2" />
                        <p className="text-[10px] uppercase font-bold tracking-widest">No recent posts</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace, Coaches, Umpires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Featured Community Highlight */}
              <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#84CC16] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
                {realSocialPosts[0]?.image ? (
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${realSocialPosts[0].image})` }} />
                ) : (
                  <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80')" }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: PRI, backgroundColor: "rgba(132,204,22,0.1)" }}>
                    <Zap size={16} style={{ color: PRI }} />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-[#84CC16] uppercase tracking-widest mb-1 block">Trending Now</span>
                    <h3 className="font-display text-xl italic mb-1 leading-tight uppercase truncate">{realSocialPosts[0]?.title || "SOCIAL ARENA"}</h3>
                    <p className="text-gray-400 text-[10px] mb-4 line-clamp-1">{realSocialPosts[0]?.content || "Check out what's happening in the field."}</p>
                    <Link
                      to="/community"
                      className="font-bold text-white text-[10px] flex items-center gap-2 hover:text-[#84CC16] transition-colors uppercase tracking-widest"
                    >
                      Explore <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Coaches */}
              <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#84CC16] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
                <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: "#F59E0B", backgroundColor: "rgba(245,158,11,0.1)" }}>
                    <Award size={20} style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl italic mb-1 leading-none uppercase">PRO COACHES</h3>
                    <p className="text-gray-400 text-xs mb-4">Expert training.</p>
                    <Link to="/turfs" className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#84CC16] transition-colors">Find Coach <ArrowRight size={14} /></Link>
                  </div>
                </div>
              </div>

              {/* Umpires */}
              <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#84CC16] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
                <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&q=80')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: "#60A5FA", backgroundColor: "rgba(96,165,250,0.1)" }}>
                    <Shield size={20} style={{ color: "#60A5FA" }} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl italic mb-1 leading-none uppercase">REFEREES</h3>
                    <p className="text-gray-400 text-xs mb-4">Hire officials.</p>
                    <Link to="/turfs" className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#84CC16] transition-colors">Book Now <ArrowRight size={14} /></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL ARENA ── */}
      <section className="pt-4 lg:pt-6 pb-4 lg:pb-6 px-6 md:px-10 w-full overflow-hidden">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 lg:mb-10 gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-6xl uppercase flex items-center gap-2 md:gap-3">
                Your <span style={{ color: PRI }}>Social Arena</span> <Info className="w-4 h-4 md:w-5 md:h-5 text-gray-600 cursor-help shrink-0" />
              </h2>
              <p className="text-gray-400 mt-2 text-sm md:text-base">Swipe to see what's happening in the field</p>
            </div>
            <Link to="/community" className="text-white font-bold flex items-center gap-2 hover:text-[#84CC16] transition-colors uppercase tracking-widest text-sm">
              Explore Community <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
            {(realSocialPosts.length > 0 ? realSocialPosts : socialPosts).map((post, idx) => {
              const author = post.adminId || post.userId || post.ownerId;
              const isFollowing = author && followingIds.includes(author._id);
              
              return (
                <div key={post._id || idx} className="w-[300px] md:w-[340px] aspect-[4/5] shrink-0 bg-[#0A0A0A] border rounded-[2rem] overflow-hidden snap-start group transition-all flex flex-col" style={{ borderColor: BDR }}>
                  {/* Image Container */}
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={post.image || post.imageUrl || post.image}
                      alt="Social post"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80"; 
                      }}
                    />
                  </div>

                  {/* Exact UI Action Footer */}
                  <div className="bg-[#0D0D0D] p-4 px-5 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-5">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/community?post=${post._id}`);
                        }}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Heart size={16} className={(post.likes?.length > 0 || post.likes > 0) ? "fill-white text-white" : ""} />
                        <span className="text-[10px] font-bold text-gray-400">
                          {Array.isArray(post.likes) ? post.likes.length : post.likes || 0}
                          {(Array.isArray(post.likes) ? post.likes.length : post.likes || 0) > 999 ? 'k' : ''}
                        </span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/community?post=${post._id}`);
                        }}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <MessageSquare size={16} />
                        <span className="text-[10px] font-bold text-gray-400">
                          {Array.isArray(post.comments) ? post.comments.length : post.comments || 0}
                        </span>
                      </button>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const url = `${window.location.origin}/community?post=${post._id}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BLOGS & ARTICLES ── */}
      <BlogSection />

      {/* ── VIDEO GALLERY ── */}
      <VideoSection videos={marketing.videos} />

      {/* ── PLAYBOOK HIGHLIGHTS (Images) ── */}
      <section className="w-full">
        <div className="grid grid-cols-6 gap-0">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className={`relative h-[300px] md:h-[400px] overflow-hidden group border-white/5 bg-[#050505] transition-all duration-700 ${item.span}`}
            >
              <img
                src={item.image}
                alt="Highlight"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE BMSPORTZ ── */}
      {/* Hiding section as per user request */}
      {/* 
      <section className="py-8 lg:py-16 px-6 md:px-10 w-full">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-5xl md:text-8xl font-bold uppercase leading-none tracking-tight">
              WHY CHOOSE <span className="text-[#84CC16]">BMSPORTZ?</span>
            </h2>
            <p className="text-white/60 mt-10 text-lg md:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
              BMSPORTZ is the only unified ecosystem designed to handle everything from your first booking to your last-minute matchmaking. We’ve eliminated the messy WhatsApp groups and endless phone calls. With real-time slot tracking, AI-powered skill matching, and a pro-level community, we provide the technology that lets you focus entirely on your game.
            </p>
          </div>
        </div>
      </section>
      */}

      {/* ── FEATURES ── */}
      {/* Hiding section as per user request */}
      {/*
      <section className="py-6 lg:py-12 px-6 md:px-10 w-full max-w-screen-2xl mx-auto">
        <div className="text-center mb-8 lg:mb-14">
          <h2 className="font-display text-5xl md:text-6xl uppercase">
            ALL IN ONE <span style={{ color: PRI }}>SPORTS</span> BOOKING
          </h2>
          <p className="font-script text-xl mt-2" style={{ color: PRI }}>built for athletes, by athletes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="bms-card group rounded-3xl border overflow-hidden flex flex-col" style={{ backgroundColor: "#111", borderColor: BDR }}>
              <div className="relative h-48 overflow-hidden shrink-0">
                <img src={f.img} alt={f.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-md"
                  style={{ borderColor: "rgba(132,204,22,0.4)", backgroundColor: "rgba(0,0,0,0.6)" }}>
                  <f.icon size={18} style={{ color: PRI }} />
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display text-2xl mb-2 group-hover:text-[#84CC16] transition-colors leading-none uppercase">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      */}



      {/* ── APP DOWNLOAD SECTION ── */}
      <section className="pt-6 lg:pt-10 pb-12 lg:pb-24 relative overflow-hidden px-0 lg:px-20">
        <div className="max-w-full mx-auto">
          <div className="bg-gradient-to-br from-[#0D0D0D] to-black border-y lg:border lg:rounded-[3rem] p-8 md:p-24 overflow-hidden relative" style={{ borderColor: BDR }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">

              {/* Left Side: Mockup */}
              <div className="relative order-2 lg:order-1 mt-12 lg:mt-0">
                <div className="relative group">
                  <div className="absolute -inset-10 bg-primary/5 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
                  <img
                    src="/sports_app_mockup_1777351423147.png"
                    alt="BookMySportz App Mockup"
                    className="relative w-full max-w-2xl mx-auto transform scale-[1.5] sm:scale-110 lg:scale-150 -rotate-6 hover:rotate-0 transition-all duration-700"
                  />
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5 mb-8">
                  <div className="w-2 h-2 bg-[#84CC16] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-[#84CC16] uppercase">Mobile App Coming Soon</span>
                </div>

                <h2 className="text-6xl md:text-8xl font-bold uppercase leading-[0.9] mb-8 tracking-tight">
                  BOOK <span className="text-white/20">•</span> PLAY <span className="text-white/20">•</span> <span className="text-[#84CC16]">WIN</span>
                </h2>

                <p className="text-gray-400 text-base md:text-xl mb-12 max-w-xl mx-auto lg:mx-0">
                  Take the ecosystem anywhere. Book slots, join matches, and track your stats.
                </p>

                <div className="flex flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start w-full">
                  {/* Google Play Button */}
                  <div className="relative group flex-1 sm:flex-none">
                    <div className="absolute -top-2 -right-1 sm:-right-2 z-20 bg-[#84CC16] text-black text-[6px] sm:text-[9px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
                      Coming Soon
                    </div>
                    <a href="#" className="flex items-center justify-center gap-2 sm:gap-4 bg-white/5 border px-3 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all cursor-not-allowed w-full" style={{ borderColor: BDR }}>
                      <div className="w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center opacity-50 shrink-0">
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.23-.209.534-.075.79.133.257.394.424.681.424h.01c.145 0 .284-.041.405-.119l12.784-7.464 3.031 3.031c.141.141.331.22.53.22.199 0 .389-.079.53-.22l3.031-3.031c.141-.141.22-.331.22-.53 0-.199-.079-.389-.22-.53l-3.031-3.031 12.784-7.464c.121-.078.26-.119.405-.119h.01c.287 0 .548-.167.681-.424.134-.256.105-.56-.075-.79L3.609 1.814z" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start leading-none opacity-50 whitespace-nowrap">
                        <p className="text-[6px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">Get it on</p>
                        <p className="text-[11px] sm:text-lg font-bold text-white">Google Play</p>
                      </div>
                    </a>
                  </div>

                  {/* App Store Button */}
                  <div className="relative group flex-1 sm:flex-none">
                    <div className="absolute -top-2 -right-1 sm:-right-2 z-20 bg-[#84CC16] text-black text-[6px] sm:text-[9px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
                      Coming Soon
                    </div>
                    <a href="#" className="flex items-center justify-center gap-2 sm:gap-4 bg-white/5 border border-white/10 px-3 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all cursor-not-allowed w-full">
                      <div className="w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center opacity-50 shrink-0">
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start leading-none opacity-50 whitespace-nowrap">
                        <p className="text-[6px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">Download on</p>
                        <p className="text-[11px] sm:text-lg font-bold text-white">App Store</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/2 rounded-full -translate-y-1/2 translate-x-1/2 opacity-5" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/2 rounded-full translate-y-1/2 -translate-x-1/2 opacity-5" />
          </div>
        </div>
      </section>
      {/* ── FOOTER BANNER ── */}
      <section className="w-full">
        <div className="border-t border-b grid grid-cols-4 lg:flex lg:flex-nowrap items-stretch p-2 lg:p-4 divide-x" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
          {[
            { title: "LIST VENUE", sub: "EARN NOW", icon: Store },
            { title: "HOST GAME", sub: "START HOSTING", icon: Ticket },
            { title: "GET APP", sub: "ANDROID & IOS", icon: Download },
            { title: "BOOKINGS", sub: "YOUR PAST", icon: CalendarDays }
          ].map(item => (
            <div key={item.title} className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-start text-center lg:text-left gap-2 lg:gap-4 px-1 lg:px-6 py-4 lg:py-2" style={{ borderColor: BDR }}>
              <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border shrink-0" style={{ borderColor: PRI, backgroundColor: "rgba(132,204,22,0.1)" }}>
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: PRI }} />
              </div>
              <div className="w-full">
                <h4 className="font-display text-[9px] sm:text-xs lg:text-xl leading-tight lg:leading-none mb-0.5 lg:mb-1 text-white">{item.title}</h4>
                <p className="text-[6px] sm:text-[8px] lg:text-[10px] font-bold text-gray-500 uppercase tracking-wider lg:tracking-widest hidden sm:block">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <InterestsModal
        isOpen={showInterests}
        onClose={() => setShowInterests(false)}
        onSaved={(sports) => {
          dispatch(updateUser({ sportTypes: sports }));
          setShowInterests(false);
        }}
      />
    </div>
  );
}
