import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../hooks/useAxiosInstance";
import useTurfData from "../hooks/useTurfData";
import { Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award, CheckCircle, Heart, MessageCircle, Share2, Info, Check, X, RefreshCcw, Timer, Zap, Plus } from "lucide-react";
import { AdBannerSection } from "../components/Marketing/AdBannerSection";
import { VideoSection } from "../components/Marketing/VideoSection";
import BlogSection from "../components/Blogs/BlogSection";

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
  { image: "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200", span: "md:col-span-2 md:row-span-1" }, // Stadium
  { image: "https://images.pexels.com/photos/159515/football-american-football-runner-player-159515.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-2 md:row-span-1" }, // Football Action
  { image: "https://images.pexels.com/photos/1080884/pexels-photo-1080884.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-1 md:row-span-2" }, // Basketball
  { image: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-1 md:row-span-2" }, // Tennis
  { image: "https://images.pexels.com/photos/3651674/pexels-photo-3651674.jpeg?auto=compress&cs=tinysrgb&w=1200", span: "md:col-span-2 md:row-span-2" }, // Cricket/Baseball
  { image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-1 md:row-span-2" }, // Gym
  { image: "https://images.pexels.com/photos/163444/sport-treadmill-training-fitness-163444.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-2 md:row-span-1" }, // Running
  { image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800", span: "md:col-span-2 md:row-span-1" }, // Sports Gear
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

const sports = [
  { name: 'CRICKET', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop' },
  { name: 'FOOTBALL', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop' },
  { name: 'BADMINTON', img: 'https://images.unsplash.com/photo-1626225967041-96424b05421d?q=80&w=1000&auto=format&fit=crop' },
  { name: 'TENNIS', img: 'https://images.unsplash.com/photo-1622279457486-62dcc4a4bd13?q=80&w=1000&auto=format&fit=crop' },
  { name: 'SWIMMING', img: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1000&auto=format&fit=crop' },
  { name: 'BASKETBALL', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop' },
  { name: 'VOLLEYBALL', img: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1000&auto=format&fit=crop' },
];

// player skill levels based on booking count
const getLevel = (count) => {
  if (count >= 20) return { label: "PRO", color: PRI };
  if (count >= 5) return { label: "MED", color: "#F59E0B" };
  return { label: "BEGINNER", color: "#60A5FA" };
};

// initials avatar color
const avatarColors = ["#1a3300","#001a33","#330033","#331a00","#003333","#1a0033"];
const avatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || "#1a1a1a";

export default function Home() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const { turfs, loading: turfLoading, error } = useTurfData();
  const [activeTab, setActiveTab] = useState("venues");
  const [players, setPlayers] = useState([]);
  const [turfSearch, setTurfSearch] = useState("");
  const [venues, setVenues] = useState([]);
  const [marketing, setMarketing] = useState({ banners: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, marketingRes, playersRes] = await Promise.all([
          axiosInstance.get("/api/features"),
          axiosInstance.get("/api/features/marketing"),
          axiosInstance.get("/api/user/players").catch(() => ({ data: { players: [] } }))
        ]);
        setMarketing(marketingRes.data || { banners: [], videos: [] });
        setFeatureFlags(venuesRes.data.flagsMap || {});
        setPlayers(playersRes.data.players || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTurfs = (turfs || []).filter(t =>
    !turfSearch || 
    t.name?.toLowerCase().includes(turfSearch.toLowerCase()) ||
    t.sportTypes?.some(s => s.toLowerCase().includes(turfSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#000" }}>

      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] lg:min-h-screen flex items-start lg:items-center pt-16 lg:pt-20 overflow-hidden">
        {/* Right-Aligned Cinematic Background */}
        <div className="absolute right-0 top-0 w-full lg:w-[85%] h-full z-0 pointer-events-none flex items-center justify-end">
          <div className="relative h-[92%] w-auto transform lg:scale-[1.75] origin-right translate-y-64">
            <img 
              src="/hero%20image.png" 
              alt="Hero Background" 
              className="h-full w-auto object-contain opacity-60 brightness-[70%]"
            />
            {/* Fade to black on the left to blend with text area */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </div>
        </div>

        <div className="absolute inset-0 opacity-[0.05] z-1"
          style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none z-1" />

        <div className="relative max-w-full mx-auto px-10 lg:px-20 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <h1 className="font-display leading-[0.85] tracking-tighter uppercase" style={{ fontSize: "clamp(3rem,8vw,6.5rem)" }}>
                More Than <span style={{ color: PRI }}>Booking.</span><br />
                Where Players<br />Belong.
              </h1>
              <p className="font-script text-2xl mt-3" style={{ color: PRI }}>where champions play</p>
            </div>
            <p className="text-xl opacity-70 max-w-xl leading-relaxed mb-6 lg:mb-10">
              Discover premium sports venues, book your slot instantly, and connect with players across India.
            </p>

            <Link 
              to={isLoggedIn ? "/turfs" : "/signup"} 
              className="block w-fit group mb-6 lg:mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-bold group-hover:scale-105 transition-all text-base">
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

      {/* ── AD BANNERS ── */}
      <AdBannerSection banners={marketing.banners} />

      {/* ── STATS ── */}
      <section className="border-y" style={{ borderColor: "#1A1A1A", backgroundColor: "#0A0A0A" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1A1A1A]">
          {stats.map(s => (
            <div key={s.label} className="px-8 text-center">
              <p className="font-display text-4xl" style={{ color: PRI }}>{s.value}</p>
              <p className="font-mono text-xs uppercase tracking-wider mt-1" style={{ color: "#888" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FIND YOUR ARENA ── */}
      <section className="py-10 lg:py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-6 lg:mb-10">
          <h2 className="font-display text-6xl md:text-7xl leading-none uppercase">
            Find Your <span style={{ color: PRI }}>Arena</span>
          </h2>
          <p className="font-script text-xl mt-2" style={{ color: PRI }}>where champions play</p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className="flex gap-2 p-1.5 rounded-full border" style={{ borderColor: BDR, background: "#111" }}>
            {[{ key: "venues", label: "🏟 VENUES" }, { key: "marketplace", label: "🛒 MARKETPLACE" }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-7 py-2.5 rounded-full font-bold text-sm transition-all"
                style={activeTab === tab.key ? { backgroundColor: PRI, color: "#000" } : { color: "#fff" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6 lg:mb-10 flex-wrap justify-center">
          <div className="relative flex-1 min-w-[260px] max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: "#888" }} />
            <input type="text" placeholder="Search venues (cricket, swimming, etc)..."
              value={turfSearch} onChange={e => setTurfSearch(e.target.value)}
              className="bms-search w-full bg-[#111] border border-[#2a2a2a] rounded-full py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#84CC16]" />
          </div>
          <button className="px-8 py-3 rounded-full font-bold text-black text-sm hover:brightness-110 transition-all"
            style={{ backgroundColor: PRI }}>
            Search
          </button>
        </div>

        {/* Venue grid */}
        {loading || turfLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border animate-pulse" style={{ height: 320, backgroundColor: "#111", borderColor: BDR }} />
            ))}
          </div>
        ) : (error || filteredTurfs.length === 0) ? (
          <div className="text-center py-24 animate-fadeIn">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-600" />
            </div>
            <p className="font-display text-3xl mb-3 uppercase tracking-tight">Venues Not Found</p>
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-8">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredTurfs.slice(0, 8).map((t, i) => (
              <Link to={isLoggedIn ? `/turf/${t._id}` : "/login"} key={t._id} className="bms-card group flex flex-col no-underline bg-[#111] rounded-2xl border border-[#2a2a2a] overflow-hidden">
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img src={t.image || "/banner-1.png"}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/banner-1.png"; }}
                    alt={t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {i === 0 && <span className="absolute top-3 left-3 bg-[#84CC16] text-black text-xs font-bold px-2 py-1 rounded">Featured</span>}
                </div>
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <h3 className="font-display text-base uppercase tracking-wide text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">{t.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#888" }}>
                    <MapPin size={11} style={{ color: PRI }} />
                    <span className="truncate">{t.location || "—"}</span>
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
          <Link to={isLoggedIn ? "/turfs" : "/login"} className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-full border transition-all hover:border-[#84CC16] hover:text-[#84CC16]"
            style={{ borderColor: BDR, color: "#888" }}>
            View All Venues <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── VIDEO GALLERY ── */}
      <VideoSection videos={marketing.videos} />

      {/* ── BLOGS & ARTICLES ── */}
      <BlogSection />

      {/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}
      {featureFlags['join_games'] && (
        <section className="py-10 lg:py-20 px-6" style={{ backgroundColor: "#0A0A0A" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 lg:mb-8">
              <div>
                <h2 className="font-display text-[26px] sm:text-4xl md:text-6xl uppercase leading-none text-white flex items-center gap-2 md:gap-3 whitespace-nowrap">
                  JOIN <span style={{ color: PRI }}>GAMES NEAR YOU</span>
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest mt-2" style={{ color: "#888" }}>
                  No team? No problem. Find your people. Build your network. Play together.
                </p>
              </div>
              <Link to={isLoggedIn ? "/turfs" : "/login"} className="text-sm font-bold flex items-center gap-2 hover:text-[#84CC16] transition-colors" style={{ color: "#888" }}>
                View More Games <ChevronRight size={16} />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {["ALL SPORTS", "BADMINTON", "CRICKET", "FOOTBALL", "TENNIS", "PICKLEBALL"].map((tab, i) => (
                <button key={tab} className="px-6 py-2 rounded-full font-bold text-xs shrink-0 transition-colors border"
                  style={i === 0 ? { backgroundColor: PRI, color: "#000", borderColor: PRI } : { backgroundColor: "transparent", color: "#888", borderColor: BDR }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Game Cards */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 md:pb-0">
              {[
                { time: "6:00-9:00 pm", status: "Joined", statusColor: "#4ADE80", name: "Sampad", sport: "CRICKET", loc: "Malakpet, Hyderabad", dist: "+ 2.1km Away", filled: 2, total: 11, img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80" },
                { time: "6:00-9:00 pm", status: "Started", statusColor: "#F97316", name: "Sunny", sport: "FOOTBALL", loc: "Malakpet, Hyderabad", dist: "+ 3.5km Away", filled: 6, total: 12, img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80" },
                { time: "6:00-9:00 pm", status: "Slot Full", statusColor: "#6B7280", name: "Srikar", sport: "BADMINTON", loc: "Malakpet, Hyderabad", dist: "+ 5km Away", filled: 4, total: 4, img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80" },
                { time: "6:00-9:00 pm", status: "Joined", statusColor: "#4ADE80", name: "Prince", sport: "CRICKET", loc: "Malakpet, Hyderabad", dist: "+ 9km Away", filled: 2, total: 11, img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80" },
              ].map((game, i) => (
                <div key={i} className="min-w-[75vw] md:min-w-0 snap-center relative rounded-3xl overflow-hidden border group shrink-0 md:shrink" style={{ height: "360px", borderColor: BDR }}>
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
                        <span className="flex items-center gap-1 text-gray-300"><MapPin size={10} style={{color: PRI}}/> {game.loc}</span>
                        <span className="font-bold" style={{ color: PRI }}>{game.dist}</span>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                        <span className="flex items-center gap-1"><Users size={10} style={{ color: PRI }} /> {game.filled}/{game.total} Going</span>
                        <span>{Math.round((game.filled/game.total)*100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ backgroundColor: PRI, width: `${(game.filled/game.total)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FIND PLAYERS NEAR YOU ── */}
      <section className="py-10 lg:py-20 px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-6 mb-2 lg:mb-3">
            <div>
              <h2 className="font-display text-5xl md:text-6xl uppercase leading-none">
                Find Players <span style={{ color: PRI }}>Near You</span>
              </h2>
              <p className="font-mono text-xs uppercase tracking-widest mt-2" style={{ color: "#888" }}>
                Connect with athletes in your neighborhood
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Karnataka", "Bengaluru", "5 KM Radius"].map(f => (
                <div key={f} className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold"
                  style={{ borderColor: BDR, color: "#888", backgroundColor: "#111" }}>
                  <MapPin size={12} style={{ color: PRI }} /> {f}
                </div>
              ))}
              <button className="px-6 py-2 rounded-full font-bold text-black text-xs"
                style={{ backgroundColor: PRI }}>SEARCH</button>
            </div>
          </div>

          {/* Player cards */}
          {loading ? (
            <div className="flex gap-4 overflow-x-auto py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shrink-0 w-52 h-48 rounded-2xl border animate-pulse"
                  style={{ backgroundColor: "#111", borderColor: BDR }} />
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
            <div className="flex gap-4 overflow-x-auto pb-4 mt-6" style={{ scrollbarWidth: "none" }}>
              {players.map(p => {
                const level = getLevel(p.bookingCount);
                const initials = p.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
                return (
                  <div key={p._id} className="shrink-0 w-52 rounded-2xl border p-4 flex flex-col gap-3 group hover:-translate-y-1 transition-all"
                    style={{ backgroundColor: "#111", borderColor: BDR }}>
                    {/* Level badge + avatar */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-black border-2"
                          style={{ backgroundColor: avatarColor(p.name), borderColor: BDR, color: "#fff" }}>
                          {initials}
                        </div>
                        <span className="absolute -top-1 -left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-black"
                          style={{ backgroundColor: level.color }}>{level.label}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm uppercase tracking-wide truncate group-hover:text-[#84CC16] transition-colors">{p.name}</p>
                        <p className="text-xs" style={{ color: "#888" }}>{p.bookingCount} bookings</p>
                      </div>
                    </div>

                    {/* Sport tags placeholder */}
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-[#1a1a1a] text-white text-[10px] px-2 py-0.5 rounded border border-[#2a2a2a] uppercase">Cricket</span>
                      <span className="bg-[#1a1a1a] text-white text-[10px] px-2 py-0.5 rounded border border-[#2a2a2a] uppercase">Football</span>
                    </div>

                    {/* Joined */}
                    <p className="text-xs" style={{ color: "#555" }}>
                      Joined {new Date(p.createdAt || p.joinedAt || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>

                    {/* CTA */}
                    <button className="w-full mt-auto py-2 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-[#84CC16] hover:text-[#84CC16]"
                      style={{ borderColor: BDR, color: "#aaa" }}>
                      <Users size={12} /> Invite to Play
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FIND PROFESSIONALS (Feature Flag) ── */}
      {featureFlags['find_professionals'] && (
        <section className="py-10 lg:py-20 px-6 border-b" style={{ backgroundColor: "#000", borderColor: "#1A1A1A" }}>
          <div className="max-w-7xl mx-auto">
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
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 md:pb-0">
              {[
                { name: "ROGER FEDERER", exp: "20+ Years", spec: "Grand Slam Expert", price: "₹5,000/hr", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80", rating: "5.0 (500 reviews)" },
                { name: "SARAH WILLIAMS", exp: "10+ Years", spec: "Fitness & Conditioning", price: "₹2,500/hr", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80", rating: "4.9 (320 reviews)" },
                { name: "VIRAT KOHLI", exp: "15+ Years", spec: "Masterclass Batting", price: "₹10,000/hr", img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&q=80", rating: "5.0 (1k+ reviews)" },
                { name: "JOHN DOE", exp: "8+ Years", spec: "Certified Umpire", price: "₹1,000/match", img: "https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=400&q=80", rating: "4.8 (150 reviews)" },
              ].map((pro, i) => (
                <div key={i} className="min-w-[75vw] md:min-w-0 snap-center rounded-3xl border overflow-hidden flex flex-col group shrink-0 md:shrink" style={{ backgroundColor: "#111", borderColor: BDR }}>
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
      <section className="py-10 lg:py-20 px-6 max-w-7xl mx-auto">
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
               <Link to={isLoggedIn ? "/turfs" : "/login"} className="inline-block bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors">Find Venues</Link>
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
                     <h3 className="font-display text-4xl italic mb-1 leading-none">CHALLENGE<br/>PLAYERS</h3>
                     <p className="text-gray-400 text-sm mb-4">Skill-matched opponents.</p>
                     <Link to={isLoggedIn ? "/turfs" : "/login"} className="font-bold text-white flex items-center gap-2 hover:text-[#84CC16] transition-colors">Start Match <ArrowRight size={16} /></Link>
                   </div>
                 </div>
               </div>
               {/* Community */}
               <div className="rounded-3xl p-8 relative border flex flex-col justify-between min-h-[200px] overflow-hidden group" style={{ borderColor: BDR, backgroundColor: "#000" }}>
                 <div className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80')" }} />
                 <div className="absolute inset-0 bg-gradient-to-b from-[#1a2433]/80 to-black/90" />
                 <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                     <Users size={18} className="text-[#84CC16]" />
                   </div>
                   <div>
                     <h3 className="font-display text-4xl italic mb-1 leading-none">COMMUNITY</h3>
                     <p className="text-gray-400 text-sm mb-4">Join tribes & share wins.</p>
                     <Link to={isLoggedIn ? "/turfs" : "/login"} className="font-bold text-white flex items-center gap-2 hover:text-[#84CC16] transition-colors">Join Now <ArrowRight size={16} /></Link>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Marketplace, Coaches, Umpires */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
               {/* Marketplace */}
               <div className="rounded-3xl p-6 border flex flex-col justify-between min-h-[200px] group hover:border-[#84CC16] transition-all relative overflow-hidden" style={{ borderColor: BDR, backgroundColor: "#111" }}>
                 <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80')" }} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                 <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: PRI, backgroundColor: "rgba(132,204,22,0.1)" }}>
                     <ShoppingBag size={20} style={{ color: PRI }} />
                   </div>
                   <div>
                     <h3 className="font-display text-2xl italic mb-1 leading-none uppercase">MARKETPLACE</h3>
                     <p className="text-gray-400 text-xs mb-4">Premium gear.</p>
                     <Link to={isLoggedIn ? "/turfs" : "/login"} className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#84CC16] transition-colors">Shop Now <ArrowRight size={14} /></Link>
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
                     <Link to={isLoggedIn ? "/turfs" : "/login"} className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#84CC16] transition-colors">Find Coach <ArrowRight size={14} /></Link>
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
                     <Link to={isLoggedIn ? "/turfs" : "/login"} className="font-bold text-white text-[11px] flex items-center gap-2 hover:text-[#84CC16] transition-colors">Book Now <ArrowRight size={14} /></Link>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL ARENA ── */}
      <section className="py-10 lg:py-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 lg:mb-10 gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl uppercase flex items-center gap-2 md:gap-3 whitespace-nowrap">
              Your <span style={{ color: PRI }}>Social Arena</span> <Info className="w-4 h-4 md:w-5 md:h-5 text-gray-600 cursor-help shrink-0" />
            </h2>
            <p className="text-gray-400 mt-2 text-sm md:text-base">Swipe to see what's happening in the field</p>
          </div>
          <Link to="/community" className="text-white font-bold flex items-center gap-2 hover:text-[#84CC16] transition-colors uppercase tracking-widest text-sm">
            Explore Community <ChevronRight size={16} />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
          {socialPosts.map((post, idx) => (
            <div key={idx} className="min-w-[300px] md:min-w-[350px] bg-[#0A0A0A] border rounded-3xl overflow-hidden snap-start group transition-all" style={{ borderColor: BDR }}>
              <div className="aspect-square relative overflow-hidden">
                <img src={post.image} alt="Social post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-4 flex items-center justify-between border-t" style={{ borderColor: BDR, backgroundColor: "#0F0F0F" }}>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart size={20} /> <span className="text-xs font-bold font-mono">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <MessageCircle size={20} /> <span className="text-xs font-bold font-mono">{post.comments}</span>
                  </button>
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLAYBOOK HIGHLIGHTS ── */}
      <section className="py-10 lg:py-20 px-6 max-w-7xl mx-auto">
        <h2 className="font-display text-5xl md:text-6xl uppercase mb-8 lg:mb-12">
          Playbook <span style={{ color: PRI }}>Highlights</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] md:auto-rows-[200px]">
          {highlights.map((item, idx) => (
            <div 
              key={idx} 
              className={`relative overflow-hidden rounded-2xl group border border-white/5 ${item.span}`}
            >
              <img 
                src={item.image} 
                alt="Highlight" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>
      
      {/* ── WHY CHOOSE US (COMPARISON TABLE) ── */}
      <section className="py-12 lg:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 lg:mb-24">
          <h2 className="text-5xl md:text-8xl font-bold uppercase leading-none tracking-tight">
            WHY CHOOSE <span className="text-[#84CC16]">TURFSPOT?</span>
          </h2>
          <p className="text-white/40 mt-8 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of sports management. Built for performance, designed for athletes.
          </p>
        </div>

        <div className="relative bg-[#0A0A0A] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-white/5 text-[10px] font-bold tracking-[0.3em] text-white/30 bg-white/[0.02] p-10">
            <div className="uppercase">PLATFORM FEATURES</div>
            <div className="text-center uppercase">TRADITIONAL APPS</div>
            <div className="text-center uppercase text-[#84CC16]">TURFSPOT ADVANTAGE</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {comparisonFeatures.map((feature, idx) => (
              <div key={idx} className="grid grid-cols-3 items-center group hover:bg-white/[0.01] transition-colors p-10 relative">
                {/* Feature Name */}
                <div className="flex flex-col gap-2">
                  <span className="text-white text-xl md:text-2xl font-bold uppercase tracking-tight group-hover:text-[#84CC16] transition-colors">
                    {feature.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/40 uppercase tracking-widest border border-white/5">
                      {feature.status}
                    </span>
                  </div>
                </div>

                {/* Others Column */}
                <div className="text-center">
                   <div className="inline-flex flex-col items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                     <span className="text-xs font-bold text-white uppercase tracking-widest">
                       {feature.others}
                     </span>
                     <X size={18} className="text-red-500" />
                   </div>
                </div>

                {/* BMS Column (Highlighted) */}
                <div className="relative text-center h-full flex items-center justify-center">
                   <div className="absolute inset-y-0 inset-x-2 bg-[#84CC16]/[0.02] rounded-3xl pointer-events-none" />
                   
                   <div className="relative flex flex-col items-center gap-3">
                     <span className="text-xs md:text-sm font-black text-white tracking-widest uppercase">
                       {feature.bms}
                     </span>
                     <div className="w-8 h-8 rounded-full bg-[#84CC16]/10 flex items-center justify-center border border-[#84CC16]/30">
                       <Check size={16} className="text-[#84CC16]" />
                     </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Callout */}
        <div className="mt-16 flex justify-center">
           <div className="flex items-center gap-6 text-white/20">
             <div className="h-[1px] w-12 bg-white/10" />
             <span className="text-[10px] font-bold tracking-[0.4em] uppercase">One App. Limitless Potential.</span>
             <div className="h-[1px] w-12 bg-white/10" />
           </div>
        </div>
      </section>


      {/* ── FEATURES ── */}
      <section className="py-10 lg:py-20 px-6 max-w-7xl mx-auto">
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

      {/* ── SPORTS GRID ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t" style={{ borderColor: BDR }}>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5 mb-6">
            <Timer size={14} className="text-[#84CC16]" />
            <span className="text-[10px] font-bold tracking-widest text-[#84CC16] uppercase">100+ Sports Available</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6 leading-none">
            UNLEASH YOUR <span className="text-[#84CC16]">ATHLETE</span> WITHIN
          </h2>
          <p className="text-gray-500 max-w-2xl text-lg uppercase tracking-wider font-medium">
            From the pitch to the pool, find your game and dominate the field.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sports.map((sport, idx) => (
            <div 
              key={sport.name} 
              className={`relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border group transition-all duration-500 hover:border-[#84CC16]/50 ${
                idx === 0 ? 'md:col-span-1' : ''
              }`}
              style={{ borderColor: BDR }}
            >
              <img 
                src={sport.img} 
                alt={sport.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-white drop-shadow-2xl">
                  {sport.name}
                </h3>
              </div>
            </div>
          ))}
          
          {/* View All Card */}
          <div className="relative h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden border border-dashed flex flex-col items-center justify-center group cursor-pointer transition-all hover:bg-white/5"
               style={{ borderColor: BDR }}>
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={32} className="text-gray-500 group-hover:text-[#84CC16]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">View All Sports</span>
          </div>
        </div>
      </section>

      {/* ── APP DOWNLOAD SECTION ── */}
      <section className="py-12 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#0D0D0D] to-black border rounded-[3rem] p-12 md:p-24 overflow-hidden relative" style={{ borderColor: BDR }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">
              
              {/* Left Side: Mockup */}
              <div className="relative order-2 lg:order-1">
                <div className="relative group">
                  <div className="absolute -inset-10 bg-primary/5 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
                  <img 
                    src="/sports_app_mockup_1777351423147.png" 
                    alt="BookMySportz App Mockup" 
                    className="relative w-full max-w-2xl transform scale-110 lg:scale-150 -rotate-6 hover:rotate-0 transition-all duration-700"
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

                <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl">
                  Take the ecosystem with you. Book slots, join matches, and track your performance from anywhere on the planet.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Google Play Button */}
                  <div className="relative group">
                    <div className="absolute -top-2 -right-2 z-20 bg-primary text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      Coming Soon
                    </div>
                    <a href="#" className="flex items-center gap-4 bg-white/5 border px-8 py-4 rounded-2xl transition-all cursor-not-allowed" style={{ borderColor: BDR }}>
                      <div className="w-8 h-8 flex items-center justify-center opacity-50">
                         <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.23-.209.534-.075.79.133.257.394.424.681.424h.01c.145 0 .284-.041.405-.119l12.784-7.464 3.031 3.031c.141.141.331.22.53.22.199 0 .389-.079.53-.22l3.031-3.031c.141-.141.22-.331.22-.53 0-.199-.079-.389-.22-.53l-3.031-3.031 12.784-7.464c.121-.078.26-.119.405-.119h.01c.287 0 .548-.167.681-.424.134-.256.105-.56-.075-.79L3.609 1.814z"/>
                         </svg>
                      </div>
                      <div className="flex flex-col items-start leading-none opacity-50">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Get it on</p>
                        <p className="text-lg font-bold text-white">Google Play</p>
                      </div>
                    </a>
                  </div>

                  {/* App Store Button */}
                  <div className="relative group">
                    <div className="absolute -top-2 -right-2 z-20 bg-[#84CC16] text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      Coming Soon
                    </div>
                    <a href="#" className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl transition-all cursor-not-allowed">
                      <div className="w-8 h-8 flex items-center justify-center opacity-50">
                         <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                         </svg>
                      </div>
                      <div className="flex flex-col items-start leading-none opacity-50">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Download on the</p>
                        <p className="text-lg font-bold text-white">App Store</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/2 rounded-full -translate-y-1/2 translate-x-1/2 opacity-5" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/2 rounded-full translate-y-1/2 -translate-x-1/2 opacity-5" />
          </div>
        </div>
      </section>
      {/* ── FOOTER BANNER ── */}
      <section className="px-3 lg:px-6 pb-12 pt-6 max-w-7xl mx-auto">
        <div className="rounded-[30px] lg:rounded-[40px] border grid grid-cols-4 lg:flex lg:flex-nowrap items-stretch p-2 lg:p-4 divide-x" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
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
    </div>
  );
}
