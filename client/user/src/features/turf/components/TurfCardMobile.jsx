import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, Heart, MapPin, Navigation } from "lucide-react";
import { useSelector } from "react-redux";
import { useGetSavedTurfsQuery, useToggleTurfLikeMutation } from "@redux/api/turfApi";
import toast from "react-hot-toast";

/** Haversine distance in km */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const TurfCardMobile = ({ turf, distance: distanceProp, compact = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  
  const { data: savedData } = useGetSavedTurfsQuery(undefined, { skip: !isLoggedIn });
  const [toggleLikeApi] = useToggleTurfLikeMutation();

  const targetId = turf.id || turf._id;
  const isWishlisted = isLoggedIn && savedData?.turfs?.some(t => (t.id || t._id) === targetId);

  const returnTo = searchParams.get('returnTo');
  const baseTo = `/venue/${turf.id || turf._id}`;
  const to = returnTo ? `${baseTo}?returnTo=${encodeURIComponent(returnTo)}` : baseTo;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.averageRating ?? turf.avgRating ?? turf.rating ?? 4.8;
  const price = turf.pricePerHour ?? 800;

  // Extract slots
  const activeSlots = (turf.generatedSlots || []).filter(s => s.isActive !== false);
  const slotsLeft = turf.slotsLeft !== undefined ? turf.slotsLeft : (activeSlots.length > 0 ? activeSlots.length : Math.floor(Math.random() * 10) + 5);
  
  // Extract sports
  const sportTypes = turf.sportTypes || ["SPORTS"];
  const gameTypesDisplay = sportTypes.slice(0, 2).join(", "); // Show up to 2 sports

  // ── Distance calculation ──
  const [calcDistance, setCalcDistance] = useState(null);
  useEffect(() => {
    if (distanceProp) return; // already have it from parent
    const venueLat = turf.location?.coordinates?.[1] ?? turf.latitude ?? turf.lat;
    const venueLng = turf.location?.coordinates?.[0] ?? turf.longitude ?? turf.lng;
    if (!venueLat || !venueLng) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, venueLat, venueLng);
          setCalcDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
        },
        () => {},
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [turf, distanceProp]);

  const distance = distanceProp || calcDistance;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login to save venues");
      return;
    }
    try {
      await toggleLikeApi(targetId).unwrap();
    } catch (err) {
      console.error("[TELEMETRY] Failed to toggle wishlist like:", err);
      toast.error("Failed to save venue");
    }
  };

  return (
    <div
      onClick={() => navigate(to)}
      className={`group relative w-full rounded-[12px] overflow-hidden cursor-pointer bg-black transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
        compact ? "h-[220px] md:h-[260px]" : "h-[320px] md:h-[400px]"
      }`}
    >
      {/* ── Background Images (Scrollable) ── */}
      <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
            alt={`${turf.name} - ${idx + 1}`}
            className="w-full h-full object-cover shrink-0 snap-center transition-transform duration-700 group-hover:scale-105"
          />
        ))}
      </div>
      {/* Darkening gradient overlay at the bottom for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 pointer-events-none" />

      {/* ── Top Left Area: Slots and Game Type ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-row gap-2 items-center">
        <span className={`bg-black/60 backdrop-blur-md text-[#BFF367] border border-[#BFF367]/20 font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
          {gameTypesDisplay}
        </span>
        <span className={`bg-[#BFF367] text-black font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
          {slotsLeft} Slots Left
        </span>
      </div>

      {/* ── Top Right Area: Wishlist ── */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleWishlist}
          className={`rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all duration-300 group/heart ${compact ? 'p-1.5' : 'p-2'}`}
        >
          <Heart 
            size={compact ? 14 : 18} 
            className={`transition-all duration-300 ${ isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover/heart:scale-110" }`} 
          />
        </button>
      </div>

      {/* ── Bottom Content Area ── */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col ${compact ? 'p-3 gap-0.5' : 'p-5 gap-1'}`}>
        {/* Venue Name */}
        <h3 className={`font-bold text-white tracking-tight leading-tight font-inter line-clamp-1 ${compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
          {turf.name}
        </h3>
        
        {/* Location */}
        <div className={`flex items-center mb-1 ${compact ? 'gap-1' : 'gap-1.5 mb-2'}`}>
          <MapPin size={compact ? 10 : 12} className="text-[#BFF367]" />
          <p className={`text-white/70 font-medium font-inter ${compact ? 'text-[10px] md:text-xs' : 'text-xs md:text-sm'}`}>
            {turf.location || turf.city || 'Hyderabad'}
          </p>
        </div>
        
        {/* Pricing & Rating Row */}
        <div className="flex items-start justify-between mt-1">
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`font-black text-[#BFF367] ${compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>₹{price}</span>
            <span className={`text-white/70 font-medium ${compact ? 'text-[10px] md:text-xs' : 'text-xs md:text-sm'}`}>/ hr</span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-[#BFF367]">
              <Star size={compact ? 14 : 16} className="fill-[#BFF367]" />
              <span className={`font-bold font-inter ${compact ? 'text-sm md:text-base' : 'text-base md:text-lg'}`}>{rating.toFixed(1)}</span>
            </div>
            {distance ? (
              <div className="flex items-center gap-1 text-white/50">
                <Navigation size={compact ? 8 : 9} className="text-[#BFF367]" />
                <span className={`font-bold tracking-widest uppercase ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                  {distance}
                </span>
              </div>
            ) : (
              <span className={`font-bold tracking-widest uppercase text-white/20 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                --
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCardMobile;
