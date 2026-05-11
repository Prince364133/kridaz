import { useState } from "react";
import TurfCard from "./TurfCard.jsx";
import TurfCardSkeleton from "../ui/TurfCardSkeleton.jsx";
import useTurfData from "../../hooks/useTurfData.jsx";
import SearchTurf from "../search/SearchTurf.jsx";
import { Trophy, MapPin } from "lucide-react";

/**
 * Turf — Venue discovery page.
 *
 * Behaviour:
 * 1. Loads all approved venues by default.
 * 2. User can filter by Sport, State, and City using the search bar.
 * 3. City dropdown is dynamically populated based on the selected state.
 */
const Turf = () => {
  const [searchFilters, setSearchFilters] = useState({});
  const { turfs, loading } = useTurfData(searchFilters);

  // ── Handle search filters from the SearchTurf bar ─────────────────
  const handleSearch = (filters) => {
    setSearchFilters({ ...filters });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 pt-0 relative z-10">

        {/* ── Sticky Search Bar ────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md pt-2 pb-2 -mx-6 px-6 mb-10 border-b border-white/5">
          <SearchTurf onSearch={handleSearch} />
        </div>

        {/* ── Section Header ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-white/5 pb-6 gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.05em] text-white flex items-center gap-3 font-sans">
              <MapPin size={18} className="text-[#84CC16]" />
              {`AVAILABLE VENUES — ${turfs.length}`}
            </h2>
          </div>
        </div>

        {/* ── Cards Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <TurfCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : turfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {turfs.map((turf, idx) => (
              <div
                key={turf._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <TurfCard
                  turf={turf}
                  featured={false}
                  distance={null}
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
              onClick={() => setSearchFilters({})}
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
