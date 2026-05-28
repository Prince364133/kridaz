import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const TurfCardMobile = ({ turf, distance = "1.2km Away" }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  const to = `/venue/${turf.id || turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.averageRating ?? turf.avgRating ?? turf.rating ?? 4.8;
  const price = turf.pricePerHour ?? 800;

  // Extract slots
  const activeSlots = (turf.generatedSlots || []).filter(s => s.isActive !== false);
  const slotsLeft = activeSlots.length > 0 ? activeSlots.length : Math.floor(Math.random() * 10) + 5;
  
  // Extract sports
  const sportTypes = turf.sportTypes || ["SPORTS"];
  const gameTypesDisplay = sportTypes.slice(0, 2).join(", "); // Show up to 2 sports

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = turf.id || turf._id;
    try {
      setIsWishlisted(!isWishlisted);
      await axiosInstance.post("/api/user/turf/user/like", { turfId: targetId });
    } catch (err) {
      setIsWishlisted(isWishlisted);
      console.error("[TELEMETRY] Failed to toggle wishlist like:", err);
    }
  };

  return (
    <div
      onClick={() => navigate(to)}
      className="group relative h-[320px] md:h-[400px] w-full rounded-[12px] overflow-hidden cursor-pointer bg-black transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* ── Background Image ── */}
      <div className="absolute inset-0">
        <img
          src={images[0] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Darkening gradient overlay at the bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
      </div>

      {/* ── Top Left Area: Slots and Game Type ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
        <span className="bg-black/60 backdrop-blur-md text-[#55DEE8] border border-white/10 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
          {gameTypesDisplay}
        </span>
        <span className="bg-[#BFF367]/20 backdrop-blur-md text-[#BFF367] border border-[#BFF367]/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
          {slotsLeft} Slots Left
        </span>
      </div>

      {/* ── Top Right Area: Wishlist ── */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleWishlist}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all duration-300 group/heart"
        >
          <Heart 
            size={18} 
            className={`transition-all duration-300 ${ isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover/heart:scale-110" }`} 
          />
        </button>
      </div>

      {/* ── Bottom Content Area ── */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col gap-1">
        {/* Venue Name */}
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight font-inter line-clamp-1">
          {turf.name}
        </h3>
        
        {/* Distance */}
        <p className="text-xs md:text-sm text-white/70 font-medium font-inter mb-2">
          {distance}
        </p>
        
        {/* Pricing & Rating Row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-black text-[#55DEE8]">₹{price}</span>
            <span className="text-xs md:text-sm text-white/70 font-medium">/ hr</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#BFF367]">
            <Star size={16} className="fill-[#BFF367]" />
            <span className="text-base md:text-lg font-bold font-inter">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCardMobile;
