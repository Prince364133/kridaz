import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import useTurfData from "../hooks/useTurfData";
import useReviews from "@hooks/useReviews";
import Reviews from "@components/reviews/Reviews";
import TurfDetailsSkeleton from "../ui/TurfDetailsSkeleton";
import useReservation from "../hooks/useReservation";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import axiosInstance from "@hooks/useAxiosInstance";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import TurfCard from "./TurfCard.jsx";
import toast from "react-hot-toast";
import {
  MapPin,
  Clock,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Star,
  Zap,
  Users,
  ShieldCheck,
  Car,
  Coffee,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Info,
  ExternalLink,
  Phone,
  Navigation,
  Mail,
  User,
  Check,
  Activity,
  X
} from "lucide-react";

// Helper components for icons
const BatIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13.5 2L2 13.5l1.5 1.5L15 3.5 13.5 2z" />
    <path d="M15 3.5L20.5 9 22 7.5 16.5 2 15 3.5z" />
    <path d="M4.5 16L3 17.5 6.5 21 8 19.5 4.5 16z" />
  </svg>
);

const RacketIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="15" cy="9" r="6" />
    <path d="M10.5 13.5L3 21" />
    <path d="M15 6L12 9l3 3" />
    <path d="M12 6l3 3-3 3" />
  </svg>
);

const TurfDetails = () => {
  const { isLoggedIn } = useSelector((/** @type {any} */ state) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, turfs } = useTurfData();
  const { averageRating, reviews } = useReviews(id);
  const { gateInteraction } = useLoginOnDemand();
  const turf = turfs.find((t) => t._id === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Similar Recommendations
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(id, { limit: 4 });

  // ── Telemetry View & Dwell Time Tracking ──
  useEffect(() => {
    if (!id) return;

    // Log the initial view page mount
    axiosInstance.post("/api/user/turf/user/interaction", {
      turfId: id,
      type: "VIEW",
      duration: 0
    }).catch(err => Sentry.captureException(err));

    const entryTime = Date.now();

    return () => {
      // Calculate dwell time on unmount
      const dwellSeconds = Math.round((Date.now() - entryTime) / 1000);
      if (dwellSeconds > 0) {
        axiosInstance.post("/api/user/turf/user/interaction", {
          turfId: id,
          type: "VIEW",
          duration: dwellSeconds
        }).catch(err => Sentry.captureException(err));
      }
    };
  }, [id]);

  const images = turf?.images?.length > 0 ? turf.images : [turf?.image || "/banner-1.png"];
  const video = turf?.video;

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(video);

  // Combine media: video first, then images
  const mediaItems = video
    ? [
      { type: youtubeId ? "youtube" : "video", url: video, id: youtubeId },
      ...images.map(img => ({ type: "image", url: img }))
    ]
    : images.map(img => ({ type: "image", url: img }));

  // Auto-scroll media every 5 seconds
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % mediaItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const handleNext = () => setActiveImageIndex((prev) => (prev + 1) % mediaItems.length);
  const handlePrev = () => setActiveImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  const {
    selectedDate,
    selectedStartTime,
    availableTimes,
    handleDateChange,
    handleTimeSelection,
    isTimeSlotBooked,
    totalPrice,
    loading: bookingLoading,
  } = useReservation();

  const handleBookingClick = () => {
    gateInteraction(() => {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        // Build return URL
        const returnUrl = new URL(returnTo, window.location.origin);
        returnUrl.searchParams.set('groundId', turf._id);
        returnUrl.searchParams.set('date', selectedDate.toISOString());
        returnUrl.searchParams.set('time', selectedStartTime);
        returnUrl.searchParams.set('price', totalPrice || turf.pricePerHour);
        navigate(returnUrl.pathname + returnUrl.search);
      } else {
        navigate(`/checkout/${turf._id}`, {
          state: {
            turfName: turf.name,
            selectedDate: selectedDate.toISOString(),
            startTime: selectedStartTime,
            duration: 1, // Default duration
            amount: totalPrice,
            location: turf.location
          }
        });
      }
    }, {
      title: "Confirm Your Slot",
      message: "Ready to dominate the pitch? Sign in to securely book your time slot and get instant confirmation."
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: turf?.name || "Kridaz Venue",
      text: `Check out ${turf?.name} in ${turf?.location} on Kridaz!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      if (err.name !== 'AbortError') Sentry.captureException(err);
    }
  };

  if (loading) return <TurfDetailsSkeleton />;

  if (!turf) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[8px] text-center max-w-md w-full">
          <Info className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Venue Not Found</h2>
          <Link to="/venues" className="inline-flex items-center gap-2 bg-[#BFF367] text-black px-6 py-3 rounded-[6px] font-bold">
            <ChevronLeft className="w-5 h-5" /> Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const handleReservation = () => {
    if (!selectedStartTime) {
      toast.error("Please select a time slot");
      return;
    }
    handleBookingClick();
  };

  const bookingSelectorContent = (
    <div className="w-full bg-[#121212] rounded-[8px] border border-zinc-800 p-4 md:p-6 flex flex-col shadow-2xl overflow-hidden h-auto max-h-[600px] lg:max-h-[800px]">

      {/* Select Date */}
      <div className="space-y-4 shrink-0">
        <h3 className="text-[16px] font-medium text-white tracking-wide">Select Date</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 14 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const isActive = selectedDate.toISOString().split('T')[0] === dateStr;
            return (
              <div
                key={dateStr}
                className={`flex-none rounded-[12px] p-[2px] transition-all duration-300 ${isActive ? "bg-gradient-to-r from-[#BFF367] to-[#BFF367] shadow-[0_0_15px_rgba(85,222,232,0.2)]" : "bg-transparent" }`}
                style={{ width: '68px', height: '85px' }}
              >
                <button
                  onClick={() => handleDateChange(date)}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded-[10px] ${isActive ? "bg-[#1C1C1C]" : "bg-[#2A2A2A] hover:bg-[#333333]" }`}
                >
                  <span className={`text-[28px] font-bold leading-none tracking-tight ${isActive ? "text-white" : "text-zinc-200"}`}>
                    {String(date.getDate()).padStart(2, '0')}
                  </span>
                  <span className={`text-[13px] font-medium ${isActive ? "text-[#BFF367]" : "text-zinc-400"}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Select Time Slot */}
      <div className="space-y-4 mt-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <h3 className="text-[16px] font-medium text-white tracking-wide">Select Preffered time slot</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
          {availableTimes.length > 0 ? (
            availableTimes.map((slot, idx) => {
              const time = slot.startTime;
              const isBooked = isTimeSlotBooked(time);
              const isSelected = selectedStartTime === time;
              const isAvailable = !isBooked;

              // Format time to look like image 2 if it's just a start time
              let displayTime = time;
              if (!time.includes('-') && time.includes(':')) {
                try {
                  let [hours, minutes] = time.split(':');
                  hours = parseInt(hours, 10);
                  let endHours = (hours + 1) % 24;
                  let endHoursStr = String(endHours).padStart(2, '0');
                  let minutesStr = minutes.replace(/[^0-9]/g, '');
                  displayTime = `${hours.toString().padStart(2, '0')}:${minutesStr} - ${endHoursStr}:${minutesStr}`;
                } catch (e) { }
              }

              return (
                <div
                  key={idx}
                  className={`rounded-[8px] p-[1.5px] transition-all duration-300 ${isSelected ? "bg-gradient-to-r from-[#BFF367] to-[#BFF367] shadow-[0_0_10px_rgba(85,222,232,0.2)]" : "bg-transparent" }`}
                >
                  <button
                    disabled={!isAvailable}
                    onClick={() => handleTimeSelection(time)}
                    className={`w-full h-full py-[8.5px] px-2 rounded-[6.5px] text-[13px] font-medium tracking-wide transition-all duration-300 font-['Open_Sans'] ${isSelected ? "bg-[#1C1C1C] text-white" : isAvailable ? "bg-[#2A2A2A] text-zinc-300 hover:bg-[#333333]" : "bg-[#1A1A1A] text-zinc-600 cursor-not-allowed opacity-50" }`}
                  >
                    {displayTime}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-10 text-center bg-[#1A1A1A] rounded-[8px] border border-zinc-800">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-zinc-500">No Slots Available</p>
            </div>
          )}
        </div>
      </div>

      {/* Price & Proceed */}
      <div className="mt-auto pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4 shrink-0">
        <div className="space-y-0">
          <p className="text-[11px] font-medium uppercase text-zinc-500 mb-1">Price</p>
          <p className="text-2xl font-bold text-white leading-none">₹{totalPrice || turf.pricePerHour}</p>
        </div>
        <button
          onClick={handleReservation}
          disabled={bookingLoading || !selectedStartTime}
          className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black px-8 h-12 rounded-[10px] font-bold text-[14px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale shadow-[0_0_15px_rgba(85,222,232,0.3)] hover:shadow-[0_0_25px_rgba(191,243,103,0.5)]"
        >
          {bookingLoading ? "..." : (searchParams.get('returnTo') ? "Add this slot to my host game" : "Proceed")}
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-6 pb-24 font-inter">
      <AnimatePresence>
        {isPoliciesModalOpen && (
          <PoliciesModal
            isOpen={isPoliciesModalOpen}
            onClose={() => setIsPoliciesModalOpen(false)}
            rules={turf.rules}
            turfName={turf.name}
          />
        )}
      </AnimatePresence>
      <div className="max-w-[1400px] mx-auto px-4">

        <svg width="0" height="0" className="absolute">
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#BFF367" offset="0%" />
            <stop stopColor="#BFF367" offset="100%" />
          </linearGradient>
        </svg>

        <main
          className="relative flex flex-col lg:flex-row w-[1400px] max-w-full items-start justify-between gap-6 lg:gap-4 mx-auto"
          aria-label="Venue booking page"
        >
          {/* VenueOverviewSection */}
          <div className="w-full lg:w-[813px] flex-none space-y-6 lg:space-y-8">

            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-[#BFF367] transition-colors font-bold uppercase tracking-widest text-[11px] mb-[-10px] px-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {/* Venue Big Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-inter font-black uppercase tracking-tight text-white leading-tight px-2">
              {turf.name}
            </h1>

            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center justify-start md:justify-between gap-y-3 gap-x-4 text-[10px] md:text-[12px] font-bold uppercase tracking-widest px-2 font-inter w-full">
              <div className="flex items-center gap-2 shrink-0">
                <Star className="w-4 h-4" style={{ stroke: "url(#theme-gradient)", fill: "url(#theme-gradient)" }} />
                <span className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] inline-block text-transparent bg-clip-text">{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
                <span className="text-zinc-500 font-medium">({reviews?.length || 0} REVIEWS)</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2 shrink-0">
                <MapPin className="w-4 h-4" style={{ stroke: "url(#theme-gradient)" }} />
                <span className="text-zinc-400 font-medium">{turf.city || turf.location?.split(',')[0]} , {turf.state || "DODA"}</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4" style={{ stroke: "url(#theme-gradient)" }} />
                <span className="text-zinc-400 font-medium">{turf.openingTime || "01:10 AM"} — {turf.closingTime || "11:00 PM"}</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div
                onClick={() => setIsPoliciesModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group shrink-0"
              >
                <ShieldCheck className="w-4 h-4" style={{ stroke: "url(#theme-gradient)" }} />
                <span className="text-zinc-400 group-hover:text-[#BFF367] transition-colors font-medium">View Policies</span>
              </div>
            </div>

            {/* Hero Image */}
            <div
              className="relative w-full h-[300px] md:h-[500px] overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 group"
              style={{
                borderRadius: '15px'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full"
                >
                  {mediaItems[activeImageIndex].type === "youtube" ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${mediaItems[activeImageIndex].id}?autoplay=1&mute=1&loop=1&playlist=${mediaItems[activeImageIndex].id}&controls=0&showinfo=0&rel=0`}
                      title="Venue Video"
                      className="w-full h-full object-cover border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : mediaItems[activeImageIndex].type === "video" ? (
                    <video
                      src={mediaItems[activeImageIndex].url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaItems[activeImageIndex].url}
                      alt={turf.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[#BFF367] hover:text-black z-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[#BFF367] hover:text-black z-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Like and Share Actions */}
              <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
                <button onClick={() => setIsFavorite(!isFavorite)} className={`p-3 rounded-[8px] bg-black/40 backdrop-blur-md border ${isFavorite ? 'border-[#BFF367] text-[#BFF367]' : 'border-white/10 text-white'} hover:bg-[#BFF367] hover:text-black hover:border-transparent transition-all shadow-lg`}>
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button onClick={handleShare} className="p-3 rounded-[8px] bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-[#BFF367] hover:text-black hover:border-transparent transition-all shadow-lg">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Thumbnails */}
            {mediaItems.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x mt-4">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative flex-none w-24 h-16 md:w-32 md:h-20 rounded-[8px] overflow-hidden border-[2.5px] transition-all snap-start ${activeImageIndex === idx ? "border-[#BFF367]" : "border-transparent opacity-50 hover:opacity-100"}`}
                  >
                    {item.type === "youtube" ? (
                      <img src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : item.type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <img src={item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Venue Details Card */}
            <div className="bg-[#121212] rounded-[8px] border border-zinc-800 p-8 space-y-8 font-inter">

              {/* Title & Stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] inline-block text-transparent bg-clip-text text-2xl md:text-3xl font-inter font-bold">₹{turf.pricePerHour}</span>
                      <span className="text-zinc-500 text-[10px] md:text-xs font-inter font-bold uppercase tracking-widest">onwards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 md:w-5 md:h-5" style={{ stroke: "url(#theme-gradient)", fill: "url(#theme-gradient)" }} />
                      <span className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] inline-block text-transparent bg-clip-text text-lg md:text-xl font-inter font-bold">{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
                      <span className="text-zinc-500 text-[10px] md:text-xs font-inter font-bold uppercase tracking-widest">Star</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-12">
                {/* Sports Available */}
                <div className="space-y-4">
                  <h2 className="text-sm font-inter font-bold uppercase tracking-[0.15em] text-white">
                    Sports available
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {turf.sportTypes?.map((sport, i) => (
                      <div key={i} className="px-4 py-1.5 rounded-[6px] bg-zinc-900/50 border border-zinc-800 flex items-center gap-2 text-white group hover:border-[#BFF367] transition-all duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#BFF367] to-[#BFF367]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-inter">{sport}</span>
                      </div>
                    ))}
                    {!turf.sportTypes?.length && (
                      <div className="px-4 py-1.5 rounded-[6px] bg-zinc-900/50 border border-zinc-800 flex items-center gap-2 text-zinc-400">
                        <Activity className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-inter">Multisport</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ground Composition */}
                <div className="space-y-4">
                  <h2 className="text-sm font-inter font-bold uppercase tracking-[0.15em] text-white">Ground Composition</h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-1.5 rounded-[6px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white font-inter">
                        {turf.turfType || "Natural Grass"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personnel & Support Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#BFF367] to-[#BFF367] rounded-full" />
                  <h2 className="text-[13px] font-inter font-bold uppercase tracking-[0.1em] text-white">Personnel & Support</h2>
                </div>

                {/* Venue Managers */}
                <div className="space-y-3 w-full max-w-[300px]">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-inter">Venue Managers</p>
                  <div className="bg-[#0a0a0a] border border-zinc-800 border-dashed rounded-[12px] p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[12px] font-black text-white uppercase font-inter">{turf.name?.split(' ')[0] || "Princess"}</p>
                      <p className="text-[10px] font-bold text-zinc-500 font-inter tracking-tight">7896541230</p>
                    </div>
                    <button className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-[#BFF367] to-[#BFF367] flex items-center justify-center text-black hover:brightness-110 transition-all shadow-[0_0_15px_rgba(85,222,232,0.2)]">
                      <Phone size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-4">
                <h2 className="text-sm font-inter font-bold uppercase tracking-[0.15em] text-white">Facilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turf.facilities?.map((facility, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#BFF367] to-[#BFF367] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(85,222,232,0.3)]">
                        <Check className="w-3 h-3 text-black" strokeWidth={4} />
                      </div>
                      <span className="text-xs font-inter font-bold text-zinc-400 uppercase tracking-tight group-hover:text-white transition-colors">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Venue */}
              <div className="space-y-4">
                <h2 className="text-sm font-inter font-bold uppercase tracking-[0.15em] text-white">About Venue</h2>
                <div className={`text-zinc-500 text-sm font-inter leading-relaxed max-w-3xl whitespace-pre-line font-medium break-all ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                  {turf.description || "No description available for this venue."}
                </div>
                {turf.description && turf.description.length > 150 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-[#84CC16] hover:text-[#a3e635] text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                  >
                    {isDescExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>

            </div>

            {/* Similar Arenas Nearby Section */}
            {(similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
              <div className="pt-8 border-t border-zinc-900 animate-fade-in">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#84CC16] rounded-full shadow-[0_0_20px_rgba(132,204,22,0.4)] hidden md:block"></div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
                      SIMILAR <span className="text-[#84CC16]">ARENAS NEARBY</span>
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-2 font-inter">
                      ML Proximity Recommendations • Similar Surface & Sports
                    </p>
                  </div>
                </div>

                {similarLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[8px] border border-white/5 bg-[#0d0d0d] animate-pulse h-[300px] relative overflow-hidden"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {similarTurfs.slice(0, 4).map((t) => (
                      <TurfCard
                        key={t.id || t._id}
                        turf={t}
                        distance={t.distance ? `${(t.distance / 1000).toFixed(1)} km Away` : "Nearby"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <div className="pt-8 border-t border-zinc-900 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Open Sans', sans-serif" }}>Athlete Reviews</h2>
                <div className="flex items-center gap-2 font-black">
                  <Star className="w-5 h-5" style={{ stroke: "url(#theme-gradient)", fill: "url(#theme-gradient)" }} />
                  <span className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] inline-block text-transparent bg-clip-text text-xl md:text-2xl">{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
                  <span className="text-zinc-600 text-base md:text-lg">/ 5.0</span>
                </div>
              </div>
              <Reviews turfId={id} />
            </div>

          </div>

          {/* BookingSidebarSection */}
          <div className="w-full lg:flex-1 lg:min-w-[350px] space-y-8 lg:sticky lg:top-24">

            {/* Desktop Inline Booking Selector */}
            <div className="hidden lg:block">
              {bookingSelectorContent}
            </div>

            {/* Mobile Booking Card Modal */}
            <div className="lg:hidden">
              <AnimatePresence>
                {isBookingModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                      onClick={() => setIsBookingModalOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 100, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 100, scale: 0.95 }}
                      className="relative z-10 w-full max-w-lg"
                    >
                      <button
                        onClick={() => setIsBookingModalOpen(false)}
                        className="absolute -top-12 right-0 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                      {bookingSelectorContent}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Map Card */}
            <div className="rounded-[8px] overflow-hidden border border-zinc-800 shadow-2xl h-[200px] relative group">
              <VenueMap turf={turf} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />
            </div>

          </div>

        </main>

        {/* Floating Book Now Button */}
        {!isBookingModalOpen && (
          <div className="fixed bottom-24 md:bottom-6 right-4 z-[90] lg:hidden">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-6 py-3 rounded-[6px] bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black uppercase text-sm tracking-widest shadow-[0_10px_30px_rgba(191,243,103,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Book Venue Now <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const VenueMap = ({ turf }) => {
  const hasCoords =
    turf?.locationData?.coordinates?.length === 2 &&
    turf.locationData.coordinates[0] !== 0;

  const lat = hasCoords ? turf.locationData.coordinates[1] : null;
  const lng = hasCoords ? turf.locationData.coordinates[0] : null;

  const addressQuery = encodeURIComponent(
    [turf.name, turf.location, turf.city, turf.state].filter(Boolean).join(", ")
  );

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const openDirections = () => {
    const directionsUrl = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;
    window.open(directionsUrl, "_blank");
  };

  return (
    <div
      onClick={openDirections}
      className="relative w-full h-full cursor-pointer group/map"
    >
      <iframe
        title="Venue Location"
        src={embedSrc}
        width="100%"
        height="100%"
        style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) saturate(0.5) brightness(0.7)" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="pointer-events-none"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#BFF367] to-[#BFF367] flex items-center justify-center shadow-[0_0_30px_rgba(85,222,232,0.6)] animate-bounce">
          <MapPin className="w-6 h-6 text-black" />
        </div>
      </div>

      {/* Click for Directions Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover/map:bg-black/40 transition-all flex items-end justify-center pb-4 opacity-0 group-hover/map:opacity-100">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-[6px] border border-white/10 flex items-center gap-2">
          <Navigation size={14} className="text-[#BFF367]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Get Directions</span>
        </div>
      </div>
    </div>
  );
};

// Simple Policies Modal Component
const PoliciesModal = ({ isOpen, onClose, rules, turfName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[#121212] border border-zinc-800 rounded-[8px] p-8 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BFF367]/10 flex items-center justify-center border border-[#BFF367]/20">
                  <ShieldCheck className="w-6 h-6 text-[#BFF367]" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white font-open-sans">Venue Policies</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-zinc-900/50 rounded-[12px] border border-zinc-800">
                <p className="text-[10px] font-black text-[#BFF367] uppercase tracking-[0.2em] mb-2">Venue</p>
                <p className="text-sm font-bold text-white uppercase">{turfName}</p>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-zinc-400 text-sm font-inter leading-relaxed whitespace-pre-line">
                  {rules || "Players are requested to maintain discipline and sportsmanship inside the venue premises. Booking cancellations must be made at least 24 hours before the scheduled slot to be eligible for rescheduling or refund consideration. Any damage caused to the facility or equipment will be the responsibility of the booking party. Outside alcohol, smoking, illegal activities, and abusive behavior are strictly prohibited within the venue. Players must arrive on time for their booked slots, and management reserves the right to cancel bookings due to weather conditions, maintenance, or safety concerns. Proper sports shoes and appropriate sportswear are recommended while using the facility."}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black py-4 rounded-[8px] font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-lg"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TurfDetails;
