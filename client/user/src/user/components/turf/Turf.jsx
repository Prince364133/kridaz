import { useState, useEffect } from "react";
import TurfCard from "./TurfCard.jsx";
import TurfCardSkeleton from "../ui/TurfCardSkeleton.jsx";
import useTurfData from "../../hooks/useTurfData.jsx";
import SearchTurf from "../search/SearchTurf.jsx";
import { Trophy, MapPin, Loader2 } from "lucide-react";

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
          ...prev
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
        const city = data.city || "";
        const state = data.region || "";
        
        const loc = { lat, lng };
        setUserLocation(loc);
        setLocationStatus("granted");
        
        setSearchFilters((prev) => ({ 
          ...prev
        }));
        console.log("Location estimated via IP:", city);
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

  // ── Handle search filters from the SearchTurf bar ─────────────────
  const handleSearch = (filters) => {
    setSearchFilters({
      ...filters,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 pt-0 relative z-10">

        {/* ── Sticky Search Bar ────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md pt-2 pb-2 -mx-6 px-6 mb-10 border-b border-white/5">
          <SearchTurf onSearch={handleSearch} userLocation={userLocation} />
        </div>

        {/* ── Section Header ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-white/5 pb-6 gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
              {locationStatus === "detecting" && (
                <>
                  <Loader2 size={14} className="animate-spin text-[#84CC16]" />
                  Detecting your location…
                </>
              )}
              {locationStatus === "granted" && (
                <>
                  <MapPin size={14} className="text-[#84CC16]" />
                  Nearest to You — {turfs.length} venue{turfs.length !== 1 ? "s" : ""}
                </>
              )}
              {locationStatus === "denied" && (
                <>
                  <Trophy size={14} />
                  Available Venues ({turfs.length})
                </>
              )}
            </h2>
            {locationStatus === "granted" && userLocation && (
              <span className="text-[10px] text-[#84CC16] uppercase tracking-[0.2em] font-bold">
                Sorted by distance from your current position
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Manual detect button */}
            <button
              onClick={detectLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
                locationStatus === "granted" 
                  ? "border-[#84CC16]/30 text-[#84CC16] hover:bg-[#84CC16]/10" 
                  : "border-white/10 text-gray-400 hover:border-[#84CC16] hover:text-[#84CC16]"
              }`}
            >
              <MapPin size={12} />
              {locationStatus === "granted" ? "Update Location" : "Detect My Location"}
            </button>

            {locationStatus === "denied" && (
              <span className="text-[10px] text-gray-600 uppercase tracking-widest hidden lg:block">
                Enable location for better results
              </span>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {turfs.map((turf, idx) => (
              <div
                key={turf._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <TurfCard
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
          <div className="py-32 text-center">
            <Trophy size={48} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-display uppercase text-gray-400 mb-2">Venues Not Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() =>
                setSearchFilters(
                  userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {}
                )
              }
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
