import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, Heart, MapPin, Navigation, Users } from "lucide-react";
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
      className={`group relative w-full rounded-[24px] overflow-hidden cursor-pointer bg-black aspect-[1080/1350]`}
    >
      {/* ── Background Images ── */}
      <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
            alt={`${turf.name} - ${idx + 1}`}
            className="w-full h-full object-cover shrink-0 snap-center"
          />
        ))}
      </div>
      
      {/* Soft gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none" />

      {/* ── Top Right Area: Wishlist Button ── */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleWishlist}
          className={`rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-300 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
        >
          <Heart 
            size={compact ? 16 : 18} 
            className={`transition-all duration-300 ${ isWishlisted ? "fill-red-500 text-red-500" : "text-black" }`} 
          />
        </button>
      </div>

      {/* ── Bottom Content Area ── */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col ${compact ? 'p-4' : 'p-5'}`}>
        
        {/* Row 1: Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={14} className="text-white/80" />
          <p className="text-white/90 font-medium font-inter text-sm tracking-wide">
            {turf.location || turf.city || 'Hyderabad'}
          </p>
        </div>
        
        {/* Row 2: Title */}
        <div className="w-full mb-3">
          <h3 className={`font-bold text-white leading-tight font-inter line-clamp-2 ${compact ? 'text-[15px]' : 'text-[15px] md:text-[18px]'}`}>
            {turf.name}
          </h3>
        </div>

        {/* Row 3: Pill Badges and Price */}
        <div className="flex items-center justify-between gap-2 w-full pb-1">
          {/* Left: Tags */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {/* Rating */}
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Star size={12} className="text-white" />
              <span className="text-white font-medium text-xs">{rating.toFixed(1)}</span>
            </div>
            
            {/* Slots */}
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Users size={12} className="text-white" />
              <span className="text-white font-medium text-xs">{slotsLeft} Slots</span>
            </div>

            {/* Game Type */}
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
              <span className="text-white font-medium text-xs">{gameTypesDisplay}</span>
            </div>
          </div>

          {/* Right: Price */}
          <div className="flex items-baseline gap-1 shrink-0 ml-1">
            <span className={`font-bold text-[#BFF367] ${compact ? 'text-lg' : 'text-xl'}`}>₹{price}</span>
            <span className="text-white/80 font-medium text-[10px] md:text-xs">/hr</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TurfCardMobile;
