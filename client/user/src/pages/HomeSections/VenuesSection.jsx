/* eslint-disable react/prop-types */
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, ChevronLeft, Star, Heart, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BDR = "#2A2A2A";

const VenueCard = ({ t }) => (
  <Link 
    to={`/venue/${t._id}`} 
    draggable={false}
    className="block relative w-full h-full rounded-[12px] overflow-hidden group bg-[#111] border-2 border-gray-600/60 hover:border-white/40 transition-all duration-300 shadow-lg"
  >
    {/* Normal Card Content */}
    <div className="absolute inset-0 w-full h-full bg-[#111]">
      <img 
        src={t.images?.[0] || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80"} 
        onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80"; }}
        alt={t.name}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 pointer-events-none" 
      />
      
      {/* Dark gradient at the bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 z-0 pointer-events-none" />

      {/* Heart Icon top right */}
      <div className="absolute top-4 right-4 z-10">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-md" onClick={(e) => e.preventDefault()}>
          <Heart size={18} className="text-gray-800" strokeWidth={2} />
        </button>
      </div>

      {/* Bottom Details Section */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end gap-2">
            <h3 className="text-[18px] font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {t.name}
            </h3>
          </div>
        </div>

        {/* Pills & Pricing Row */}
        <div className="flex justify-between items-center mt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/10">
              <Star size={12} className="text-white" fill="currentColor" />
              <span className="text-[11px] font-semibold text-white">{t.averageRating || t.rating || "4.8"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/10">
              <MapPin size={12} className="text-white" />
              <span className="text-[11px] font-semibold text-white">{t.distance ? `${Math.round(t.distance)} km` : "1 km"} away</span>
            </div>
          </div>
          
          {t.pricePerHour && (
            <div className="text-right shrink-0 ml-2">
              <span className="text-[#BFF367] text-[22px] font-black tracking-tight">₹{t.pricePerHour}</span>
              <span className="text-white/70 text-[12px] ml-1">/hr</span>
            </div>
          )}
        </div>
      </div>
      
    </div>

    {/* Top left feature tag removed as requested */}
  </Link>
);

export default function VenuesSection({
  userLocation,
  loading,
  turfLoading,
  error,
  displayTurfs,
  setTurfFilters,
}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval;
    if (!isHovered) {
      interval = setInterval(() => {
        // Only auto-slide on desktop (min-width: 768px)
        if (window.innerWidth >= 768 && scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          
          // If we reached the end, loop back to the start. Otherwise, scroll right by roughly one card width.
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            const cardWidth = scrollRef.current.children[0]?.clientWidth || 396;
            scrollRef.current.scrollBy({ left: cardWidth + 16, behavior: "smooth" });
          }
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isHovered]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-[15px] mb-8 w-full">
      <div className="mb-6">
        <h2
          className="text-[18px] md:text-[25px] font-black text-white tracking-tighter leading-none text-left"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          Featured <span className="text-[#BFF367]">Venues</span>
        </h2>
      </div>



      {/* Venue scroll — 1.8 cards on mobile */}
      {loading || turfLoading ? (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[65%] shrink-0 snap-start rounded-[12px] border animate-pulse aspect-[1080/1350]"
              style={{ backgroundColor: "#111", borderColor: BDR }}
            />
          ))}
        </div>
      ) : error || displayTurfs.length === 0 ? (
        <div className="text-center py-24 animate-fadeIn">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-gray-600" />
          </div>
          <p
            className="text-3xl mb-3 uppercase tracking-tighter font-black"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Venues Not Found
          </p>
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-8">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="relative group/scroll">
          {/* Universal Horizontal Scroll View */}
          <div className="relative">
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4 scroll-smooth"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {displayTurfs.slice(0, 10).map((t) => (
                <div key={t._id} className="w-[65%] shrink-0 snap-start aspect-[1080/1350]">
                  <VenueCard t={t} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </section>
  );
}

