import { useState, useEffect } from "react";
import TurfCard from "./TurfCard.jsx";
import TurfCardSkeleton from "../ui/TurfCardSkeleton.jsx";
import useTurfData from "../../hooks/useTurfData.jsx";
import SearchTurf from "../search/SearchTurf.jsx";
import { Trophy, Flame, Star, Target, Zap } from "lucide-react";

const CATEGORIES = [
  { id: "all", name: "All Sports", icon: Trophy },
  { id: "football", name: "Football", icon: Target },
  { id: "cricket", name: "Cricket", icon: Flame },
  { id: "badminton", name: "Badminton", icon: Zap },
  { id: "tennis", name: "Tennis", icon: Star },
];

const Turf = () => {
  const { turfs, loading, error } = useTurfData();
  const [filteredTurfs, setFilteredTurfs] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (turfs) {
      setFilteredTurfs(turfs);
    }
  }, [turfs]);

  const handleSearch = ({ searchTerm, location }) => {
    const filtered = turfs.filter((turf) => {
      const matchesSearch = turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          turf.sportTypes?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = !location || turf.location?.toLowerCase().includes(location.toLowerCase());
      return matchesSearch && matchesLocation;
    });
    setFilteredTurfs(filtered);
  };

  const filterByCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === "all") {
      setFilteredTurfs(turfs);
    } else {
      const filtered = turfs.filter(t => 
        t.sportTypes?.some(s => s.toLowerCase() === categoryId.toLowerCase())
      );
      setFilteredTurfs(filtered);
    }
  };

  // if (error) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest">
  //       Service temporarily unavailable
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      {/* ── Background Decoration ──────────────────────────────── */}


      <div className="max-w-7xl mx-auto px-6 pt-40 relative z-10">
        
        {/* ── Header Section ───────────────────────────────────── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5 text-[#84CC16] text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-fade-in">
            <Zap size={12} className="fill-[#84CC16]" />
            Enterprise Booking System
          </div>
          <h1 className="text-6xl md:text-8xl font-bold uppercase leading-[0.85] tracking-tight mb-6">
            Premium <span className="text-[#84CC16]">Facilities</span> <br/> 
            For <span>Champions.</span>
          </h1>
          <p className="max-w-xl mx-auto text-gray-500 font-medium text-lg mb-12">
            Discover and book professional sports facilities. Premium quality venues for your next match.
          </p>
        </div>


        {/* ── Search Bar ────────────────────────────────────────── */}
        <SearchTurf onSearch={handleSearch} />

        {/* ── Category Filter ──────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 mb-20 overflow-x-auto pb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => filterByCategory(cat.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                activeCategory === cat.id 
                ? "bg-[#84CC16] text-black border-[#84CC16] scale-105" 
                : "bg-[#111] text-gray-500 border-white/5 hover:border-white/10 hover:text-white"
              }`}
            >
              <cat.icon size={16} className={activeCategory === cat.id ? "text-black" : "text-[#84CC16]"} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Results Grid ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
            Available Slots ({filteredTurfs.length})
          </h2>
          <div className="flex gap-4">
            <span className="text-[10px] text-[#84CC16] font-bold uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">Top Rated</span>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Price: Low to High</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-10">
            {Array.from({ length: 6 }).map((_, index) => (
              <TurfCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredTurfs.length > 0 ? (
          <div className="grid grid-cols-1 gap-10">
            {filteredTurfs.map((turf, idx) => (
              <div key={turf._id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <TurfCard 
                  turf={turf} 
                  featured={idx === 0} 
                  distance={`${(Math.random() * 5 + 1).toFixed(1)} km`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <Trophy size={48} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-display uppercase text-gray-400 mb-2">Venues Not Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search keywords.</p>
            <button 
              onClick={() => { setFilteredTurfs(turfs); setActiveCategory("all"); }}
              className="mt-8 px-10 py-3 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Turf;
