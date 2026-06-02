import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Star, Heart, MapPin, Share2, MessageSquare, Bookmark,
  Wallet, Users, Calendar, Clock, Info, ArrowRight, Lock, Zap
} from "lucide-react";
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

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateObj: d,
      dayName: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" })
    });
  }
  return dates;
};

const TurfCardMobile = ({ turf, distance: distanceProp }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);

  const { data: savedData } = useGetSavedTurfsQuery(undefined, { skip: !isLoggedIn });
  const [toggleLikeApi] = useToggleTurfLikeMutation();

  const targetId = turf.id || turf._id;
  const isWishlisted = isLoggedIn && savedData?.turfs?.some(t => (t.id || t._id) === targetId);

  const returnTo = searchParams.get('returnTo');
  const baseTo = `/venue/${targetId}`;
  const to = returnTo ? `${baseTo}?returnTo=${encodeURIComponent(returnTo)}` : baseTo;
  const images = turf.images?.length > 0 ? turf.images : [turf.image];
  const rating = turf.averageRating ?? turf.avgRating ?? turf.rating ?? 4.8;
  const reviewsCount = turf.reviewsCount ?? 128; // fallback mock

  // Extract sports
  const sportTypes = turf.sportTypes || ["SPORTS"];
  const sportDisplay = sportTypes[0] || "Football (5v5)";

  // Dates & Slots
  const [dates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState("06:30 - 07:30");

  const defaultSlots = [
    "06:30 - 07:30",
    "07:30 - 08:30",
    "14:30 - 15:30",
    "15:30 - 16:30"
  ];

  // ── Distance calculation ──
  const [calcDistance, setCalcDistance] = useState(null);
  useEffect(() => {
    if (distanceProp) return;
    const venueLat = turf.location?.coordinates?.[1] ?? turf.latitude ?? turf.lat;
    const venueLng = turf.location?.coordinates?.[0] ?? turf.longitude ?? turf.lng;
    if (!venueLat || !venueLng) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, venueLat, venueLng);
          setCalcDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
        },
        () => { },
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
      console.error("Failed to toggle wishlist like:", err);
      toast.error("Failed to save venue");
    }
  };

  const handleBookNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(to);
  };

  return (
    <div className="w-full bg-[#111] rounded-[16px] overflow-hidden border border-[#222] font-inter shadow-2xl flex flex-col">
      {/* ── Top Image Header ── */}
      <div className="relative h-[130px] md:h-[160px] w-full shrink-0 group">
        <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img || "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80"}
              alt={`${turf.name} - ${idx + 1}`}
              className="w-full h-full object-cover shrink-0 snap-center transition-transform duration-700"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/40 pointer-events-none" />

        {/* ── Top Right Area: Wishlist Button ── */}
        <div className="absolute top-4 right-4 z-20">
          {/* Featured Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-[#BFF367]/30 px-3 py-1.5 rounded-full">
            <Star size={12} className="text-[#BFF367] fill-[#BFF367]" />
            <span className="text-[10px] font-black text-[#BFF367] uppercase tracking-wider">Featured</span>
          </div>

          {/* Wishlist Heart */}
          <button
            onClick={toggleWishlist}
            className={`rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-300 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all duration-300"
          >
            <Heart
              size={18}
              className={`transition-all duration-300 ${isWishlisted ? "fill-red-500 text-red-500 scale-110" : "text-white"}`}
            />
          </button>

          {/* Location Pill */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
            <MapPin size={12} className="text-[#BFF367]" />
            <span className="text-[11px] font-bold text-white tracking-wide">
              {distance || "1.2 km away"}
            </span>
          </div>

          {/* Pagination Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-[#BFF367]' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="p-2.5 md:p-3 flex flex-col gap-2 md:gap-3 bg-[#111]">

          {/* Title and Rating Row */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none mb-1">
                {turf.name}
              </h2>
              <div className="flex items-center gap-1.5 text-white/50 mt-1">
                <MapPin size={14} className="text-[#BFF367]" />
                <p className="text-sm font-medium">
                  {turf.location || turf.city || 'Sector 42, Gurugram, Haryana'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end bg-[#1A1A1A] px-3 py-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-1 text-[#BFF367]">
                <Star size={16} className="fill-[#BFF367]" />
                <span className="text-xl font-bold leading-none">{rating.toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-white/50 mt-1">{reviewsCount} Reviews</span>
            </div>
          </div>

          {/* Info Pills */}
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-2 mt-1 pb-1">
            <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
              <Zap size={14} className="text-white/60" />
              <span className="text-[11px] font-semibold text-white/80">{sportDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
              <Users size={14} className="text-white/60" />
              <span className="text-[11px] font-semibold text-white/80">Up to 10 Players</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-[#1A1A1A] px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
              <Wallet size={14} className="text-[#BFF367]" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-none">250 Coins</span>
                <span className="text-[8px] text-white/50">Wallet Balance</span>
              </div>
            </div>
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

                {/* Date Selector */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">Select Date</h4>
                    <button className="p-1 bg-[#1A1A1A] rounded border border-white/5 text-white/60 hover:text-white">
                      <Calendar size={12} />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {dates.map((d, idx) => {
                      const isSelected = selectedDate.dateNum === d.dateNum;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(d)}
                          className={`flex flex-col items-center justify-center min-w-[56px] py-2 rounded-xl border transition-all ${isSelected
                              ? "border-[#BFF367] text-[#BFF367]"
                              : "border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20"
                            }`}
                        >
                          <span className={`text-[10px] font-bold ${isSelected ? "text-[#BFF367]" : "text-white/40"}`}>{d.dayName}</span>
                          <span className="text-lg font-bold mt-0.5">{d.dateNum}</span>
                          <span className={`text-[10px] ${isSelected ? "text-[#BFF367]" : "text-white/40"}`}>{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slot Selector */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white">
                      <Clock size={14} />
                      <h4 className="text-xs font-bold">Select time slot</h4>
                    </div>
                    <div className="flex items-center gap-1 text-white/40">
                      <Info size={10} />
                      <span className="text-[8px]">All slots are 1 hour</span>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div className="flex items-baseline gap-1 shrink-0 ml-1">
                    <span className={`font-bold text-[#BFF367] ${compact ? 'text-lg' : 'text-xl'}`}>₹{price}</span>
                    <span className="text-white/80 font-medium text-[10px] md:text-xs">/hr</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultSlots.map((slot, idx) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className={`relative py-2 rounded-lg border transition-all text-xs font-bold flex items-center justify-center ${isSelected
                              ? "border-[#BFF367] text-[#BFF367]"
                              : "border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20 hover:text-white"
                            }`}
                        >
                          {slot}
                          {isSelected && (
                            <div className="absolute right-3 w-4 h-4 bg-[#BFF367] rounded-full flex items-center justify-center">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between border-y border-[#222] py-1.5 mt-1">
                  <button className="flex items-center justify-center gap-1.5 flex-1 text-white/60 hover:text-white transition-colors border-r border-[#222]">
                    <Share2 size={12} />
                    <span className="text-[10px] font-semibold">Share</span>
                  </button>
                  <button className="flex items-center justify-center gap-1.5 flex-1 text-white/60 hover:text-white transition-colors border-r border-[#222]">
                    <MessageSquare size={12} />
                    <span className="text-[10px] font-semibold">Like / Comment</span>
                  </button>
                  <button className="flex items-center justify-center gap-1.5 flex-1 text-white/60 hover:text-white transition-colors">
                    <Bookmark size={12} />
                    <span className="text-[10px] font-semibold">Add to List</span>
                  </button>
                </div>

                {/* Book Now Button & Footer */}
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    onClick={handleBookNow}
                    className="w-full bg-[#BFF367] hover:bg-[#aade55] text-black font-black text-sm md:text-base py-2.5 md:py-3 rounded-xl flex items-center justify-center transition-colors relative"
                  >
                    <span>Book Now</span>
                    <div className="absolute right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <ArrowRight size={12} className="text-[#BFF367]" />
                    </div>
                  </button>

                  <div className="flex items-center justify-center gap-1 text-white/40 pb-1">
                    <Lock size={10} />
                    <span className="text-[9px]">Secure Booking & Safe Payments</span>
                  </div>
                </div>

              </div>
            </div>
            );
};

            export default TurfCardMobile;
