import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import useTurfData from "../features/turf/hooks/useTurfData";
import { Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, User, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award, CheckCircle, Heart, MessageCircle, MessageSquare, MessageSquareShare, Share2, Info, Check, X, RefreshCcw, Timer, Zap, Plus, Loader2, LayoutGrid, Video, Play } from "lucide-react";
import toast from "react-hot-toast";
import { AdBannerSection } from "../shared/components/Marketing/AdBannerSection";
import { VideoSection } from "../shared/components/Marketing/VideoSection";
import BlogSection from "../shared/components/Blogs/BlogSection";
import TurfCard from "../features/turf/components/TurfCard";
import TurfCardMobile from "../features/turf/components/TurfCardMobile";
import SearchPlayers from "../shared/components/search/SearchPlayers";
import SearchTurf from "../shared/components/search/SearchTurf";
import InterestsModal from "../shared/components/modals/InterestsModal";
import { updateUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import Community from "../features/networking/pages/Community";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";

const PRI = "#BFF367";
const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const S2 = "#1A1A1A";
const BDR = "#2A2A2A";

const stats = [
 { value: "500+", label: "Venues" },
 { value: "50K+", label: "Players" },
 { value: "1M+", label: "Bookings" },
 { value: "25+", label: "Cities" },
];

const socialPosts = [
  { video: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80", likes: "1.2k", comments: "84" },
  { video: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", likes: "2.5k", comments: "120" },
  { video: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80", likes: "890", comments: "45" },
  { video: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", image: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&q=80", likes: "1.8k", comments: "62" },
  { video: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80", likes: "3.1k", comments: "156" },
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
 const [searchParams] = useSearchParams();
 const isReelsView = searchParams.get("tab") === "shots";
 const [isCommunitySearchActive, setIsCommunitySearchActive] = useState(false);
 const shouldHideRest = isReelsView || isCommunitySearchActive;
 const [showInterests, setShowInterests] = useState(false);
 const { data: reelsData } = useGetReelsFeedQuery();
 const reelsFeed = reelsData?.reels?.slice(0, 10) || [];
 const [activeTab, setActiveTab] = useState("venues");
 const [players, setPlayers] = useState([]);
 const [followingIds, setFollowingIds] = useState([]);
 const [turfFilters, setTurfFilters] = useState({});
 const [playerFilters, setPlayerFilters] = useState({});
 const [userLocation, setUserLocation] = useState(null);
 const [locationStatus, setLocationStatus] = useState("detecting");

  const combinedTurfFilters = useMemo(() => {
    if (locationStatus === "detecting") return { _skip: true };
    const base = { ...turfFilters };
    if (userLocation && userLocation.lat && userLocation.lng) {
      base.lat = userLocation.lat;
      base.lng = userLocation.lng;
    } else if (locationStatus === "denied") {
      base.lat = 17.3850;
      base.lng = 78.4867;
      base.city = "Hyderabad";
      base.state = "Telangana";
    }
    return base;
  }, [turfFilters, userLocation, locationStatus]);

  const { turfs, loading: turfLoading, error } = useTurfData(combinedTurfFilters);

  // Geolocation fallback logic
  const displayTurfs = useMemo(() => {
    if (!turfs || turfs.length === 0) return [];
    
    // Sort all turfs by rating first
    const sortedAll = [...turfs].sort((a, b) => (b.averageRating ?? b.rating ?? 0) - (a.averageRating ?? a.rating ?? 0));
    
    if (!userLocation || (!userLocation.city && !userLocation.state)) {
      return sortedAll;
    }
    
    // Level 1: City
    const cityTurfs = sortedAll.filter(t => t.city?.toLowerCase() === userLocation.city?.toLowerCase());
    if (cityTurfs.length >= 2) return cityTurfs;
    
    // Level 2: State
    const stateOnlyTurfs = sortedAll.filter(t => t.state?.toLowerCase() === userLocation.state?.toLowerCase());
    if (stateOnlyTurfs.length >= 2) return stateOnlyTurfs;
    
    // Level 3: All
    return sortedAll;
  }, [turfs, userLocation]);
 const [marketing, setMarketing] = useState({ banners: [], videos: [] });
 const [loading, setLoading] = useState(true);
 const [featureFlags, setFeatureFlags] = useState({});
 const [realSocialPosts, setRealSocialPosts] = useState([]);
 const [hostedGames, setHostedGames] = useState([]);
 const [hostedGamesLoading, setHostedGamesLoading] = useState(true);
 const [selectedGameSport, setSelectedGameSport] = useState("ALL SPORTS");
 const [professionals, setProfessionals] = useState([]);
 const [professionalsLoading, setProfessionalsLoading] = useState(true);

 // Home Page Location Filtering
 const [states, setStates] = useState([]);
 const [cities, setCities] = useState([]);
 const [selectedHomeState, setSelectedHomeState] = useState(user?.state || "");
 const [selectedHomeCity, setSelectedHomeCity] = useState(user?.city || "");
 const [loadingStates, setLoadingStates] = useState(false);
 const [loadingCities, setLoadingCities] = useState(false);

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

  useEffect(() => {
    detectLocation();
  }, []);

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
 const ids = (response.data.following || []).filter(p => p).map(p => p.id || p._id);
 setFollowingIds(ids);
 } catch (error) {
 console.error("Error fetching network:", error);
 }
 };

 fetchPlayers();
 fetchFollowingStatus();
 }, [playerFilters, userLocation, isLoggedIn]);

 useEffect(() => {
 const fetchStates = async () => {
 try {
 setLoadingStates(true);
 const res = await axiosInstance.get('/api/location/states');
 setStates(res.data.states || []);
 } catch (err) {
 console.error('Error fetching states:', err);
 } finally {
 setLoadingStates(false);
 }
 };
 fetchStates();
 }, []);

 useEffect(() => {
 const fetchCities = async () => {
 if (!selectedHomeState) {
 setCities([]);
 return;
 }
 try {
 setLoadingCities(true);
 const res = await axiosInstance.get(`/api/location/cities?state=${selectedHomeState}`);
 setCities(res.data.cities || []);
 } catch (err) {
 console.error('Error fetching cities:', err);
 } finally {
 setLoadingCities(false);
 }
 };
 fetchCities();
 }, [selectedHomeState]);

 useEffect(() => {
 const fetchHostedGames = async () => {
 try {
 setHostedGamesLoading(true);
 let url = "/api/hosted-game/list";
 const params = {};
 
 // Priority: Filter selection > User profile
 const cityFilter = selectedHomeCity || user?.city;
 const stateFilter = selectedHomeState || user?.state;
 
 if (cityFilter) params.city = cityFilter;
 if (stateFilter) params.state = stateFilter;
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
 }, [selectedHomeCity, selectedHomeState, selectedGameSport, user?.city, user?.state]);

 useEffect(() => {
 const fetchProfessionals = async () => {
 try {
 setProfessionalsLoading(true);
 const res = await axiosInstance.get("/api/professional/list", { params: { limit: 12 } });
 setProfessionals(res.data.professionals || []);
 } catch (error) {
 console.error("Error fetching professionals:", error);
 } finally {
 setProfessionalsLoading(false);
 }
 };
 fetchProfessionals();
 }, []);

 const handleTurfSearch = (filters) => {
 setTurfFilters(filters);
 };

  const [activeReel, setActiveReel] = useState(null);

  // Auto-apply user location to venue filters once detected
 useEffect(() => {
 if (locationStatus === "granted" && userLocation) {
 setTurfFilters(prev => ({
 ...prev,
 state: userLocation.state || "",
 city: userLocation.city || "",
 }));
 } else if (locationStatus === "denied") {
 // Location denied — show all venues (clear location filters)
 setTurfFilters(prev => ({ ...prev, state: "", city: "" }));
 }
 }, [locationStatus, userLocation]);

 const handlePlayerSearch = (filters) => {
 setPlayerFilters(filters);
 };

  const handleFollowToggle = async (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    
    gateInteraction(async () => {
      const playerId = p.id || p._id;
      const isFollowing = followingIds.includes(playerId);
      
      // Optimistic update
      if (isFollowing) {
        setFollowingIds(prev => prev.filter(id => id !== playerId));
      } else {
        setFollowingIds(prev => [...prev, playerId]);
      }

      try {
        const endpoint = `/api/user/players/${playerId}/${isFollowing ? 'unfollow' : 'follow'}`;
        await axiosInstance.post(endpoint);
      } catch (err) {
        // Revert on error
        if (isFollowing) {
          setFollowingIds(prev => [...prev, playerId]);
        } else {
          setFollowingIds(prev => prev.filter(id => id !== playerId));
        }
        console.error("Follow toggle failed:", err);
        toast.error("Failed to update follow status");
      }
    }, { 
      title: "Join the Network", 
      message: "Connect with players, build your squad, and stay updated on the latest games. Sign in to follow athletes." 
    });
  };

 return (
 <div className={`min-h-screen text-white ${isReelsView ? 'h-[100dvh] overflow-hidden' : ''}`} style={{ backgroundColor: "#000" }}>
  {/* ── REDESIGNED DASHBOARD HERO ── */}
  <section className={`px-4 md:px-8 max-w-5xl mx-auto w-full ${isReelsView ? 'pt-0 pb-0' : 'pt-1 sm:pt-2 pb-4'}`}>




    {/* Community Feed Added Below Stores Section */}
    <div className={`${isReelsView ? 'mt-0 mb-0' : 'mt-0 mb-2'} -mx-4 md:-mx-8`}>
      <Community onSearchActive={setIsCommunitySearchActive}>
        {/* Dashboard Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 w-full">
      {/* Leaderboard */}
      <Link 
        to="/leaderboard"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{ 
          background: "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #2087FF 0%, #0E49B5 45%, #031533 100%)",
          overflow: "visible"
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Leaderboard
        </span>
        <img 
          src="/3d_map_location.svg" 
          alt="Leaderboard Map Icon" 
          className="absolute -right-2.5 -top-[16px] w-[98px] h-[98px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10" 
        />
      </Link>

      {/* Scoring */}
      <Link 
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{ 
          background: "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #FF9800 0%, #E65100 45%, #3E1700 100%)",
          overflow: "visible"
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Scoring
        </span>
        <img 
          src="/3d_scoreboard_v2.png" 
          alt="Scorer Icon" 
          className="absolute -right-3 -top-[20px] w-[105px] h-[105px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>

      {/* Host & Join Games */}
      <Link 
        to="/join-games"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{ 
          background: "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #22C55E 0%, #15803D 45%, #032512 100%)",
          overflow: "visible"
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Host & Join Games
        </span>
        <img 
          src="/3d_whistle.svg" 
          alt="Host & Join Games Whistle Icon" 
          className="absolute -right-2.5 -top-[14px] w-[98px] h-[98px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10" 
        />
      </Link>

      {/* Pros */}
      <Link 
        to="/professionals"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{ 
          background: "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #FFA2FF 0%, #A726E2 50%, #220038 100%)",
          overflow: "visible"
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Pros
        </span>
        <img 
          src="/3d_professional_v2.png" 
          alt="Pros Icon" 
          className="absolute -right-2 -top-[16px] w-[94px] h-[94px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>
        </div>

  {/* ── FIND YOUR ARENA ── */}
  <section className="py-6 mb-6 w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
 <div className="relative">
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>
  VENUES {userLocation?.city || userLocation?.state ? 'IN ' : 'NEAR '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367]">
    {userLocation?.city || userLocation?.state || 'YOU'}
  </span>
 </h2>
 <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.15em] mt-4" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>
 Premium Venue Discovery • Elite Sports Infrastructure
 </p>
 </div>
 </div>

 {/* Search Row */}
 <div className="flex flex-col gap-6 mb-10 w-full">
 <div className="w-full animate-fade-in relative z-20">
    <div className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-full px-4 py-2 w-full md:w-1/2">
      <Search size={18} className="text-[#BFF367]" />
      <input 
        type="text" 
        placeholder="Search arenas..." 
        className="bg-transparent outline-none text-sm text-white w-full placeholder:text-gray-500 cursor-pointer"
        value=""
        readOnly
        onClick={() => navigate('/search')}
      />
    </div>
 </div>
 </div>

 {/* Venue scroll — 1.8 cards on mobile */}
  {loading || turfLoading ? (
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
  {[...Array(3)].map((_, i) => (
  <div key={i} className="w-[85vw] md:w-[400px] shrink-0 snap-center rounded-[12px] border animate-pulse" style={{ height: 320, backgroundColor: "#111", borderColor: BDR }} />
  ))}
  </div>
 ) : (error || displayTurfs.length === 0) ? (
 <div className="text-center py-24 animate-fadeIn">
 <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
 <Search size={32} className="text-gray-600" />
 </div>
 <p className="text-3xl mb-3 uppercase tracking-tighter font-black" style={{ fontFamily: "'Open Sans', sans-serif" }}>Venues Not Found</p>
 <p className="text-gray-500 text-sm uppercase tracking-wider mb-8">Try adjusting your search or filters</p>
 <button
 onClick={() => setTurfFilters({ searchTerm: "", city: "", state: "" })}
 className="px-8 py-3 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[8px] hover:scale-105 transition-all shadow-[0_0_20px_rgba(85,222,e32,0.2)]" style={{ background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)" }}
 >
 View All Venues
 </button>
 </div>
  ) : (
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4">
  {displayTurfs.slice(0, 10).map((t) => (
  <div key={t._id} className="w-[85vw] md:w-[400px] shrink-0 snap-start">
    <TurfCardMobile 
      turf={t} 
      distance={t.distance ? `${t.distance} km` : "1.2 km"}
    />
  </div>
  ))}
  </div>
  )}

 <div className="text-center mt-6 lg:mt-10">
 <Link to="/venues" className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-[6px] border transition-all hover:border-[#BFF367] hover:text-[#BFF367]"
 style={{ borderColor: BDR, color: "#888" }}>
 View All Venues <ChevronRight size={16} />
 </Link>
 </div>
 </section>

 {/* ── FIND PLAYERS NEAR YOU ── */}
 <section className="py-6 mb-6 w-full">
 <div className="w-full">
 {/* Refined Section Header */}
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6 border-b border-white/5 pb-4">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full shadow-[0_0_20px_rgba(85,222,232,0.4)] hidden md:block" style={{ background: GRAD }}></div>
 <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>
 Find Players <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Near You</span>
 </h2>
 <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-3" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>
 Global Talent Network • Skill-Matched Athletes
 </p>
 </div>
 
 </div>

 {/* Player cards — 10 in one scrollable row */}
 {loading ? (
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
 {[...Array(10)].map((_, i) => (
 <div key={i} className="shrink-0 w-[200px] md:w-[240px] rounded-[8px] border border-white/5 animate-pulse bg-white/5" style={{ height: 300 }} />
 ))}
 </div>
 ) : players.length === 0 ? (
 <div className="text-center py-12" style={{ color: "#888" }}>
 <Users size={40} className="mx-auto mb-3 opacity-30" />
 <p className="font-display text-2xl">No Players Yet</p>
 <p className="text-sm mt-1">Be the first to join the community!</p>
 <Link to="/signup" className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full"
 style={{ background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)" }}>Join Now</Link>
 </div>
 ) : (
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
 {players.slice(0, 10).map(p => {
 const initials = p.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
 const isFollowing = followingIds.includes(p.id || p._id);
 const formatLoc = (loc) => {
   if (!loc) return "Nearby Player";
   const pts = loc.split(',').map(s => s.trim());
   return pts.length >= 3 ? `${pts[0]}, ${pts[pts.length-2]}, ${pts[pts.length-1]}` : loc;
 };
 
 return (
 <div key={p.id || p._id} className="shrink-0 w-[200px] md:w-[240px] group">
 <div className="relative rounded-[8px] p-[1px] bg-white/5 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-[#BFF367] group-hover:to-[#BFF367] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
 {/* Profile Image */}
 <div className="relative bg-[#121212] rounded-[8px] p-2.5 h-full">
 <Link to={`/profile/${p.id || p._id}`} className="relative aspect-[1/1.1] rounded-[8px] overflow-hidden block mb-4">
 <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded border border-black/20 text-[8px] font-black text-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
 {p.preferredSport || "ATHLETE"}
 </div>
 <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
 {(p.profilePicture || p.profileImage) ? (
 <img 
 src={p.profilePicture || p.profileImage} 
 alt={p.name} 
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
 onError={(e) => {
 e.target.style.display = 'none';
 e.target.nextElementSibling.style.display = 'flex';
 }}
 />
 ) : null}
 <div 
 className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
 style={{ display: (p.profilePicture || p.profileImage) ? 'none' : 'flex' }}
 >
 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] font-black text-5xl tracking-tighter opacity-40 group-hover:opacity-80 transition-opacity duration-500">
 {initials}
 </span>
 </div>
 </div>
 </Link>

 {/* Content Section */}
 <div className="px-2 pb-1.5">
 <div className="flex items-center gap-1.5 mb-1">
 <Link to={`/profile/${p._id}`}>
 <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-[#BFF367] transition-colors line-clamp-1 font-open-sans">
 {p.name || "Anonymous"}
 </h3>
 </Link>
 <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
 <Check size={8} strokeWidth={4} className="text-white" />
 </div>
 </div>
 
 <p className="text-[#BFF367] text-[10px] font-medium leading-tight mb-4 flex items-center gap-1.5 w-full">
 <MapPin size={10} className="text-white shrink-0" /> 
 <span className="truncate">{p.distance ? `${(p.distance/1000).toFixed(1)} km Away` : formatLoc(p.city)}</span>
 </p>

 {/* Bottom Bar */}
 <div className="w-full">
 <button 
 onClick={(e) => handleFollowToggle(e, p)}
 className={`w-full py-1.5 rounded-[6px] font-black text-[9px] uppercase tracking-wider transition-all duration-300 ${isFollowing ? 'bg-white/5 border border-white/10 text-white/30 hover:bg-white/10' : 'bg-white text-black hover:bg-white/90 shadow-lg'}`}
 >
 {isFollowing ? 'Following' : 'Follow +'}
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* View More Players btn */}
 <div className="text-center mt-6 lg:mt-10">
 <Link to="/players" className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-[6px] border transition-all hover:border-[#BFF367] hover:text-[#BFF367]"
 style={{ borderColor: BDR, color: "#888" }}>
 View More Players <ChevronRight size={16} />
 </Link>
 </div>
 </div>
 </section>


 {/* ── SOCIAL ARENA ── */}
 <section className="py-6 mb-6 w-full overflow-hidden">
 <div className="w-full">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 lg:mb-10 gap-4">
 <div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-2 md:gap-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
 Your <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Social Arena</span> <Info className="w-4 h-4 md:w-5 md:h-5 text-gray-600 cursor-help shrink-0" />
 </h2>
 <p className="text-xs md:text-sm font-medium text-gray-400 mt-2" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>Swipe to see what's happening in the field</p>
 </div>
 </div>

 {/* Reels Section (Horizontal Mock Data) */}
 <div className="mb-8">
 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
 {reelsFeed.length === 0 ? (
   <div className="w-full py-12 flex items-center justify-center border border-white/5 bg-white/5 rounded-[12px]">
     <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">No reels available</p>
   </div>
 ) : (
   reelsFeed.map((reel, idx) => (
     <div key={`reel-${idx}`} className="w-[180px] md:w-[210px] aspect-[9/16] shrink-0 bg-[#0A0A0A] border rounded-[12px] overflow-hidden snap-start group transition-all relative cursor-pointer" style={{ borderColor: BDR }} onClick={(e) => { e.preventDefault(); navigate(`/?tab=shots&id=${reel.id || reel._id || ''}`); }}>
        {(reel.thumbnailUrl || reel.image) ? (
          <img
            src={reel.thumbnailUrl || reel.image}
            alt="Reel thumbnail"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (reel.mediaUrl || reel.rawVideoUrl) ? (
          <video
            src={reel.mediaUrl || reel.rawVideoUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white/20 transition-transform duration-700 group-hover:scale-110">
            <Play size={24} />
          </div>
        )}
       <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
         <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
           <Play size={16} className="text-white fill-white ml-1" />
         </div>
       </div>
     </div>
   ))
 )}
 </div>
 </div>
 </div>
 </section>

      

  {/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}
 {featureFlags['join_games'] && (
 <section className="py-6 mb-6 w-full">
 <div className="w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6 border-b border-white/5 pb-4">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block" style={{ background: GRAD }}></div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>
 JOIN <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>GAMES</span>
 </h2>
 <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-4" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>
 Community Matchmaking • No Team? No Problem.
 </p>
 </div>

 <Link to="/join-games" className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-[6px] hover:bg-[#BFF367] hover:text-black hover:border-[#BFF367] transition-all duration-500">
 <span className="text-[11px] font-black uppercase tracking-widest">View More Games</span>
 <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
 <ChevronRight size={14} />
 </div>
 </Link>
 </div>

 {/* Location Filters */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#BFF367] transition-colors pointer-events-none" size={18} />
 <select
 value={selectedHomeState}
 onChange={(e) => {
 setSelectedHomeState(e.target.value);
 setSelectedHomeCity("");
 }}
 disabled={loadingStates}
 className="w-full bg-[#111] border border-white/10 rounded-[8px] py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#BFF367] outline-none transition-all font-bold disabled:opacity-50"
 >
 <option value="">{loadingStates ? 'Loading States...' : 'Select State'}</option>
 {states.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>

 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#BFF367] transition-colors pointer-events-none" size={18} />
 <select
 value={selectedHomeCity}
 onChange={(e) => setSelectedHomeCity(e.target.value)}
 disabled={!selectedHomeState || loadingCities}
 className="w-full bg-[#111] border border-white/10 rounded-[8px] py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#BFF367] outline-none transition-all font-bold disabled:opacity-50"
 >
 <option value="">
 {loadingCities ? 'Loading Cities...' : !selectedHomeState ? 'Select state first' : 'Select City'}
 </option>
 {cities.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
 {["ALL SPORTS", "BADMINTON", "CRICKET", "FOOTBALL", "TENNIS", "PICKLEBALL"].map((tab) => (
 <button 
 key={tab} 
 onClick={() => setSelectedGameSport(tab)}
 className="px-6 py-2 rounded-full font-bold text-xs shrink-0 transition-colors border"
 style={selectedGameSport === tab ? { background: GRAD, color: "#000", borderColor: "transparent" } : { backgroundColor: "transparent", color: "#888", borderColor: BDR }}
 >
 {tab}
 </button>
 ))}
 </div>

 {/* Game Cards */}
 <div className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 md:pb-0">
 {hostedGamesLoading ? (
 [1, 2, 3, 4].map(i => (
 <div key={i} className="min-w-[75vw] md:min-w-0 snap-center h-[360px] rounded-[8px] bg-neutral-900 border animate-pulse" style={{ borderColor: BDR }} />
 ))
 ) : hostedGames.length === 0 ? (
 <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-[8px]">
 <p className="text-neutral-500 font-bold uppercase tracking-widest">No games hosted yet</p>
 </div>
 ) : (
 hostedGames.slice(0, 5).map((g, i) => {
 const isQuick = g.gameMode === 'QUICK';
 const openSlots = isQuick 
 ? g.quickSlots.filter(s => s.status === 'OPEN').length
 : (g.teams?.teamA?.slots?.filter(s => s.status === 'OPEN').length || 0) + (g.teams?.teamB?.slots?.filter(s => s.status === 'OPEN').length || 0);
 const totalSlots = isQuick
 ? g.quickSlots.length
 : (g.teams?.teamA?.slots?.length || 0) + (g.teams?.teamB?.slots?.length || 0);
 const hostInitial = g.host?.name?.[0]?.toUpperCase() || '?';
 const bgImg = g.ground?.images?.[0] || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80';

 const gameDate = g.date ? new Date(g.date) : null;
 const dateLabel = gameDate
 ? gameDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
 : '—';

 return (
 <div
 key={g._id || i}
 className="min-w-[75vw] md:min-w-0 snap-center shrink-0 md:shrink cursor-pointer group"
 onClick={() => navigate('/join-games')}
 >
 {/* ── Premium card matching JoinGames page ── */}
 <div className="relative rounded-[8px] overflow-hidden border border-white/10 flex flex-col"
 style={{ height: 340, background: 'linear-gradient(160deg,#0d0d0d 0%,#111 100%)' }}
 >
 {/* Background image */}
 <div className="absolute inset-0">
 <img src={bgImg} alt={g.gameType}
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40" />
 <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.92) 100%)' }} />
 </div>

 {/* Content */}
 <div className="relative z-10 flex flex-col h-full p-5 gap-3">
 {/* Top row: sport badge + cost */}
 <div className="flex items-start justify-between">
 <div className="flex flex-col gap-1">
 <div className="flex gap-2">
 <div className="px-3 py-1 bg-[#BFF367]/20 border border-[#BFF367]/40 rounded-full inline-flex">
 <span className="text-[9px] font-black text-[#BFF367] uppercase tracking-widest">{g.gameType}</span>
 </div>
 {isQuick && (
 <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full inline-flex">
 <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">QUICK</span>
 </div>
 )}
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(g.shortId || g._id); toast.success('Game ID copied!'); }}
 className="px-2.5 py-1 bg-black/50 border border-white/15 hover:border-[#BFF367]/40 rounded-[6px] inline-flex items-center gap-1 transition-all"
 title="Click to copy"
 >
 <Info size={9} className="text-[#BFF367]/70" />
 <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">ID: {g.shortId || g._id.slice(-6).toUpperCase()}</span>
 </button>
 <button
 onClick={(e) => { 
 e.stopPropagation();
 const shareUrl = `${window.location.origin}/join-games?gameId=${g._id}`;
 const shareData = {
 title: 'Kridaz Match Invite',
 text: `Join this ${g.gameType} match hosted by ${g.host?.name || 'a player'}!`,
 url: shareUrl
 };

 if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
 navigator.share(shareData).catch(() => {
 navigator.clipboard.writeText(shareUrl);
 toast.success('Link copied to clipboard!');
 });
 } else {
 navigator.clipboard.writeText(shareUrl);
 toast.success('Link copied to clipboard!');
 }
 }}
 className="p-1.5 bg-black/50 border border-white/15 hover:border-[#BFF367]/40 rounded-[8px] flex items-center justify-center transition-all"
 title="Share Match"
 >
 <Share2 size={10} className="text-[#BFF367]/70" />
 </button>
 </div>
 </div>
 <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-[6px] border border-white/10">
 <span className="text-[10px] font-black text-[#BFF367]">₹</span>
 <span className="text-xs font-black text-white">{g.perPlayerCharge || 'FREE'}</span>
 </div>
 </div>

 {/* Rivalry ledger */}
 <div className="flex items-center gap-2 mt-1">
 <div className="h-px flex-1 bg-[#BFF367]/20" />
 <span className="text-[8px] font-black text-[#BFF367]/60 uppercase tracking-[0.2em]">✦ {isQuick ? 'Casual Pool' : 'Rivalry Ledger'}</span>
 <div className="h-px flex-1 bg-[#BFF367]/20" />
 </div>

 {/* Team matchup */}
 <div className="flex-1">
 <h3 className="text-white font-black uppercase leading-tight tracking-tighter text-xl">
 {isQuick ? (
 <>Casual {g.gameType} Match</>
 ) : (
 <>{g.teams?.teamA?.name || 'TBD'}{' '}
 <span className="text-[#BFF367]">VS</span>{' '}
 {g.teams?.teamB?.name || 'TBD'}</>
 )}
 </h3>
 <div className="flex items-center gap-1.5 mt-1.5">
 <MapPin size={10} className="text-[#BFF367]" />
 <span className="text-[10px] text-white/50 truncate">
 {g.ground?.name || g.city || 'Self-Arranged Venue'}
 </span>
 </div>
 </div>

 {/* Date + Time pills */}
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-black/50 border border-white/10 rounded-[8px] px-3 py-2">
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Kickoff Date</p>
 <p className="text-sm font-black text-white">{dateLabel}</p>
 </div>
 <div className="bg-black/50 border border-white/10 rounded-[8px] px-3 py-2">
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Precision Time</p>
 <p className="text-sm font-black text-white">{g.time || '—'}</p>
 </div>
 </div>

 {/* Open slots + avatar row */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Users size={12} className="text-[#BFF367]" />
 <div>
 <span className="text-sm font-black text-white">{openSlots} Open</span>
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Available Capacity</p>
 </div>
 </div>
 {/* Slot avatar dots */}
 <div className="flex gap-1">
 {Array.from({ length: Math.min(totalSlots, 5) }).map((_, idx) => (
 <div key={idx}
 className={`w-5 h-5 rounded-full border ${idx < (totalSlots - openSlots) ? 'bg-[#BFF367]/30 border-[#BFF367]/50' : 'bg-white/5 border-white/10'}`}
 />
 ))}
 </div>
 </div>

 {/* Host + JOIN */}
 <div className="flex items-center justify-between mt-1">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-[#BFF367]/20 border border-[#BFF367]/40 flex items-center justify-center">
 <span className="text-[10px] font-black text-[#BFF367]">{hostInitial}</span>
 </div>
 <div>
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Commanded By</p>
 <p className="text-[11px] font-black text-white uppercase truncate max-w-[80px]">
 {g.host?.name || 'Unknown'}
 </p>
 </div>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); navigate('/join-games'); }}
 className="flex items-center gap-2 text-black px-5 py-2 rounded-[6px] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(85,222,232,0.4)] hover:scale-105"
 style={{ background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)" }}
 >
 JOIN <ChevronRight size={14} />
 </button>
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

 

      </Community>
    </div>
  </section>

  <div className={shouldHideRest ? 'hidden' : ''}>
 {/* ── AD BANNERS ── */}
 <AdBannerSection banners={marketing.banners} />

 {/* ── FIND PROFESSIONALS (Feature Flag) ── */}
 {featureFlags['find_professionals'] && (
 <section className="py-6 lg:py-12 px-4 lg:px-12 border-b" style={{ backgroundColor: "#000", borderColor: "#1A1A1A" }}>
 <div className="w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-10">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block" style={{ background: GRAD }}></div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>
 PRO <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EXPERTS</span>
 </h2>
 <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-4" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>
 Certified Coaching • Professional Officiating
 </p>
 </div>

 {/* Refined Tabs */}
 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
 {["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS"].map((tab, i) => (
 <button 
 key={tab} 
 className={`px-6 py-2.5 rounded-full font-black text-[10px] shrink-0 transition-all duration-300 uppercase tracking-widest border ${i === 0 ? "text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"}`} style={i === 0 ? { background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)", borderColor: "#BFF367" } : {}}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>

 {/* Professionals Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-3 md:gap-4">
 {professionalsLoading ? (
 [...Array(6)].map((_, i) => (
 <div key={i} className="aspect-[1/1.3] rounded-[8px] bg-white/5 border border-white/5 animate-pulse" />
 ))
 ) : professionals.length === 0 ? (
 <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[8px]">
 <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">No professionals active in your area</p>
 </div>
 ) : (
 professionals.slice(0, 8).map((pro) => (
 <div 
 key={pro._id} 
 className="group cursor-pointer"
 onClick={() => navigate(`/professionals/${pro._id}`)}
 >
 <div className="relative bg-[#121212] rounded-[8px] p-1.5 border border-white/5 transition-all duration-500 hover:border-[#BFF367]/20 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
 
 {/* Compact Profile Image Section */}
 <div className="relative aspect-[1/1.2] rounded-[8px] overflow-hidden block mb-2.5">
 <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
 {pro.profilePicture ? (
 <img 
 src={pro.profilePicture} 
 alt={pro.name} 
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
 onError={(e) => {
 e.target.style.display = 'none';
 e.target.nextElementSibling.style.display = 'flex';
 }}
 />
 ) : null}
 <div 
 className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
 style={{ display: pro.profilePicture ? 'none' : 'flex' }}
 >
 <span className="text-[#BFF367] font-black text-3xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity duration-500">
 {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
 </span>
 </div>
 </div>
 
 {/* Price Badge */}
 <div className="absolute top-2 right-2 z-20">
 <div className="px-2 py-1 rounded-[6px] bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#BFF367] text-[8px] font-bold shadow-lg">
 ₹{pro.price || "500"}/{pro.role === "coach" ? "hr" : "match"}
 </div>
 </div>

 {/* Role Badge */}
 <div className="absolute top-2 left-2 z-20">
 <div className="px-2 py-1 rounded-[6px] bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[8px] font-black tracking-widest gap-1 shadow-lg">
 {pro.role === 'umpire' ? <Shield size={8} className="text-[#BFF367]" /> : 
 pro.role === 'streamer' ? <Video size={8} className="text-[#BFF367]" /> : 
 pro.role === 'scorer' ? <Activity size={8} className="text-[#BFF367]" /> : 
 <Award size={8} className="text-[#BFF367]" />}
 <span className="text-[#BFF367]">{pro.role?.toUpperCase()}</span>
 </div>
 </div>
 </div>

 {/* Content Section */}
 <div className="px-1.5 pb-1">
 <div className="flex items-center gap-1 mb-0.5">
 <h3 className="text-white font-bold text-[13px] tracking-tight group-hover:text-[#BFF367] transition-colors line-clamp-1 font-open-sans capitalize">
 {pro.name?.toLowerCase()}
 </h3>
 <div className="flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
 <Check size={7} strokeWidth={4} className="text-white" />
 </div>
 </div>
 
 <p className="text-white/40 text-[9px] font-medium leading-tight mb-3 line-clamp-1">
 <span className="capitalize">{pro.businessDetails?.specialization?.toLowerCase() || "expert coach"}</span> • {pro.businessDetails?.experience?.toLowerCase() || "5+ years"}
 </p>

 {/* Bottom Bar */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 text-white/80">
 <Star size={12} className="text-[#BFF367] fill-[#BFF367]" />
 <span className="text-[10px] font-bold">{pro.rating?.toFixed(1) || "5.0"}</span>
 </div>
 <div className="flex items-center text-white/30">
 <span className="text-[9px] font-medium">
 ({pro.numReviews || 0})
 </span>
 </div>
 </div>

 <button 
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/professionals/${pro._id}`);
 }}
 className="px-4 py-2 rounded-[8px] font-black text-[9px] uppercase tracking-wider transition-all duration-300 text-black hover:scale-105 shadow-[0_0_15px_rgba(85,222,232,0.3)]"
 style={{ background: GRAD }}
 >
 BOOK
 </button>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </section>
 )}




 {/* ── BLOGS & ARTICLES ── */}
 <BlogSection />

 {/* ── VIDEO GALLERY ── */}
 <VideoSection videos={marketing.videos} />



 {/* ── WHY CHOOSE BMSPORTZ ── */}
 {/* Hiding section as per user request */}
 {/* 
 <section className="pt-4 lg:pt-6 pb-6 lg:pb-12 w-full overflow-hidden">
 <div className="w-full px-4 lg:px-12">
 <div className="text-center">
 <h2 className="text-5xl md:text-8xl font-bold uppercase leading-none tracking-tight">
 WHY CHOOSE <span className="text-[#BFF367]">BMSPORTZ?</span>
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
 <div key={f.title} className="bms-card group rounded-[8px] border overflow-hidden flex flex-col" style={{ backgroundColor: "#111", borderColor: BDR }}>
 <div className="relative h-48 overflow-hidden shrink-0">
 <img src={f.img} alt={f.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
 <div className="absolute inset-0 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} />
 <div className="absolute top-4 left-4 w-10 h-10 rounded-[8px] flex items-center justify-center border backdrop-blur-md"
 style={{ borderColor: "rgba(132,204,22,0.4)", backgroundColor: "rgba(0,0,0,0.6)" }}>
 <f.icon size={18} style={{ color: PRI }} />
 </div>
 </div>
 <div className="p-6 flex flex-col flex-1">
 <h3 className="font-display text-2xl mb-2 group-hover:text-[#BFF367] transition-colors leading-none uppercase">{f.title}</h3>
 <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{f.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 */}




 </div>

 <InterestsModal
 isOpen={showInterests}
 onClose={() => setShowInterests(false)}
 onSaved={(sports) => {
 dispatch(updateUser({ sportTypes: sports }));
 setShowInterests(false);
 }}
 />

 {/* ── REEL MODAL ── */}
 {activeReel && (
   <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
     <button 
       onClick={() => setActiveReel(null)}
       className="absolute top-6 right-6 z-[10000] p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
     >
       <X size={24} />
     </button>
     <div className="w-full max-w-[450px] h-[100dvh] md:h-[90vh] relative bg-[#111] md:rounded-[16px] overflow-hidden flex items-center justify-center shadow-2xl border border-white/10">
       {/* Reel Video Player */}
       <video
         src={activeReel.video || activeReel.videoUrl || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
         className="w-full h-full object-cover"
         autoPlay
         controls
         loop
         playsInline
       />
       {/* Gradient Overlay for Text */}
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
       
       {/* Reel Info */}
       <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
         <h3 className="text-white font-bold text-lg mb-2">{activeReel.title || "Social Arena Reel"}</h3>
         <div className="flex items-center gap-4 text-white/80">
           <div className="flex items-center gap-1.5">
             <Heart size={18} className="fill-white text-white" />
             <span className="text-sm font-bold">{activeReel.likes || "1.2k"}</span>
           </div>
           <div className="flex items-center gap-1.5">
             <MessageSquare size={18} />
             <span className="text-sm font-bold">{activeReel.comments || "84"}</span>
           </div>
         </div>
       </div>
     </div>
   </div>
 )}
 </div>
 );
}
