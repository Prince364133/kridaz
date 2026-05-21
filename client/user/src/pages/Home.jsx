import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import useTurfData from "../features/turf/hooks/useTurfData";
import { Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, User, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award, CheckCircle, Heart, MessageCircle, MessageSquare, MessageSquareShare, Share2, Info, Check, X, RefreshCcw, Timer, Zap, Plus, Loader2, LayoutGrid, Video } from "lucide-react";
import toast from "react-hot-toast";
import { AdBannerSection } from "../shared/components/Marketing/AdBannerSection";
import { VideoSection } from "../shared/components/Marketing/VideoSection";
import BlogSection from "../shared/components/Blogs/BlogSection";
import TurfCard from "../features/turf/components/TurfCard";
import SearchPlayers from "../shared/components/search/SearchPlayers";
import SearchTurf from "../shared/components/search/SearchTurf";
import InterestsModal from "../shared/components/modals/InterestsModal";
import { updateUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const PRI = "#55DEE8";
const GRAD = "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)";
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
 style={{ backgroundImage: `radial-gradient(#84CC16 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

 <div className="relative w-full px-4 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center pt-4 md:pt-0">
 <div className="space-y-4 lg:space-y-6 relative z-10">
 <div>
 <h1 className="uppercase" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: "700", fontSize: "clamp(40px, 6vw, 51.74px)", lineHeight: "1.14", letterSpacing: "0" }}>
 More Than <span style={{ color: "#84CC16" }}>Booking.</span><br />
 Where Players<br />Belong.
 </h1>
 <p className="font-script text-xl lg:text-2xl mt-2 lg:mt-3" style={{ color: "#84CC16" }}>where champions play</p>
 </div>
 <p className="opacity-70 max-w-xl mb-4 lg:mb-10" style={{ fontFamily: "'Inter', sans-serif", fontWeight: "300", fontSize: "20.04px", lineHeight: "119%", letterSpacing: "1.5%" }}>
 Discover premium sports venues, book your slot instantly, and connect with players across India.
 </p>

 <Link
 to={isLoggedIn ? "/venues" : "/signup"}
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
 <p className="font-display text-2xl text-primary leading-none" style={{ color: "#84CC16" }}>1M+</p>
 <p className="text-[10px] uppercase tracking-wider mt-1 opacity-60" style={{ color: "#fff" }}>Bookings Made</p>
 </div>
 </div>
 </div>
 </section>

 {/* ── QUICK LINKS ── */}
 <section className="border-y border-white/5 bg-black py-3 md:py-8">
 {/* Mobile: 2x2 grid | Desktop: single row */}
 <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:flex md:items-center md:justify-around gap-2 md:gap-6 w-full">
 <Link to="/leaderboard" className="flex items-center gap-2 group justify-center md:justify-start border border-white/5 md:border-0 rounded-lg py-2 md:py-0 px-2 md:px-0 bg-white/[0.02] md:bg-transparent hover:bg-white/5 md:hover:bg-transparent transition-colors">
 <Activity size={16} className="text-[#60A5FA] group-hover:scale-110 transition-transform md:w-6 md:h-6 shrink-0" />
 <span className="font-bold text-[11px] md:text-[20px] tracking-tight uppercase text-[#60A5FA] whitespace-nowrap font-inter">LIVE SCORE</span>
 </Link>

 <Link to="/join-games" className="flex items-center gap-2 group justify-center md:justify-start border border-white/5 md:border-0 rounded-lg py-2 md:py-0 px-2 md:px-0 bg-white/[0.02] md:bg-transparent hover:bg-white/5 md:hover:bg-transparent transition-colors">
 <Trophy size={16} className="text-[#F59E0B] group-hover:scale-110 transition-transform md:w-6 md:h-6 shrink-0" />
 <span className="font-bold text-[11px] md:text-[20px] tracking-tight uppercase text-[#F59E0B] whitespace-nowrap font-inter">JOIN TOURNAMENTS</span>
 </Link>

 <Link to="/players" className="flex items-center gap-2 group justify-center md:justify-start border border-white/5 md:border-0 rounded-lg py-2 md:py-0 px-2 md:px-0 bg-white/[0.02] md:bg-transparent hover:bg-white/5 md:hover:bg-transparent transition-colors">
 <Search size={16} className="text-[#84CC16] group-hover:scale-110 transition-transform md:w-6 md:h-6 shrink-0" />
 <span className="font-bold text-[11px] md:text-[20px] tracking-tight uppercase text-[#84CC16] whitespace-nowrap font-inter">FIND PLAYERS</span>
 </Link>

 <Link to="/community" className="flex items-center gap-2 group justify-center md:justify-start border border-white/5 md:border-0 rounded-lg py-2 md:py-0 px-2 md:px-0 bg-white/[0.02] md:bg-transparent hover:bg-white/5 md:hover:bg-transparent transition-colors">
 <Users size={16} className="text-[#A855F7] group-hover:scale-110 transition-transform md:w-6 md:h-6 shrink-0" />
 <span className="font-bold text-[11px] md:text-[20px] tracking-tight uppercase text-[#A855F7] whitespace-nowrap font-inter">COMMUNITY</span>
 </Link>
 </div>
 </section>






 {/* ── FIND YOUR ARENA ── */}
 <section className="py-6 lg:py-12 px-4 lg:px-12 w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 border-b border-white/5 pb-10">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#55DEE8] rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block"></div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
 Find Your <span className="text-[#55DEE8]">Arena</span>
 </h2>
 <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.4em] mt-4 font-inter">
 Premium Venue Discovery • Elite Sports Infrastructure
 </p>
 </div>
 </div>

 {/* Search Row */}
 <div className="flex flex-col gap-8 mb-16 w-full">
 <div className="w-full animate-fade-in relative z-20">
 <SearchTurf onSearch={handleTurfSearch} userLocation={userLocation} />
 </div>
 </div>

 {/* Venue grid — 5 per row, 2 rows max, sorted by highest rating */}
 {loading || turfLoading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
 {[...Array(10)].map((_, i) => (
 <div key={i} className="rounded-2xl border animate-pulse" style={{ height: 260, backgroundColor: "#111", borderColor: BDR }} />
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
 className="px-8 py-3 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(85,222,232,0.2)]" style={{ background: "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)" }}
 >
 View All Venues
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
 {[...(turfs || [])]
 .sort((a, b) => (b.averageRating ?? b.rating ?? 0) - (a.averageRating ?? a.rating ?? 0))
 .slice(0, 10)
 .map((t) => (
 <TurfCard 
 key={t._id} 
 turf={t} 
 distance={t.distance ? `${t.distance} km` : "1.2 km"}
 />
 ))}
 </div>
 )}

 <div className="text-center mt-6 lg:mt-10">
 <Link to="/venues" className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-full border transition-all hover:border-[#55DEE8] hover:text-[#55DEE8]"
 style={{ borderColor: BDR, color: "#888" }}>
 View All Venues <ChevronRight size={16} />
 </Link>
 </div>
 </section>

 {/* ── FIND PLAYERS NEAR YOU ── */}
 <section className="py-6 lg:py-12 px-4 lg:px-12" style={{ backgroundColor: "#0A0A0A" }}>
 <div className="w-full">
 {/* Refined Section Header */}
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-8">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#55DEE8] rounded-full shadow-[0_0_20px_rgba(85,222,232,0.4)] hidden md:block"></div>
 <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
 Find Players <span className="text-[#55DEE8]">Near You</span>
 </h2>
 <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-3 font-inter">
 Global Talent Network • Skill-Matched Athletes
 </p>
 </div>
 
 </div>

 {/* Player cards — 10 in one scrollable row */}
 {loading ? (
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
 {[...Array(10)].map((_, i) => (
 <div key={i} className="shrink-0 w-[160px] md:w-[190px] rounded-[28px] border border-white/5 animate-pulse bg-white/5" style={{ height: 260 }} />
 ))}
 </div>
 ) : players.length === 0 ? (
 <div className="text-center py-12" style={{ color: "#888" }}>
 <Users size={40} className="mx-auto mb-3 opacity-30" />
 <p className="font-display text-2xl">No Players Yet</p>
 <p className="text-sm mt-1">Be the first to join the community!</p>
 <Link to="/signup" className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full"
 style={{ background: "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)" }}>Join Now</Link>
 </div>
 ) : (
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
 {players.slice(0, 10).map(p => {
 const initials = p.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
 const isFollowing = followingIds.includes(p._id);
 
 return (
 <div key={p._id} className="shrink-0 w-[160px] md:w-[190px] group">
 <div className="relative bg-[#121212] rounded-[28px] p-2.5 border border-white/5 transition-all duration-500 hover:border-[#55DEE8]/20 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
 {/* Profile Image */}
 <Link to={`/profile/${p._id}`} className="relative aspect-[1/1.1] rounded-[20px] overflow-hidden block mb-4">
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
 <span className="text-[#55DEE8] font-black text-5xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity duration-500">
 {initials}
 </span>
 </div>
 </div>
 </Link>

 {/* Content Section */}
 <div className="px-2 pb-1.5">
 <div className="flex items-center gap-1.5 mb-1">
 <Link to={`/profile/${p._id}`}>
 <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-[#55DEE8] transition-colors line-clamp-1 font-open-sans">
 {p.name || "Anonymous"}
 </h3>
 </Link>
 <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
 <Check size={8} strokeWidth={4} className="text-white" />
 </div>
 </div>
 
 <p className="text-white/30 text-[10px] font-medium leading-tight mb-4 line-clamp-2 flex items-center gap-1.5">
 <MapPin size={10} className="text-[#55DEE8]" /> {p.distance ? `${(p.distance/1000).toFixed(1)} km Away` : (p.city || "Nearby Player")}
 </p>

 {/* Bottom Bar */}
 <div className="flex items-center justify-between">
 <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/50 uppercase tracking-widest truncate max-w-[80px]">
 {p.preferredSport || "ATHLETE"}
 </div>

 <button 
 onClick={(e) => handleFollowToggle(e, p)}
 className={`px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-wider transition-all duration-300
 ${isFollowing 
 ? 'bg-white/5 border border-white/10 text-white/30 hover:bg-white/10' 
 : 'bg-[#222] border border-white/5 text-white hover:bg-white hover:text-black shadow-lg'}`}
 >
 {isFollowing ? 'Following' : 'Follow +'}
 </button>
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
 <Link to="/players" className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-full border transition-all hover:border-[#55DEE8] hover:text-[#55DEE8]"
 style={{ borderColor: BDR, color: "#888" }}>
 View More Players <ChevronRight size={16} />
 </Link>
 </div>
 </div>
 </section>



 {/* ── AD BANNERS ── */}
 <AdBannerSection banners={marketing.banners} />

 {/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}
 {featureFlags['join_games'] && (
 <section className="py-6 lg:py-12 px-4 lg:px-12" style={{ backgroundColor: "#0A0A0A" }}>
 <div className="w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-10">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#55DEE8] rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block"></div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
 JOIN <span className="text-[#55DEE8]">GAMES</span>
 </h2>
 <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-4 font-inter">
 Community Matchmaking • No Team? No Problem.
 </p>
 </div>

 <Link to="/join-games" className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-[#55DEE8] hover:text-black hover:border-[#55DEE8] transition-all duration-500">
 <span className="text-[11px] font-black uppercase tracking-widest">View More Games</span>
 <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
 <ChevronRight size={14} />
 </div>
 </Link>
 </div>

 {/* Location Filters */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#55DEE8] transition-colors pointer-events-none" size={18} />
 <select
 value={selectedHomeState}
 onChange={(e) => {
 setSelectedHomeState(e.target.value);
 setSelectedHomeCity("");
 }}
 disabled={loadingStates}
 className="w-full bg-[#111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#55DEE8] outline-none transition-all font-bold disabled:opacity-50"
 >
 <option value="">{loadingStates ? 'Loading States...' : 'Select State'}</option>
 {states.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>

 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#55DEE8] transition-colors pointer-events-none" size={18} />
 <select
 value={selectedHomeCity}
 onChange={(e) => setSelectedHomeCity(e.target.value)}
 disabled={!selectedHomeState || loadingCities}
 className="w-full bg-[#111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#55DEE8] outline-none transition-all font-bold disabled:opacity-50"
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
 <div key={i} className="min-w-[75vw] md:min-w-0 snap-center h-[360px] rounded-3xl bg-neutral-900 border animate-pulse" style={{ borderColor: BDR }} />
 ))
 ) : hostedGames.length === 0 ? (
 <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-3xl">
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
 <div className="relative rounded-[28px] overflow-hidden border border-white/10 flex flex-col"
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
 <div className="px-3 py-1 bg-[#55DEE8]/20 border border-[#55DEE8]/40 rounded-full inline-flex">
 <span className="text-[9px] font-black text-[#55DEE8] uppercase tracking-widest">{g.gameType}</span>
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
 className="px-2.5 py-1 bg-black/50 border border-white/15 hover:border-[#55DEE8]/40 rounded-full inline-flex items-center gap-1 transition-all"
 title="Click to copy"
 >
 <Info size={9} className="text-[#55DEE8]/70" />
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
 className="p-1.5 bg-black/50 border border-white/15 hover:border-[#55DEE8]/40 rounded-full flex items-center justify-center transition-all"
 title="Share Match"
 >
 <Share2 size={10} className="text-[#55DEE8]/70" />
 </button>
 </div>
 </div>
 <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
 <span className="text-[10px] font-black text-[#55DEE8]">₹</span>
 <span className="text-xs font-black text-white">{g.perPlayerCharge || 'FREE'}</span>
 </div>
 </div>

 {/* Rivalry ledger */}
 <div className="flex items-center gap-2 mt-1">
 <div className="h-px flex-1 bg-[#55DEE8]/20" />
 <span className="text-[8px] font-black text-[#55DEE8]/60 uppercase tracking-[0.2em]">✦ {isQuick ? 'Casual Pool' : 'Rivalry Ledger'}</span>
 <div className="h-px flex-1 bg-[#55DEE8]/20" />
 </div>

 {/* Team matchup */}
 <div className="flex-1">
 <h3 className="text-white font-black uppercase leading-tight tracking-tighter text-xl">
 {isQuick ? (
 <>Casual {g.gameType} Match</>
 ) : (
 <>{g.teams?.teamA?.name || 'Team A'}{' '}
 <span className="text-[#55DEE8] ">VS</span>{' '}
 {g.teams?.teamB?.name || 'Team B'}</>
 )}
 </h3>
 <div className="flex items-center gap-1.5 mt-1.5">
 <MapPin size={10} className="text-[#55DEE8]" />
 <span className="text-[10px] text-white/50 truncate">
 {g.ground?.name || g.city || 'Self-Arranged Venue'}
 </span>
 </div>
 </div>

 {/* Date + Time pills */}
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-black/50 border border-white/10 rounded-xl px-3 py-2">
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Kickoff Date</p>
 <p className="text-sm font-black text-white">{dateLabel}</p>
 </div>
 <div className="bg-black/50 border border-white/10 rounded-xl px-3 py-2">
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Precision Time</p>
 <p className="text-sm font-black text-white">{g.time || '—'}</p>
 </div>
 </div>

 {/* Open slots + avatar row */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Users size={12} className="text-[#55DEE8]" />
 <div>
 <span className="text-sm font-black text-white">{openSlots} Open</span>
 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">Available Capacity</p>
 </div>
 </div>
 {/* Slot avatar dots */}
 <div className="flex gap-1">
 {Array.from({ length: Math.min(totalSlots, 5) }).map((_, idx) => (
 <div key={idx}
 className={`w-5 h-5 rounded-full border ${idx < (totalSlots - openSlots) ? 'bg-[#55DEE8]/30 border-[#55DEE8]/50' : 'bg-white/5 border-white/10'}`}
 />
 ))}
 </div>
 </div>

 {/* Host + JOIN */}
 <div className="flex items-center justify-between mt-1">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-[#55DEE8]/20 border border-[#55DEE8]/40 flex items-center justify-center">
 <span className="text-[10px] font-black text-[#55DEE8]">{hostInitial}</span>
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
 className="flex items-center gap-2 text-black px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(85,222,232,0.4)] hover:scale-105"
 style={{ background: "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)" }}
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

 {/* ── FIND PROFESSIONALS (Feature Flag) ── */}
 {featureFlags['find_professionals'] && (
 <section className="py-6 lg:py-12 px-4 lg:px-12 border-b" style={{ backgroundColor: "#000", borderColor: "#1A1A1A" }}>
 <div className="w-full">
 <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-10">
 <div className="relative">
 <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#55DEE8] rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block"></div>
 <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
 PRO <span className="text-[#55DEE8]">EXPERTS</span>
 </h2>
 <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-4 font-inter">
 Certified Coaching • Professional Officiating
 </p>
 </div>

 {/* Refined Tabs */}
 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
 {["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS"].map((tab, i) => (
 <button 
 key={tab} 
 className={`px-6 py-2.5 rounded-full font-black text-[10px] shrink-0 transition-all duration-300 uppercase tracking-widest border
 ${i === 0 
 ? "text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]" 
 : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"}`} style={i === 0 ? { background: "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)", borderColor: "#55DEE8" } : {}}
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
 <div key={i} className="aspect-[1/1.3] rounded-[20px] bg-white/5 border border-white/5 animate-pulse" />
 ))
 ) : professionals.length === 0 ? (
 <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[40px]">
 <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">No professionals active in your area</p>
 </div>
 ) : (
 professionals.slice(0, 8).map((pro) => (
 <div 
 key={pro._id} 
 className="group cursor-pointer"
 onClick={() => navigate(`/professionals/${pro._id}`)}
 >
 <div className="relative bg-[#121212] rounded-[20px] p-1.5 border border-white/5 transition-all duration-500 hover:border-[#55DEE8]/20 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
 
 {/* Compact Profile Image Section */}
 <div className="relative aspect-[1/1.2] rounded-[15px] overflow-hidden block mb-2.5">
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
 <span className="text-[#55DEE8] font-black text-3xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity duration-500">
 {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
 </span>
 </div>
 </div>
 
 {/* Price Badge */}
 <div className="absolute top-2 right-2 z-20">
 <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#55DEE8] text-[8px] font-bold shadow-lg">
 ₹{pro.price || "500"}/{pro.role === "coach" ? "hr" : "match"}
 </div>
 </div>

 {/* Role Badge */}
 <div className="absolute top-2 left-2 z-20">
 <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[8px] font-black tracking-widest gap-1 shadow-lg">
 {pro.role === 'umpire' ? <Shield size={8} className="text-[#55DEE8]" /> : 
 pro.role === 'streamer' ? <Video size={8} className="text-[#55DEE8]" /> : 
 pro.role === 'scorer' ? <Activity size={8} className="text-[#55DEE8]" /> : 
 <Award size={8} className="text-[#55DEE8]" />}
 <span className="text-[#55DEE8]">{pro.role?.toUpperCase()}</span>
 </div>
 </div>
 </div>

 {/* Content Section */}
 <div className="px-1.5 pb-1">
 <div className="flex items-center gap-1 mb-0.5">
 <h3 className="text-white font-bold text-[13px] tracking-tight group-hover:text-[#55DEE8] transition-colors line-clamp-1 font-open-sans capitalize">
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
 <Star size={12} className="text-[#55DEE8] fill-[#55DEE8]" />
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
 className="px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-300 text-black hover:scale-105 shadow-[0_0_15px_rgba(85,222,232,0.3)]"
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

 {/* ── BENTO GRID ── */}
 <section className="pt-10 lg:pt-20 pb-4 lg:pb-6 px-4 lg:px-12 w-full">
 <div className="text-center mb-8 lg:mb-14">
 <h2 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase leading-[0.9]">
 ALL IN ONE <span className="text-gray-500">SPORTS</span><br />
 EXPERIENCE <span className="inline-block px-4 py-2 ml-2 align-middle rounded-full font-script text-3xl md:text-4xl text-black shadow-[0_0_25px_rgba(85,222,232,0.4)]" style={{ background: GRAD }}>Powered by AI ✨</span>
 </h2>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: "400px" }}>
 {/* Left Large Card */}
 <div className="lg:col-span-1 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-end min-h-[300px]" style={{ background: "linear-gradient(135deg, #001f22, #0a0a0a)", border: `1px solid ${BDR}` }}>
 <div className="absolute top-6 left-6 w-12 h-12 rounded-2xl flex items-center justify-center z-20" style={{ background: GRAD }}>
 <BookOpen size={20} style={{ color: "#000" }} />
 </div>
 <div className="absolute right-0 top-0 w-3/4 h-3/4 bg-no-repeat bg-contain bg-right-top z-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80')", opacity: 0.3 }} />
 <div className="relative z-20">
 <h3 className="font-display text-5xl mb-2 leading-none">BOOK VENUES</h3>
 <p className="text-gray-400 mb-6 max-w-sm">Find the perfect spot for Cricket, Football, Swimming, and more.</p>
 <div className="flex flex-wrap gap-2 mb-6">
 {["Cricket", "Football", "Swimming", "Badminton"].map(t => (
 <span key={t} className="px-4 py-1.5 rounded-full text-xs font-bold border" style={{ borderColor: BDR, backgroundColor: "rgba(255,255,255,0.05)" }}>{t}</span>
 ))}
 </div>
 <Link to="/venues" className="inline-block text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(85,222,232,0.3)]" style={{ background: GRAD }}>Find Venues</Link>
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
 <span className="text-[#55DEE8] font-bold text-xs uppercase tracking-widest flex items-center gap-1"><Trophy size={14} /> COMPETITIVE</span>
 </div>
 <div>
 <h3 className="font-display text-4xl mb-1 leading-none">CHALLENGE<br />PLAYERS</h3>
 <p className="text-gray-400 text-sm mb-4">Skill-matched opponents.</p>
 </div>
 </div>
 </div>
 {/* Join Games Promo */}
 <Link to="/join-games" className="rounded-3xl p-6 relative border flex flex-col justify-between min-h-[200px] overflow-hidden group transition-all hover:border-[#55DEE8]/50" style={{ borderColor: BDR, backgroundColor: "#000" }}>
 {/* Background Image */}
 <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80')", opacity: 0.45 }} />
 {/* Dark overlay */}
 <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.85) 40%, rgba(85,222,232,0.08) 100%)" }} />
 {/* Hover glow */}
 <div className="absolute inset-0 bg-gradient-to-br from-[#55DEE8]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

 <div className="relative z-10 flex flex-col h-full">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors group-hover:border-[#55DEE8]/30 group-hover:bg-[#55DEE8]/10" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" }}>
 <Users size={14} className="text-[#55DEE8]" />
 </div>
 <h3 className="font-display text-xl uppercase group-hover:text-[#55DEE8] transition-colors">JOIN GAMES</h3>
 </div>
 <ChevronRight size={20} className="text-gray-500 group-hover:text-[#55DEE8] transition-all duration-300 group-hover:translate-x-1" />
 </div>

 <div className="flex-1 space-y-3">
 <div className="h-full flex flex-col justify-center py-2">
 <p className="text-lg font-bold mb-2 text-white">No Team? No Problem.</p>
 <p className="text-xs text-gray-400 leading-relaxed max-w-[90%]">Find local pickup games, join open matches, and play your favorite sports today.</p>
 <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#55DEE8]">
 Find Games Near You
 </div>
 </div>
 </div>
 </div>
 </Link>
 </div>

 {/* Marketplace, Coaches, Umpires */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* Featured Community Highlight */}
 <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#55DEE8] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
 {realSocialPosts[0]?.image ? (
 <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${realSocialPosts[0].image})` }} />
 ) : (
 <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80')" }} />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
 <div className="relative z-10 flex flex-col h-full justify-between">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: "transparent", background: GRAD }}>
 <Zap size={16} style={{ color: "#000" }} />
 </div>
 <div>
 <span className="text-[8px] font-bold text-[#55DEE8] uppercase tracking-widest mb-1 block">Trending Now</span>
 <h3 className="font-display text-xl mb-1 leading-tight uppercase truncate">{realSocialPosts[0]?.title || "SOCIAL ARENA"}</h3>
 <p className="text-gray-400 text-[10px] mb-4 line-clamp-1">{realSocialPosts[0]?.content || "Check out what's happening in the field."}</p>
 
 </div>
 </div>
 </div>

 {/* Coaches */}
 <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#55DEE8] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
 <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80')" }} />
 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
 <div className="relative z-10 flex flex-col h-full justify-between">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: "transparent", background: GRAD }}>
 <Award size={20} style={{ color: "#000" }} />
 </div>
 <div>
 <h3 className="font-display text-2xl mb-1 leading-none uppercase">PRO COACHES</h3>
 <p className="text-gray-400 text-xs mb-4">Expert training.</p>
 <Link to="/professionals" className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#55DEE8] transition-colors">Find Coach <ArrowRight size={14} /></Link>
 </div>
 </div>
 </div>

 {/* Umpires */}
 <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#55DEE8] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
 <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&q=80')" }} />
 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
 <div className="relative z-10 flex flex-col h-full justify-between">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: "transparent", background: GRAD }}>
 <Shield size={20} style={{ color: "#000" }} />
 </div>
 <div>
 <h3 className="font-display text-2xl mb-1 leading-none uppercase">OFFICIALS</h3>
 <p className="text-gray-400 text-[10px] mb-4 uppercase tracking-tighter">Umpires • Scorers • Streamers</p>
 <Link to="/professionals" className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#55DEE8] transition-colors">Hire Now <ArrowRight size={14} /></Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* ── SOCIAL ARENA ── */}
 <section className="pt-4 lg:pt-6 pb-4 lg:pb-6 w-full overflow-hidden">
 <div className="w-full px-4 lg:px-12">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 lg:mb-10 gap-4">
 <div>
 <h2 className="font-display text-2xl sm:text-3xl md:text-5xl uppercase flex items-center gap-2 md:gap-3">
 Your <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Social Arena</span> <Info className="w-4 h-4 md:w-5 md:h-5 text-gray-600 cursor-help shrink-0" />
 </h2>
 <p className="text-gray-400 mt-2 text-sm md:text-base">Swipe to see what's happening in the field</p>
 </div>
 
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



 {/* ── WHY CHOOSE BMSPORTZ ── */}
 {/* Hiding section as per user request */}
 {/* 
 <section className="pt-4 lg:pt-6 pb-6 lg:pb-12 w-full overflow-hidden">
 <div className="w-full px-4 lg:px-12">
 <div className="text-center">
 <h2 className="text-5xl md:text-8xl font-bold uppercase leading-none tracking-tight">
 WHY CHOOSE <span className="text-[#55DEE8]">BMSPORTZ?</span>
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
 <h3 className="font-display text-2xl mb-2 group-hover:text-[#55DEE8] transition-colors leading-none uppercase">{f.title}</h3>
 <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{f.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 */}



 {/* ── APP DOWNLOAD SECTION ── */}
 <section className="pt-6 lg:pt-10 pb-12 lg:pb-24 relative overflow-hidden px-4 lg:px-12">
 <div className="max-w-full mx-auto">
 <div className="bg-gradient-to-br from-[#0D0D0D] to-black border-y lg:border lg:rounded-[3rem] p-8 md:p-24 overflow-hidden relative" style={{ borderColor: BDR }}>
 <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">

 {/* Left Side: Mockup */}
 <div className="relative order-2 lg:order-1 mt-12 lg:mt-0">
 <div className="relative group">
 <div className="absolute -inset-10 bg-primary/5 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
 <img
 src="/sports_app_mockup_1777351423147.png"
 alt="Kridaz App Mockup"
 className="relative w-full max-w-2xl mx-auto transform scale-[1.5] sm:scale-110 lg:scale-150 -rotate-6 hover:rotate-0 transition-all duration-700"
 />
 </div>
 </div>

 {/* Right Side: Content */}
 <div className="order-1 lg:order-2 text-center lg:text-left">
 <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full mb-8" style={{ background: GRAD }}>
 <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
 <span className="text-[10px] font-bold tracking-widest text-black uppercase">Mobile App Coming Soon</span>
 </div>

 <h2 className="text-5xl md:text-7xl font-bold uppercase leading-[0.9] mb-8 tracking-tight">
 BOOK <span className="text-white/20">•</span> PLAY <span className="text-white/20">•</span> <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>WIN</span>
 </h2>

 <p className="text-gray-400 text-base md:text-xl mb-12 max-w-xl mx-auto lg:mx-0">
 Take the ecosystem anywhere. Book slots, join matches, and track your stats.
 </p>

 <div className="flex flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start w-full">
 {/* Google Play Button */}
 <div className="relative group flex-1 sm:flex-none">
 <div className="absolute -top-2 -right-1 sm:-right-2 z-20 text-black text-[6px] sm:text-[9px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap" style={{ background: GRAD }}>
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
 <div className="absolute -top-2 -right-1 sm:-right-2 z-20 text-black text-[6px] sm:text-[9px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap" style={{ background: GRAD }}>
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
 <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border shrink-0" style={{ borderColor: "transparent", background: GRAD }}>
 <item.icon className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: "#000" }} />
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
