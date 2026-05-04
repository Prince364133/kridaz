import { useState, useEffect } from "react";
import TurfCard from "./TurfCard.jsx";
import TurfCardSkeleton from "../ui/TurfCardSkeleton.jsx";
import useTurfData from "../../hooks/useTurfData.jsx";
import SearchTurf from "../search/SearchTurf.jsx";
import { Trophy } from "lucide-react";

const Turf = () => {
  const { turfs, loading, error } = useTurfData();
  const [filteredTurfs, setFilteredTurfs] = useState([]);

  useEffect(() => {
    if (turfs) {
      setFilteredTurfs(turfs);
    }
  }, [turfs]);

  const handleSearch = ({ searchTerm, location, city, state, radius }) => {
    const filtered = turfs.filter((turf) => {
      // 1. Sport Match
      const matchesSearch = !searchTerm || 
                          turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          turf.sportTypes?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 2. Location String Match (Fuzzy)
      const turfLocation = turf.location?.toLowerCase() || "";
      const matchesLocation = !location || turfLocation.includes(location.toLowerCase().split(',')[0].trim());
      const matchesCity = !city || turfLocation.includes(city.toLowerCase().trim());
      const matchesState = !state || turfLocation.includes(state.toLowerCase().trim());
      
      return matchesSearch && matchesLocation && matchesCity && matchesState;
    });
    setFilteredTurfs(filtered);
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


      <div className="max-w-screen-2xl mx-auto px-6 pt-0 relative z-10">
        



        {/* ── Search Bar ────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md pt-2 pb-2 -mx-6 px-6 mb-10 border-b border-white/5">
          <SearchTurf onSearch={handleSearch} />
        </div>

        {/* ── Results Grid ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
            Available Slots ({filteredTurfs.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <TurfCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredTurfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
              onClick={() => { setFilteredTurfs(turfs); }}
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
