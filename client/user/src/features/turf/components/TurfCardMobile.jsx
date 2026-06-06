import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Star, Heart, MapPin, Share2, MessageSquare, Bookmark, 
  Wallet, Users, Calendar, Clock, Info, ArrowRight, Lock, Zap, X
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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDateTimeDrawerOpen, setIsDateTimeDrawerOpen] = useState(false);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };
  const calendarDays = getDaysInMonth(currentMonthDate);

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
      console.error("Failed to toggle wishlist like:", err);
      toast.error("Failed to save venue");
    }
  };

  const handleBookNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedSlot) {
      toast.error("Please select a time slot to book");
      return;
    }

    navigate(`/checkout/${turf._id || turf.id}`, {
      state: {
        turfName: turf.name,
        selectedDate: selectedDate.dateObj.toISOString(),
        startTime: selectedSlot,
        duration: 1,
        amount: turf.pricePerHour || turf.price || 0,
        location: turf.location
      }
    });
  };

  return (
    <div className="w-full aspect-[7/10] md:aspect-[4/5] bg-[#0B0B0C] rounded-[20px] overflow-hidden border border-white/5 font-inter shadow-2xl flex flex-col">
      {/* ── Top Image Header (1080x447 ratio fixed) ── */}
      <div className="relative w-full aspect-[1080/447] shrink-0 group">
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

        {/* Featured Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-[#BFF367]/30 px-3 py-1.5 rounded-full">
          <Star size={12} className="text-[#BFF367] fill-[#BFF367]" />
          <span className="text-[10px] font-black text-[#BFF367] uppercase tracking-wider">Featured</span>
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

      {/* ── Content Area (Fills remaining height) ── */}
      <div className="flex-1 p-4 flex flex-col justify-start gap-4 bg-transparent shrink-0 overflow-hidden">
        
        {/* Title and Rating Row */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold font-['Open_Sans'] text-white tracking-tight leading-none mb-1">
              {turf.name}
            </h2>
            <div className="flex items-center gap-1.5 text-white/50 mt-0.5">
              <MapPin size={12} className="text-[#BFF367]" />
              <p className="text-xs font-medium">
                {turf.location || turf.city || 'Sector 42, Gurugram, Haryana'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[#BFF367]">
              <Star size={14} className="fill-[#BFF367]" />
              <span className="text-lg font-bold leading-none">{rating.toFixed(1)}</span>
            </div>
            <span className="text-[9px] text-white/50 mt-0.5">{reviewsCount} Reviews</span>
          </div>
        </div>

        {/* Info Pills */}
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-3">
          <div className="flex items-center gap-1 shrink-0">
            <Zap size={12} className="text-white/60" />
            <span className="text-[10px] font-semibold text-white/80">{sportDisplay}</span>
          </div>

          <div className="w-[1px] h-3 bg-white/20 shrink-0" />

          <div className="flex items-center justify-center gap-1 shrink-0">
            <Wallet size={12} className="text-[#BFF367]" />
            <span className="text-[10px] font-bold text-white leading-none">250 Coins</span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-white">Select Date</h4>
          <div className="grid grid-cols-5 gap-1.5 md:w-[85%]">
            {dates.slice(0, 4).map((d, idx) => {
              const isSelected = selectedDate.dateNum === d.dateNum;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center w-full aspect-[3/4] rounded-xl border transition-all ${
                    isSelected 
                      ? "border-[#BFF367] text-[#BFF367] bg-[#BFF367]/10" 
                      : "border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-widest opacity-70 mb-0.5">{d.dayName.substring(0, 3)}</span>
                  <span className="text-lg font-black leading-none">{d.dateNum}</span>
                </button>
              );
            })}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDateTimeDrawerOpen(true); }}
              className="flex flex-col items-center justify-center w-full aspect-[3/4] rounded-xl border border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20 hover:text-white transition-all group"
            >
              <Calendar size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Time Slot Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white">
              <Clock size={12} />
              <h4 className="text-xs font-bold">Select time slot</h4>
            </div>
            <div className="flex items-center gap-1 text-white/40">
              <Info size={10} />
              <span className="text-[8px]">All slots are 1 hour</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {defaultSlots.map((slot, idx) => {
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className={`relative py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center justify-center ${
                    isSelected
                      ? "bg-[#BFF367] border-[#BFF367] text-black"
                      : "border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Book Now Button & Footer */}
        <div className="flex flex-col gap-2 mt-auto">
          <button 
            onClick={handleBookNow}
            className="w-full bg-[#BFF367] hover:bg-[#aade55] text-black font-black text-sm py-2.5 rounded-xl flex items-center justify-center transition-colors relative"
          >
            <span>Book Now</span>
          </button>
        </div>
      </div>

      {/* Date & Time Selector Drawer */}
      {isDateTimeDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-start">
          <style>{`
            @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideDownDrawer { from { transform: translateY(-100%); } to { transform: translateY(0); } }
          `}</style>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            style={{ animation: 'fadeOverlay 0.3s ease-out' }}
            onClick={(e) => { e.stopPropagation(); setIsDateTimeDrawerOpen(false); }}
          />
          <div 
            className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#111] p-6 flex flex-col overflow-y-auto no-scrollbar"
            style={{ animation: 'slideDownDrawer 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-white">Select Date & Time</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDateTimeDrawerOpen(false); }}
                className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col mb-6 shrink-0 bg-[#1A1A1A] p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white">Select Date</h4>
                <div className="flex items-center gap-3 bg-black/40 rounded-full px-2 py-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)); }}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider min-w-[60px] text-center">
                    {currentMonthDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)); }}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[9px] text-white/30 font-bold py-1 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const isSelected = selectedDate?.dateObj && day.toDateString() === selectedDate.dateObj.toDateString();
                  // Check if selectedDate from initial map is used (which uses dateNum)
                  const isInitiallySelected = !selectedDate.dateObj && day.getDate() === selectedDate.dateNum && day.getMonth() === new Date().getMonth();
                  const isActive = isSelected || isInitiallySelected;
                  
                  const isPast = day < new Date(new Date().setHours(0,0,0,0));
                  return (
                    <button
                      key={idx}
                      disabled={isPast}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate({
                          dateObj: day,
                          dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
                          dateNum: day.getDate(),
                          month: day.toLocaleDateString("en-US", { month: "short" })
                        });
                      }}
                      className={`aspect-square rounded-full flex items-center justify-center text-[11px] transition-all ${
                        isActive 
                          ? "bg-[#BFF367] text-black font-black shadow-[0_0_15px_rgba(191,243,103,0.3)]" 
                          : isPast ? "text-white/10 cursor-not-allowed" : "text-white/80 hover:bg-white/10 font-bold"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <h4 className="text-sm font-bold text-white mb-3 shrink-0">Time Slots</h4>
            <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
              {defaultSlots.map((slot, idx) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setSelectedSlot(slot); }}
                    className={`py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center ${
                      isSelected ? "border-[#BFF367] text-black bg-[#BFF367]" : "border-[#222] bg-[#1A1A1A] text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDateTimeDrawerOpen(false); }}
              className="w-full mt-auto md:mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition-colors shrink-0"
            >
              Confirm Selection
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TurfCardMobile;
