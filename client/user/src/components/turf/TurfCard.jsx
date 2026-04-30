import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Heart, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Calendar,
  Zap
} from "lucide-react";
import axiosInstance from "../../hooks/useAxiosInstance";
import { generateHourlySlots, isSlotBooked } from "../../utils/slotUtils";

const TurfCard = ({ turf, featured = false, distance = "2.4 km" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSlotsVisible, setIsSlotsVisible] = useState(false);
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const to = `/turf/${turf._id}`;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.rating ?? 5.0;
  const reviews = turf.reviewCount ?? 8189;
  const location = turf.location ?? "Paramount colony, Hyderabad";
  const facilities = turf.facilities?.slice(0, 5) || ["Pavilion", "Washroom", "Flood Lights"];

  // Carousel logic
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Fetch slots when visible
  useEffect(() => {
    if (isSlotsVisible && slots.length === 0) {
      fetchSlots();
    }
  }, [isSlotsVisible]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const today = new Date().toISOString();
      const response = await axiosInstance.get(`/api/user/turf/timeSlot?turfId=${turf._id}&date=${today}`);
      if (response.data) {
        setBookedSlots(response.data.bookedTime || []);
        const generated = generateHourlySlots(turf.openTime, turf.closeTime);
        setSlots(generated);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const availableSlotsCount = slots.length > 0 
    ? slots.filter(s => !isSlotBooked(s, bookedSlots)).length 
    : "?";

  return (
    <div className="bg-[#0A0A0A] rounded-[2.5rem] border border-white/[0.05] overflow-hidden flex flex-col transition-all duration-500 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-black/50 group mb-6 h-auto lg:h-[340px]">
      
      <div className="flex flex-col lg:flex-row h-full">
        {/* ── Image Section (Left) ────────────────────────────────── */}
        <div className="relative w-full lg:w-[420px] h-[240px] lg:h-full overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
          <img
            src={images[currentImageIndex] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
            alt={turf.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 relative z-10"
          />
          
          {/* Carousel Overlays */}
          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/20" />
          
          {/* Featured & Rating Badges */}
          <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
            <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
              <Star size={14} className="text-[#84CC16] fill-[#84CC16]" />
              <span className="text-xs font-black text-white tracking-wider">{rating.toFixed(1)}</span>
            </div>
            {featured && (
              <div className="bg-[#84CC16] px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(132,204,22,0.3)]">
                <span className="text-[10px] font-black text-black uppercase tracking-widest">Featured</span>
              </div>
            )}
          </div>

          {/* Carousel Controls */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/40 hover:bg-[#84CC16] hover:text-black backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronRight size={20} />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {images.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentImageIndex ? "w-8 bg-[#84CC16]" : "w-2 bg-white/20"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Content Section (Right) ────────────────────────────── */}
        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="max-w-[70%]">
                <h3 className="text-3xl lg:text-4xl font-black text-white leading-none mb-3 tracking-tighter group-hover:text-[#84CC16] transition-colors font-display italic">
                  {turf.name}
                </h3>
                <div className="flex items-center gap-2 opacity-60">
                  <MapPin size={16} className="text-[#84CC16]" />
                  <span className="text-white text-xs font-bold uppercase tracking-widest truncate">{location}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-[#84CC16] transition-all text-white/40 hover:text-[#84CC16]">
                  <Share2 size={20} />
                </button>
                <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-[#84CC16] transition-all text-white/40 hover:text-[#84CC16]">
                  <Heart size={20} />
                </button>
              </div>
            </div>

            {/* Offer Badge & Amenities */}
            <div className="flex items-center flex-wrap gap-4 mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-[#84CC16]/10 border border-[#84CC16]/20 rounded-xl text-[#84CC16] text-[10px] font-black uppercase tracking-[0.2em]">
                <Zap size={12} className="mr-2 fill-[#84CC16]" />
                GW100 - Flat 100/- Off
              </div>
              
              <div className="flex items-center gap-3">
                {facilities.slice(0, 3).map((fac, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#84CC16]" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
            <div className="flex items-center gap-3 text-[#10B981] bg-[#10B981]/10 px-5 py-2.5 rounded-2xl border border-[#10B981]/20">
              <Clock size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{availableSlotsCount} slots left</span>
            </div>

            {/* Slots Toggle Button */}
            <button 
              onClick={() => setIsSlotsVisible(!isSlotsVisible)}
              className={`flex-1 min-w-[200px] py-5 rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                isSlotsVisible 
                ? "bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white" 
                : "bg-[#84CC16] text-black hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(132,204,22,0.2)]"
              }`}
            >
              {isSlotsVisible ? "Close Selection" : "Reserve Now"}
              <ArrowUpRight size={16} className={`transition-transform duration-500 ${isSlotsVisible ? "rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slots Section (Expandable) ─────────────────────────── */}
      {isSlotsVisible && (
        <div className="border-t border-white/[0.05] p-8 lg:p-10 bg-[#0F0F0F] animate-fadeInUp">
          {loadingSlots ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(132,204,22,0.2)]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                {slots.map((slot, i) => {
                  const booked = isSlotBooked(slot, bookedSlots);
                  return (
                    <div 
                      key={i} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group/slot ${
                        booked 
                        ? "bg-white/[0.02] border-white/[0.05] opacity-30 grayscale cursor-not-allowed" 
                        : "bg-white/[0.03] border-white/[0.05] hover:border-[#84CC16] hover:bg-[#84CC16]/5 cursor-pointer shadow-sm"
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${booked ? "text-white/40" : "text-white group-hover/slot:text-[#84CC16]"}`}>
                        {slot.label.split(" - ")[0]}
                      </span>
                      <span className={`text-[9px] font-bold ${booked ? "text-white/20" : "text-white/40"}`}>
                        {booked ? "RESERVED" : `₹${turf.pricePerHour}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Actions */}
              <div className="flex flex-col xl:flex-row items-center justify-between gap-8 pt-10 border-t border-white/[0.05]">
                <div className="flex flex-wrap items-center justify-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border border-white/20" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#84CC16] shadow-[0_0_10px_rgba(132,204,22,0.4)]" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Selected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Reserved</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full xl:w-auto">
                  <Link 
                    to={to}
                    className="flex-1 xl:flex-none px-10 py-4 rounded-xl border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.25em] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center justify-center gap-3"
                  >
                    View Full Details
                    <ArrowUpRight size={14} className="opacity-40" />
                  </Link>
                  <button 
                    disabled={true}
                    className="flex-1 xl:flex-none px-10 py-4 rounded-xl bg-white/5 text-white/20 font-black uppercase text-[10px] tracking-[0.25em] flex items-center justify-center gap-3 cursor-not-allowed border border-white/[0.02]"
                  >
                    <Calendar size={14} className="opacity-20" />
                    Confirm Booking
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TurfCard;
