import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";

const TurfCard = ({ turf, featured = false, distance = "2.4 km" }) => {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const to = `/turf/${turf._id}`;

  const rating = turf.rating ?? 5.0;
  const reviews = turf.reviewCount ?? 8189;
  const location = turf.location ?? "Paramount colony, Hyderabad";
  const sports = Array.isArray(turf.sportTypes) ? turf.sportTypes : [turf.sportType || "Cricket"];

  return (
    <div className="bg-[#0A0A0A] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col p-3 transition-all duration-300 hover:border-white/10 group">
      
      {/* ── Image Section ────────────────────────────────────────── */}
      <div className="relative h-60 w-full rounded-[1.5rem] overflow-hidden mb-4">
        <img
          src={turf.image || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
          alt={turf.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top Left: FEATURED Badge */}
        {featured && (
          <div className="absolute top-3 left-3 bg-[#84CC16] px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black text-black uppercase tracking-tight">FEATURED</span>
          </div>
        )}

        {/* Top Right: Distance Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
          <MapPin size={12} className="text-[#84CC16]" />
          <span className="text-white text-[10px] font-bold">{distance}</span>
        </div>
      </div>

      {/* ── Content Section ─────────────────────────────────────── */}
      <div className="px-3 flex flex-col flex-1">
        
        {/* Title: Uppercase, Bold */}
        <h3 className="text-xl font-black text-white uppercase leading-tight mb-2 tracking-tight group-hover:text-[#84CC16] transition-colors">
          {turf.name}
        </h3>

        {/* Location: Gray with Lime Icon */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={14} className="text-[#84CC16]" />
          <span className="text-gray-400 text-xs font-medium">{location}</span>
        </div>

        {/* Subtle Divider */}
        <div className="h-[1px] bg-white/10 w-full mb-4" />

        {/* Rating & Sport Badge Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-black text-sm">{rating.toFixed(1)}</span>
            <span className="text-gray-600 text-xs font-bold">({reviews.toLocaleString()})</span>
          </div>
          
          <div className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">
            <span className="text-white text-[10px] font-bold">{sports[0]}</span>
          </div>
        </div>

        {/* Full Width Book Now Button */}
        <Link
          to={to}
          className="w-full bg-[#84CC16] hover:bg-[#97E01B] text-black font-black py-4 rounded-2xl text-center text-sm transition-all active:scale-[0.98] mt-auto"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
};

export default TurfCard;
