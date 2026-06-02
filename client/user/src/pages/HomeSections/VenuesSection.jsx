/* eslint-disable react/prop-types */
import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import TurfCardMobile from "../../features/turf/components/TurfCardMobile";

const BDR = "#2A2A2A";

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

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-8 w-full">
      <div className="relative flex flex-row items-center justify-between gap-4 mb-6">
        <div className="relative">
          <h2
            className="text-[18px] md:text-[30px] font-black text-white uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            VENUES {userLocation?.city || userLocation?.state ? "IN " : "NEAR "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367]">
              {userLocation?.city || userLocation?.state || "YOU"}
            </span>
          </h2>
        </div>
        <Link
          to="/venues"
          className="flex items-center gap-1 font-semibold text-[10px] md:text-[15px] transition-all hover:text-[#BFF367] text-[#888] whitespace-nowrap"
        >
          View All <span className="hidden md:inline">Venues</span>
        </Link>
      </div>



      {/* Venue scroll — 1.8 cards on mobile */}
      {loading || turfLoading ? (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[85vw] md:w-[calc(50%-8px)] shrink-0 snap-start rounded-[24px] border animate-pulse aspect-[1080/1350]"
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
          {/* Left Arrow (Desktop only) */}
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:bg-[#BFF367] hover:text-black shadow-xl"
          >
            <ChevronLeft size={28} />
          </button>

          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4 scroll-smooth"
          >
            {displayTurfs.slice(0, 10).map((t) => (
              <div key={t._id} className="w-[85vw] md:w-[calc(50%-8px)] shrink-0 snap-start">
                <TurfCardMobile
                  turf={t}
                  distance={t.distance ? `${t.distance} km` : "1.2 km"}
                />
              </div>
            ))}
          </div>

          {/* Right Arrow (Desktop only) */}
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 opacity-0 group-hover/scroll:opacity-100 transition-all duration-300 hover:bg-[#BFF367] hover:text-black shadow-xl"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}


    </section>
  );
}

