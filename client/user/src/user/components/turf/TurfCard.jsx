import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, ChevronLeft, ChevronRight, Zap, Clock } from "lucide-react";

const SPORT_COLORS = {
  Football: "#22C55E",
  Cricket: "#3B82F6",
  Badminton: "#F59E0B",
  Tennis: "#EC4899",
  Basketball: "#F97316",
  Swimming: "#06B6D4",
  Volleyball: "#8B5CF6",
  default: "#84CC16",
};

const TurfCard = ({ turf, featured = false, distance = null }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  const to = `/turf/${turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.rating ?? 4.5;
  const location = turf.location ?? "Location not specified";
  const category = turf.sportTypes?.[0] || "SPORTS";
  const sportColor = SPORT_COLORS[category] ?? SPORT_COLORS.default;
  const slots = turf.availableSlots ?? Math.floor(Math.random() * 8) + 2;

  const nextImage = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex((p) => (p + 1) % images.length); };
  const prevImage = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex((p) => (p - 1 + images.length) % images.length); };

  return (
    <div
      onClick={() => navigate(to)}
      className="group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer bg-[#0d0d0d] border border-white/[0.06] transition-all duration-500 hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)]"
    >
      {/* ── Image ── */}
      <div className="relative h-52 overflow-hidden shrink-0">
        <img
          src={images[currentImageIndex] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          onError={(e) => { e.target.onerror = null; e.target.src = "/banner-1.png"; }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/20 to-transparent" />

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#84CC16] px-3 py-1 rounded-full shadow-lg shadow-[#84CC16]/30">
            <Zap size={10} className="text-black fill-black" />
            <span className="text-[9px] font-black text-black uppercase tracking-wider">Featured</span>
          </div>
        )}

        {/* Sport tag */}
        <div
          className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
          style={{ backgroundColor: `${sportColor}22`, color: sportColor, border: `1px solid ${sportColor}44` }}
        >
          {category}
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3 z-20">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-white leading-none">₹{turf.pricePerHour ?? "—"}</span>
            <span className="text-[10px] text-white/40 font-bold">/hr</span>
          </div>
        </div>

        {/* Rating & Distance pills */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
          {distance && (
            <div className="flex items-center gap-1 bg-[#84CC16] backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-lg shadow-[#84CC16]/20">
              <MapPin size={10} className="text-black fill-black" />
              <span className="text-[10px] font-black text-black">{distance}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
            <Star size={11} className="text-[#84CC16] fill-[#84CC16]" />
            <span className="text-[11px] font-black text-white">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-black/50 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-black/50 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight size={14} />
            </button>
            {/* Dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {images.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? "w-4 bg-[#84CC16]" : "w-1 bg-white/30"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 pt-3 pb-4 flex flex-col gap-3">
        {/* Name & Location */}
        <div>
          <h3 className="text-[15px] font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#84CC16] transition-colors duration-300 line-clamp-1">
            {turf.name}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 opacity-50">
            <MapPin size={11} className="text-[#84CC16] shrink-0" />
            <span className="text-[10px] text-white font-semibold truncate">{location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-wider">
            <Clock size={11} className="text-[#84CC16]/60" />
            <span>{slots} slots left</span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); navigate(to); }}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#84CC16] text-black px-4 py-2 rounded-full hover:bg-[#a3e635] transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
