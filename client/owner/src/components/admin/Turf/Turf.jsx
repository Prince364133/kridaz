import React from "react";
import { MapPin, Clock, Star, Calendar } from "lucide-react";
import { format } from "date-fns";

/**
 * Admin Turf card — follows the BookMySportz design system.
 * rounded-2xl, lime green accents, pill badges.
 */
const Turf = ({ turf }) => {
  return (
    <div className="bms-card group flex flex-col">
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <img
          <img src={turf.image} alt={turf.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }} />
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Price badge */}
        <div className="absolute top-3 left-3">
          <span className="badge-featured">₹{turf.pricePerHour}/hr</span>
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 badge-distance">
          <div className="w-1.5 h-1.5 bg-[#84CC16] rounded-full animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Rating row */}
        <div className="flex items-center justify-between">
          <span className="badge-sport">Arena</span>
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-semibold">{turf.avgRating || "4.8"}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg uppercase tracking-wide text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {turf.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[#888] text-xs">
          <MapPin size={11} className="text-[#84CC16] shrink-0" />
          <span className="truncate">{turf.location}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1.5 text-[#888] text-xs">
          <Clock size={11} className="text-[#84CC16] shrink-0" />
          <span>{turf.openTime} – {turf.closeTime}</span>
        </div>

        {/* Added date */}
        {turf.createdAt && (
          <div className="flex items-center gap-1.5 text-[#888] text-xs">
            <Calendar size={11} className="text-[#84CC16] shrink-0" />
            <span>Added {format(new Date(turf.createdAt), "dd MMM yyyy")}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-3 border-t border-[#2A2A2A]">
          <div className="w-full h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div className="h-full bg-[#84CC16]/60 rounded-full group-hover:bg-[#84CC16] transition-all duration-700" style={{ width: "70%" }} />
          </div>
          <p className="text-[10px] text-[#888] font-mono uppercase tracking-wider mt-1">Booking Rate</p>
        </div>
      </div>
    </div>
  );
};

export default Turf;
