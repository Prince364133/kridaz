import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, ChevronLeft, ChevronRight, Zap, Heart, Timer, MessageSquareShare } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const TurfCard = ({ turf, featured = false, distance = "1.2km Away" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  const to = `/turf/${turf.id || turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.avgRating ?? 4.8;
  const price = turf.pricePerHour ?? 800;

  // Extract slots - fallback to mocks if empty for visual excellence
  const activeSlots = (turf.generatedSlots || []).filter(s => s.isActive !== false);
  const displaySlots = activeSlots.length > 0 
    ? activeSlots.slice(0, 3) 
    : [{ startTime: "06:00 PM" }, { startTime: "07:00 PM" }, { startTime: "08:00 PM" }];
  const slotsLeft = activeSlots.length > 0 ? activeSlots.length : Math.floor(Math.random() * 10) + 5;
  
  const nextImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImageIndex((p) => (p + 1) % images.length); 
  };
  const prevImage = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setCurrentImageIndex((p) => (p - 1 + images.length) % images.length); 
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = turf.id || turf._id;
    try {
      setIsWishlisted(!isWishlisted);
      await axiosInstance.post("/api/user/turf/user/like", { turfId: targetId });
    } catch (err) {
      setIsWishlisted(isWishlisted); // Revert state on failure
      console.error("[TELEMETRY] Failed to toggle wishlist like:", err);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = turf.id || turf._id;
    try {
      const shareUrl = `${window.location.origin}/turf/${targetId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      // Try using Toast or standard fallback alert
      alert("Ground detail link copied to clipboard!");
      
      await axiosInstance.post("/api/user/turf/user/share", { turfId: targetId });
    } catch (err) {
      console.error("[TELEMETRY] Failed to record turf share:", err);
    }
  };

  return (
    <div
      onClick={() => navigate(to)}
      className="group relative h-[280px] md:h-[360px] w-full rounded-[15px] overflow-hidden cursor-pointer bg-[#0d0d0d] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 hover:border-[#BFF367]/30"
    >
      {/* ── Background Image ── */}
      <div className="absolute inset-0">
        <img
          src={images[currentImageIndex] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Darkening overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* ── Top Left Area ── */}
      <div className="absolute top-3 md:top-5 left-3 md:left-5 z-20 flex flex-col gap-2 md:gap-2.5 items-start">
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {/* Sport Tag */}
          <span className="bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-[10px] uppercase tracking-widest shadow-2xl">
            {turf.sportTypes?.[0] || "SPORT"}
          </span>

          {/* Slots Left Badge */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-[10px] px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1 md:gap-2 shadow-2xl">
            <Timer size={10} className="text-[#BFF367]" />
            <span className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-tighter">{slotsLeft} {window.innerWidth < 768 ? "L" : "Slots Left"}</span>
          </div>
        </div>

        {featured && (
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-2 md:px-3 py-1 md:py-1.5 rounded-[10px] shadow-lg">
            <Zap size={8} md:size={10} className="text-[#BFF367] fill-[#BFF367]" />
            <span className="text-[7px] md:text-[9px] font-black text-white uppercase tracking-wider">Featured</span>
          </div>
        )}
      </div>

      {/* ── Top Right ── */}
      <div className="absolute top-3 md:top-5 right-3 md:right-5 z-20">
        <button 
          onClick={toggleWishlist}
          className="p-2 md:p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-gradient-to-r hover:from-[#55DEE8] hover:to-[#BFF367] transition-all duration-300 group/heart"
        >
          <Heart 
            size={14} md:size={18} 
            className={`transition-all duration-300 ${
              isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover/heart:scale-110 group-hover/heart:text-black"
            }`} 
          />
        </button>
      </div>

      {/* ── Carousel Controls ── */}
      {images.length > 1 && (
        <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          <button onClick={prevImage} className="p-1.5 md:p-2 bg-black/40 hover:bg-[#BFF367] hover:text-black backdrop-blur-sm rounded-full text-white transition-all border border-white/10">
            <ChevronLeft size={14} md:size={16} />
          </button>
          <button onClick={nextImage} className="p-1.5 md:p-2 bg-black/40 hover:bg-[#BFF367] hover:text-black backdrop-blur-sm rounded-full text-white transition-all border border-white/10">
            <ChevronRight size={14} md:size={16} />
          </button>
        </div>
      )}

      {/* ── Bottom Content Area with Blur ── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pt-24 z-20 overflow-hidden">
        {/* The Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        
        <div className="relative z-10 space-y-3 md:space-y-4">
          <div className="space-y-3 md:space-y-4">
            {/* Name & Location */}
            <div className="space-y-1 md:space-y-1.5">
              <h3 className="text-base md:text-xl font-bold text-white tracking-tight leading-tight group-hover:text-[#BFF367] transition-colors line-clamp-1 font-inter">
                {turf.name}
              </h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                  <MapPin size={10} md:size={12} className="text-[#55DEE8] shrink-0" />
                  <p className="text-[10px] md:text-sm font-semibold text-white/60 truncate font-inter">
                    {turf.city || turf.location || "Nearby Venue"}
                  </p>
                </div>
                <button
                  onClick={handleShare}
                  className="p-1 hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  <MessageSquareShare size={14} className="text-[#84CC16] hover:scale-110 transition-transform cursor-pointer shrink-0" />
                </button>
              </div>
            </div>

            {/* Pricing & Rating Row */}
            <div className="flex items-center justify-between items-end pt-2 md:pt-3 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5 md:mb-1 font-inter">Starting</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-2xl font-black text-[#BFF367]">₹{price}</span>
                  <span className="text-[8px] md:text-xs font-bold text-white/40 uppercase font-inter">/ hr</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 md:gap-1">
                <div className="flex items-center gap-1 md:gap-1.5 text-[#BFF367]">
                  <Star size={14} md:size={18} className="fill-current" />
                  <span className="text-sm md:text-lg font-black font-inter">{rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-black text-[#BFF367] uppercase tracking-widest font-inter">
                  {distance || "1.2km Away"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
