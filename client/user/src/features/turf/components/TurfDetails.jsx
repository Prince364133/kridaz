import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, Star, Calendar as CalendarIcon, Clock, ShieldAlert,
  ArrowRight, Phone, MessageCircle, AlertCircle, Sparkles, Navigation,
  ShieldCheck, Share2, Info, Landmark, Layers, Users, Eye, Zap, Heart
} from "lucide-react";
import { format, addDays } from "date-fns";
import useTurfDetails from "@hooks/useTurfDetails";
import useTimeSelection from "@hooks/useTimeSelection";
import useDateSelection from "@hooks/useDateSelection";
import useDurationSelection from "@hooks/useDurationSelection";
import Reviews from "@components/reviews/Reviews.jsx";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@hooks/useAxiosInstance";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import { TurfCard } from "@features/turf";

const TurfDetails = () => {
  const { id: turfId } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [duration, setDuration] = useState(1);
  const [bookedTime, setBookedTime] = useState([]);
  const [timeSlots, setTimeSlots] = useState({});
  const [pricePerHour, setPricePerHour] = useState(0);
  const [activeTab, setActiveTab] = useState("about");
  const [paymentOption, setPaymentOption] = useState("FULL"); // 'FULL' | 'PARTIAL'
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(turfId, { limit: 4 });

  // ── Telemetry View & Dwell Time Tracking ──
  useEffect(() => {
    if (!turfId) return;

    // Log the initial view page mount
    axiosInstance.post("/api/user/turf/user/interaction", {
      turfId,
      type: "VIEW",
      duration: 0
    }).catch(err => console.error("[TELEMETRY] Failed to log page view:", err));

    const entryTime = Date.now();

    return () => {
      // Calculate dwell time on unmount
      const dwellSeconds = Math.round((Date.now() - entryTime) / 1000);
      if (dwellSeconds > 0) {
        axiosInstance.post("/api/user/turf/user/interaction", {
          turfId,
          type: "VIEW",
          duration: dwellSeconds
        }).catch(err => console.error("[TELEMETRY] Failed to log dwell time:", err));
      }
    };
  }, [turfId]);

  // Custom Hooks with encapsulated state selectors
  const { turf, reviews, loading } = useTurfDetails(turfId);
  const { handleDateChange } = useDateSelection(
    setSelectedDate,
    setSelectedStartTime,
    setDuration
  );

  const { availableTimes, handleTimeSelection, isTimeSlotBooked } =
    useTimeSelection(
      selectedDate,
      turfId,
      setSelectedStartTime,
      setBookedTime,
      setTimeSlots,
      setPricePerHour,
      bookedTime,
      timeSlots,
      setDuration
    );

  const { handleDurationChange, isDurationAvailable } = useDurationSelection(
    selectedStartTime,
    timeSlots,
    isTimeSlotBooked,
    setDuration
  );

  // ── Calculation engine ───────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    if (!selectedStartTime) return 0;
    // Find current selected slot's dynamic price, fallback to pricePerHour
    const currentSlot = availableTimes.find(t => t.startTime === selectedStartTime);
    const hourlyPrice = currentSlot?.price || pricePerHour || 500;
    return hourlyPrice * duration;
  }, [selectedStartTime, duration, availableTimes, pricePerHour]);

  const advanceAmount = useMemo(() => {
    // 30% advance deposit for partial payments
    return Math.round(subtotal * 0.3);
  }, [subtotal]);

  const balanceAmount = useMemo(() => {
    return subtotal - advanceAmount;
  }, [subtotal, advanceAmount]);

  // Generate 7 upcoming days for horizontal carousel
  const dateList = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  }, []);

  const initiatePayment = () => {
    const timeSlotObj = timeSlots.generatedSlots?.find(
      (slot) => slot.startTime === selectedStartTime
    );

    if (!timeSlotObj) {
      alert("Invalid slot selection!");
      return;
    }

    const payload = {
      turfId,
      date: format(selectedDate, "yyyy-MM-dd"),
      timeSlotId: timeSlotObj._id,
      duration,
      paymentType: paymentOption,
      totalPrice: subtotal,
      advanceAmount: paymentOption === "PARTIAL" ? advanceAmount : subtotal,
      balanceAmount: paymentOption === "PARTIAL" ? balanceAmount : 0,
    };

    localStorage.setItem("pending_booking", JSON.stringify(payload));
    window.location.href = `/payment-checkout?turfId=${turfId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Turf Arena...</p>
        </div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-zinc-500 mx-auto" />
          <p className="text-zinc-400 font-bold uppercase">Arena Not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-[#84CC16]/20">
      
      {/* ── Panoramic Gallery Banner ── */}
      <div className="relative h-[40vh] sm:h-[60vh] w-full overflow-hidden group">
        <img
          src={turf.images?.[0] || turf.image || "/banner-1.png"}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
        />
        
        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent" />

        {/* Floating Quick Action Row */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
          <Link
            to="/turf"
            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-all font-bold text-xs uppercase tracking-widest"
          >
            ← Arenas
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                try {
                  setIsWishlisted(!isWishlisted);
                  await axiosInstance.post("/api/user/turf/user/like", { turfId });
                } catch (err) {
                  setIsWishlisted(isWishlisted);
                  console.error("[TELEMETRY] Failed to toggle wishlist:", err);
                }
              }}
              className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-[#84CC16] hover:text-black transition-all"
            >
              <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500 scale-110" : ""} />
            </button>
            <button 
              onClick={async () => {
                try {
                  const shareUrl = window.location.href;
                  await navigator.clipboard.writeText(shareUrl);
                  alert("Ground detail link copied to clipboard!");
                  await axiosInstance.post("/api/user/turf/user/share", { turfId });
                } catch (err) {
                  console.error("[TELEMETRY] Failed to record share:", err);
                }
              }}
              className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-all"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Floating Arena Name Tag */}
        <div className="absolute bottom-10 left-6 sm:left-12 right-6 z-20 max-w-5xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {(turf.sportTypes || ["Football"]).map((sport, i) => (
              <span key={i} className="px-3 py-1 bg-[#84CC16] text-black text-[9px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                {sport}
              </span>
            ))}
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
              <Star size={10} className="fill-[#84CC16] text-[#84CC16]" />
              {turf.avgRating?.toFixed(1) || "4.8"} ({reviews?.length || 0} reviews)
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
            {turf.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-zinc-300">
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-[#84CC16]" />
              <span>{turf.city || turf.location}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#84CC16]" />
              <span className="uppercase text-[9px] font-black tracking-widest text-[#84CC16]">Kridaz Verified Venue</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Columns ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Details & Tabs */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Custom Tabs Navigation */}
          <div className="flex border-b border-zinc-800">
            {["about", "amenities", "location", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 font-black uppercase text-[10px] sm:text-xs tracking-widest border-b-2 transition-all relative ${
                  activeTab === tab 
                    ? "border-[#84CC16] text-[#84CC16]" 
                    : "border-transparent text-zinc-500 hover:text-white"
                }`}
              >
                {tab}
                {tab === "reviews" && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px]">
                    {reviews?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Views */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "about" && (
                <div className="space-y-8">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#84CC16] flex items-center gap-2">
                      <Sparkles size={16} /> Venue Description
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed font-normal">
                      {turf.description || 
                        `Experience elite-tier performance at ${turf.name}. Built with FIFA-standard astro-turf, professional-grade floodlights, and premium amenities. Perfectly engineered for high-intensity 5-a-side and 7-a-side matches. Conveniently accessible location with ample secure parking space.`}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-28">
                      <Users size={20} className="text-[#84CC16]" />
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Format</p>
                        <p className="text-xs font-bold text-white uppercase">{turf.sportTypes?.[0] === "CRICKET" ? "Box Cricket" : "5v5 / 7v7"}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-28">
                      <Clock size={20} className="text-[#84CC16]" />
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Timing</p>
                        <p className="text-xs font-bold text-white uppercase">{turf.openTime || "06:00 AM"} - {turf.closeTime || "11:00 PM"}</p>
                      </div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-28 col-span-2 sm:col-span-1">
                      <Layers size={20} className="text-[#84CC16]" />
                      <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Surface</p>
                        <p className="text-xs font-bold text-white uppercase">Premium Astro</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "amenities" && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#84CC16]">Facilities Included</h3>
                  {turf.amenities && turf.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {turf.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                          <div className="w-2 h-2 rounded-full bg-[#84CC16]" />
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider text-center py-6">No amenities specified for this venue.</p>
                  )}
                </div>
              )}

              {activeTab === "location" && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#84CC16]">Location Address</h3>
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide mt-2">{turf.location}</p>
                    </div>
                    <a
                      href={turf.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(turf.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#84CC16] text-black font-black uppercase tracking-widest rounded-xl text-[10px] shrink-0"
                    >
                      <Navigation size={12} fill="currentColor" /> Directions
                    </a>
                  </div>

                  {/* Optional Embeddable Map Container */}
                  <div className="h-60 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                    {/* Simulated Interactive Map */}
                    <div className="text-center space-y-2 p-6">
                      <MapPin size={32} className="text-[#84CC16] mx-auto animate-bounce" />
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Interactive Map Activated</p>
                      <span className="text-zinc-600 text-[9px] uppercase font-bold">{turf.city || "View location details"}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <Reviews turfId={turfId} reviews={reviews} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Manager / On-Ground Support Card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-4">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-[#84CC16]">
                  <Users size={18} />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-white">On-Ground Support</h4>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Direct communication lines</p>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {turf.managerContacts && turf.managerContacts.length > 0 ? (
                  turf.managerContacts.map((contact, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wide">{contact.name || "Venue Manager"}</p>
                        <p className="text-xs font-bold text-white">{contact.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${contact.phone}`} className="p-2.5 bg-[#84CC16] text-black rounded-xl hover:scale-105 transition-all">
                          <Phone size={12} fill="currentColor" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-4 text-center border border-dashed border-zinc-900 rounded-2xl">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Support lines loaded dynamically</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Dynamic Scheduler & Checkout Core */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-6 space-y-6">
            
            {/* The Booking Engine Terminal */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              
              {/* Terminal Title Header */}
              <div className="p-6 pb-4 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Match Scheduler</h3>
                    <p className="text-[9px] font-bold text-[#84CC16] uppercase tracking-widest flex items-center gap-1.5">
                       <Zap size={10} fill="currentColor" /> Instant Confirmation
                    </p>
                 </div>
                 <div className="text-right">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Hourly Rate</span>
                    <p className="text-xl font-black text-white leading-none mt-1">₹{pricePerHour || 800}</p>
                 </div>
              </div>

              {/* Engine Body */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* 1. Date Selector Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">1. Select Match Date</p>
                     <span className="text-[9px] font-bold text-[#84CC16] uppercase tracking-widest bg-[#84CC16]/10 px-2 py-0.5 rounded">
                       {format(selectedDate, "MMMM yyyy")}
                     </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    {dateList.map((date, index) => {
                      const isSelected = format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateChange(date)}
                          className={`flex flex-col items-center justify-center w-14 h-18 shrink-0 rounded-2xl border transition-all snap-start ${
                            isSelected
                              ? "bg-[#84CC16] border-[#84CC16] text-black shadow-lg shadow-[#84CC16]/20"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <span className={`text-[8px] font-black uppercase tracking-wide ${isSelected ? "text-black" : "text-zinc-500"}`}>
                            {format(date, "EEE")}
                          </span>
                          <span className="text-lg font-black tracking-tighter mt-1">{format(date, "dd")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Custom Time Slot Grid */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2. Choose Play Slot</p>
                  
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {availableTimes.map((slot, index) => {
                        const isBooked = isTimeSlotBooked(slot.startTime);
                        const isSelected = selectedStartTime === slot.startTime;

                        return (
                          <button
                            key={index}
                            disabled={isBooked}
                            onClick={() => handleTimeSelection(slot.startTime)}
                            className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex flex-col items-center justify-center ${
                              isBooked
                                ? "bg-zinc-950 border-zinc-900/60 text-zinc-700 line-through cursor-not-allowed"
                                : isSelected
                                ? "bg-white border-white text-black font-black"
                                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                            }`}
                          >
                            <span>{slot.startTime}</span>
                            {slot.price !== pricePerHour && !isBooked && (
                              <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? "text-[#84CC16]" : "text-emerald-500"}`}>
                                ₹{slot.price}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-zinc-950 border border-dashed border-zinc-900 rounded-2xl">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">No active play slots found</p>
                    </div>
                  )}
                </div>

                {/* 3. Duration Selector (Disabled until slot selected) */}
                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">3. Select Duration</p>
                   <div className="flex gap-2">
                     {[1, 2, 3].map((hrs) => {
                       const isAvail = isDurationAvailable(selectedStartTime, hrs);
                       const isSelected = duration === hrs;

                       return (
                         <button
                           key={hrs}
                           disabled={!selectedStartTime || !isAvail}
                           onClick={() => handleDurationChange(hrs)}
                           className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                             !selectedStartTime || !isAvail
                               ? "bg-zinc-950 border-zinc-900/60 text-zinc-800 cursor-not-allowed"
                               : isSelected
                               ? "bg-[#84CC16] border-[#84CC16] text-black"
                               : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                           }`}
                         >
                           {hrs} {hrs === 1 ? "Hour" : "Hours"}
                         </button>
                       );
                     })}
                   </div>
                </div>

                {/* 4. Checkout Preview Core */}
                {selectedStartTime && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-4 border-t border-white/5"
                  >
                    {/* Multi-Payment Strategy Switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-2xl">
                      <button
                        onClick={() => setPaymentOption("FULL")}
                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          paymentOption === "FULL"
                            ? "bg-zinc-900 text-[#84CC16] border border-[#84CC16]/20 font-black"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        Full Payment
                      </button>
                      <button
                        onClick={() => setPaymentOption("PARTIAL")}
                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center ${
                          paymentOption === "PARTIAL"
                            ? "bg-zinc-900 text-[#84CC16] border border-[#84CC16]/20 font-black"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        <span>Partial Pay</span>
                        <span className="text-[7px] font-bold text-zinc-400 mt-0.5">30% ADVANCE DEPOSIT</span>
                      </button>
                    </div>

                    {/* Financial Receipt Grid */}
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3.5 text-xs">
                       <div className="flex justify-between font-bold text-zinc-500">
                          <span className="uppercase">Court Booking x {duration} Hrs</span>
                          <span className="text-white font-black">₹{subtotal}</span>
                       </div>
                       
                       {paymentOption === "PARTIAL" && (
                         <motion.div 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="space-y-3.5 pt-3.5 border-t border-white/5"
                         >
                            <div className="flex justify-between font-bold text-[#84CC16]">
                               <span className="uppercase flex items-center gap-1"><Landmark size={12} /> Pay Now (Advance)</span>
                               <span className="font-black">₹{advanceAmount}</span>
                            </div>
                            <div className="flex justify-between font-bold text-zinc-500">
                               <span className="uppercase flex items-center gap-1"><Clock size={12} /> Pay at Arena</span>
                               <span className="text-white font-black">₹{balanceAmount}</span>
                            </div>
                         </motion.div>
                       )}

                       <div className="flex justify-between items-center pt-3.5 border-t border-white/5 font-black text-white text-sm">
                          <span className="uppercase">Amount to Pay</span>
                          <span className="text-lg font-black text-[#84CC16]">
                            ₹{paymentOption === "PARTIAL" ? advanceAmount : subtotal}
                          </span>
                       </div>
                    </div>
                  </motion.div>
                )}

                {/* Submit Primary CTA */}
                <button
                  disabled={!selectedStartTime}
                  onClick={initiatePayment}
                  className={`w-full h-14 rounded-2xl font-black uppercase text-[10.5px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    selectedStartTime
                      ? "bg-[#84CC16] text-black hover:scale-[1.02] shadow-lg shadow-[#84CC16]/10"
                      : "bg-zinc-950 border border-zinc-900 text-zinc-700 cursor-not-allowed"
                  }`}
                >
                  Confirm & Pay Now
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Safety Assured Footer Accent */}
              <div className="p-4 bg-zinc-950 border-t border-white/5 flex items-center justify-center gap-2 text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                 <ShieldCheck size={14} className="text-[#84CC16]" />
                 Secure payment protocols enforced
              </div>
            </div>
            
            {/* Arena Booking Policies Box */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84CC16] flex items-center gap-2">
                 <Info size={14} /> Arena Rules & Policies
              </h4>
              <ul className="space-y-3.5 text-zinc-400 text-xs">
                <li className="flex items-start gap-2.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mt-1.5 shrink-0" />
                   <span>Show up 10 minutes prior to scheduled slot time.</span>
                </li>
                <li className="flex items-start gap-2.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mt-1.5 shrink-0" />
                   <span>Cancellations valid up to 72 hours before the game starts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mt-1.5 shrink-0" />
                   <span>Ensure appropriate non-marking shoes or studs are worn.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Arenas Nearby Section */}
      {(similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
        <section className="mt-20 pt-16 border-t border-zinc-900 max-w-7xl mx-auto px-6 sm:px-12 w-full animate-fade-in">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#84CC16] rounded-full shadow-[0_0_20px_rgba(132,204,22,0.4)] hidden md:block"></div>
              <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
                SIMILAR <span className="text-[#84CC16]">ARENAS NEARBY</span>
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-3 font-inter">
                ML Proximity Recommendations • Similar Surface & Sports Facilities Nearby
              </p>
            </div>
          </div>

          {similarLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="rounded-[2rem] border border-white/5 bg-[#0d0d0d] animate-pulse h-[360px] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[60%]" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                    <div className="h-6 bg-white/10 rounded-lg w-[70%]" />
                    <div className="h-4 bg-white/5 rounded-lg w-[40%]" />
                    <div className="pt-3 border-t border-white/5 flex justify-between">
                      <div className="h-8 bg-white/10 rounded-lg w-[40%]" />
                      <div className="h-8 bg-white/10 rounded-lg w-[30%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {similarTurfs.map((t) => (
                <TurfCard 
                  key={t.id || t._id} 
                  turf={t} 
                  distance={t.distance ? `${(t.distance / 1000).toFixed(1)} km Away` : "Nearby"}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TurfDetails;
