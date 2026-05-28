import { useState, useEffect } from "react";
import TurfCardMobile from "./TurfCardMobile.jsx";
import TurfCardSkeleton from "@components/ui/TurfCardSkeleton.jsx";
import useTurfData from "../hooks/useTurfData.jsx";
import SearchTurf from "@components/search/SearchTurf.jsx";
import { Trophy, MapPin, Loader2, Sparkles } from "lucide-react";
import useRecommendations from "@hooks/useRecommendations";

/**
 * Turf — Venue discovery page.
 *
 * Behaviour:
 * 1. On mount, silently requests browser geolocation.
 * 2. If granted → backend receives lat/lng → MongoDB $geoNear sorts by proximity
 *    → nearest venues appear at the top.
 * 3. If denied  → falls back to normal listing (no distance data).
 * 4. All search filter changes (sport / state / city) always include the
 *    latest userLocation so proximity sort is preserved while filtering.
 */
const Turf = () => {
  const [searchFilters, setSearchFilters] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting"); // 'detecting' | 'granted' | 'denied'

  const { turfs, loading } = useTurfData(searchFilters);

  const { recommendations, loading: recsLoading } = useRecommendations({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    limit: 4
  });

  // ── Auto-detect location ──────────────────────────────────────────
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
        
        // Reverse Geocode to get City/State names for the search bar
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

        const loc = { lat, lng, city, state };
        setUserLocation(loc);
        setLocationStatus("granted");
        
        setSearchFilters((prev) => ({ 
          ...prev,
          lat,
          lng
        }));
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err.message);
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
        const lat = data.latitude;
        const lng = data.longitude;
        
        const loc = { lat, lng };
        setUserLocation(loc);
        setLocationStatus("granted");
        
        setSearchFilters((prev) => ({ 
          ...prev,
          lat,
          lng
        }));
      } else {
        setLocationStatus("denied");
      }
    } catch (error) {
      setLocationStatus("denied");
    }
  };

  useEffect(() => {
    // detectLocation(); // DISABLED for privacy (manual entry only)
  }, []);

  // ── Handle search filters from the SearchTurf bar ─────────────────
  const handleSearch = (filters) => {
    setSearchFilters({
      ...filters,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 pt-0 relative z-10">

        {/* ── Search Bar (Non-Sticky) ──────────────────────── */}
        <div className="pt-3 pb-4 mb-4">
          <SearchTurf onSearch={handleSearch} userLocation={userLocation} />
        </div>

        {/* ── Venue Counts (Non-Sticky) ──────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.05em] text-white flex items-center gap-3 font-sans">
              <MapPin size={18} className="text-[#BFF367]" />
              {locationStatus === "granted" ? (
                `NEAREST TO YOU — ${turfs.length} VENUE${turfs.length !== 1 ? "S" : ""}`
              ) : (
                `AVAILABLE VENUES — ${turfs.length}`
              )}
            </h2>
          </div>
        </div>

        {/* ── Cards Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <TurfCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : turfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {turfs.map((turf, idx) => (
              <div
                key={turf._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <TurfCardMobile
                  turf={turf}
                  featured={idx === 0 && locationStatus === "granted"}
                  distance={
                    turf.distance != null
                      ? `${(turf.distance / 1000).toFixed(1)} km`
                      : null
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Trophy size={48} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-display uppercase text-gray-400 mb-2">Venues Not Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() =>
                setSearchFilters(
                  userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {}
                )
              }
              className="mt-8 px-10 py-3 border border-white/10 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Clear All Filters
            </button>

            {/* Handpicked Alternate Recommendations */}
            {(recsLoading || (recommendations && recommendations.length > 0)) && (
              <div className="mt-24 pt-16 border-t border-white/5 space-y-10 text-left max-w-7xl mx-auto w-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#84CC16]">
                    <Sparkles size={18} className="fill-current animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-[0.2em] font-sans">Handpicked Alternates</span>
                  </div>
                  <h4 className="text-3xl font-black uppercase tracking-tight text-white font-open-sans">
                    Trending Spots Active In Your City
                  </h4>
                  <p className="text-xs font-semibold text-zinc-500 font-inter">
                    ML-ranked suggestions based on real-time location metrics & teammate sport affinities.
                  </p>
                </div>

                {recsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <TurfCardSkeleton key={`recs-skeleton-${i}`} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {recommendations.map((t) => (
                      <TurfCardMobile 
                        key={t.id || t._id} 
                        turf={t} 
                        distance={t.distance ? `${(t.distance / 1000).toFixed(1)} km Away` : "Nearby"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Turf;
