import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useTurfData from "../../hooks/useTurfData";
import useReviews from "../../hooks/useReviews";
import Reviews from "../reviews/Reviews";
import TurfDetailsSkeleton from "../ui/TurfDetailsSkeleton";
import useReservation from "../../hooks/useReservation";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { 
  MapPin, 
  Clock, 
  Activity, 
  IndianRupee, 
  ChevronLeft, 
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
  User
} from "lucide-react";

import WriteReview from "../../components/reviews/WriteReview";
// import CoinDeductionModal from "../../components/modals/CoinDeductionModal";

const TurfDetails = () => {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, turfs } = useTurfData();
  const { averageRating, reviews } = useReviews(id);
  const { gateInteraction } = useLoginOnDemand();
  const turf = turfs.find((t) => t._id === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const galleryRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get("/api/admin/settings/payout");
        setSettings(response.data.payoutSettings);
      } catch (err) {
        console.error("Failed to fetch payout settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const {
    selectedDate,
    selectedStartTime,
    duration,
    availableTimes,
    timeSlots,
    handleDateChange,
    handleTimeSelection,
    handleDurationChange,
    isTimeSlotBooked,
    isDurationAvailable,
    confirmReservation,
    pricePerHour,
    totalPrice,
    loading: bookingLoading,
  } = useReservation();

  const handleBookingClick = () => {
    gateInteraction(() => {
      navigate(`/checkout/${turf._id}`, {
        state: {
          turfName: turf.name,
          selectedDate: selectedDate.toISOString(),
          startTime: selectedStartTime,
          duration,
          amount: totalPrice,
          location: turf.location
        }
      });
    }, {
      title: "Confirm Your Slot",
      message: "Ready to dominate the pitch? Sign in to securely book your time slot and get instant confirmation."
    });
  };

  const handleConfirmCoinPayment = async (couponCode = null, paymentData = {}) => {
    try {
      const result = await confirmReservation(couponCode, paymentData);
      if (result?.success) {
        setIsPaymentSuccessful(true);
        return { success: true, bookingId: result.bookingId };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  const handleModalClose = () => {
    setIsCoinModalOpen(false);
    if (isPaymentSuccessful) {
      navigate("/booking-history");
    }
  };

  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeID(turf?.youtubeUrl);
  const mediaItems = React.useMemo(() => [
    ...(videoId ? [{ type: "video", id: videoId }] : []),
    ...(turf?.images && turf.images.length > 0 
      ? turf.images.map(img => ({ type: "image", url: img }))
      : [{ type: "image", url: turf?.image || "/banner-1.png" }])
  ], [turf, videoId]);

  // Auto-scroll logic - must be called before conditional returns
  React.useEffect(() => {
    if (!turf || loading) return;
    
    let interval;
    const mediaLength = mediaItems.length;
    if (isAutoPlaying && mediaLength > 1) {
      interval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % mediaLength;
        setActiveIndex(nextIndex);
        if (galleryRef.current) {
          const scrollAmount = galleryRef.current.offsetWidth * nextIndex;
          galleryRef.current.scrollTo({
            left: scrollAmount,
            behavior: "smooth"
          });
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeIndex, mediaItems.length, turf, loading]);

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
      if (err.name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    }
  };

  const toggleFavorite = () => {
    if (!isLoggedIn) {
      toast.error("Please login to save favorites");
      navigate("/login");
      return;
    }
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (newFavoriteState) {
      toast.success(`${turf?.name} added to favorites`, {
        icon: '❤️',
        style: {
          borderRadius: '1rem',
          background: '#18181b',
          color: '#fff',
          border: '1px solid #27272a'
        },
      });
    } else {
      toast.success("Removed from favorites");
    }
  };

  if (loading) {
    return <TurfDetailsSkeleton />;
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-md w-full animate-fade-in">
          <Info className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Turf Not Found</h2>
          <p className="text-zinc-400 mb-6">The venue you're looking for might have been moved or removed.</p>
          <Link 
            to="/turfs" 
            className="inline-flex items-center gap-2 bg-[#CCFF00] text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Discovery
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

  return (
    <div className="min-h-screen bg-black text-white pt-4 pb-20">
      {/* Removed Modal - Using Dedicated Checkout Page */}
      {/* Top Navigation Bar */}
      <div className="container mx-auto px-4 mb-4">
        <Link 
          to="/turfs" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#CCFF00] transition-colors mb-4 group uppercase text-xs tracking-normal font-bold"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Search
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold uppercase leading-tight animate-slide-in-left">
              {turf.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold uppercase animate-fade-in">
              <div className="flex items-center gap-2 text-[#CCFF00]">
                <Star className="w-5 h-5 fill-[#CCFF00]" />
                <span>{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
                <span className="text-zinc-500">({reviews?.length || 0} Verified Reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-5 h-5 text-[#CCFF00]" />
                <span>{turf.location}{turf.city ? `, ${turf.city}` : ""}</span>
              </div>
              {turf.openTime && turf.closeTime && (
                <div className="flex items-center gap-2 text-zinc-300 border-l border-zinc-800 pl-6 ml-0 hidden sm:flex">
                  <Clock className="w-5 h-5 text-[#CCFF00]" />
                  <span>{turf.openTime} — {turf.closeTime}</span>
                </div>
              )}
              <div className="flex items-center gap-2 md:border-l border-zinc-800 md:pl-6">
                <Info className="w-5 h-5 text-[#CCFF00]" />
                <button 
                  onClick={() => setIsPolicyModalOpen(true)}
                  className="text-zinc-300 hover:text-[#CCFF00] transition-colors"
                >
                  View Policies
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 animate-fade-in">
            <button 
              onClick={toggleFavorite}
              className={`p-4 rounded-full border transition-all duration-300 active:scale-90 ${
                isFavorite 
                ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-lg shadow-[#CCFF00]/20" 
                : "bg-zinc-900/50 border-zinc-800 text-white hover:border-[#CCFF00] hover:bg-zinc-900"
              }`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button 
              onClick={handleShare}
              className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-white hover:border-[#CCFF00] hover:bg-zinc-900 transition-all duration-300 active:scale-90"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Content Section: Media + Booking Row */}
      <div className="container mx-auto px-4 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Unified Media Gallery (Video first, then Images) */}
          <div className="md:col-span-7 lg:col-span-8 relative rounded-[2.5rem] overflow-hidden group border border-zinc-800 shadow-2xl bg-zinc-900 min-h-[350px] lg:h-[400px]">
            <div 
              ref={galleryRef}
              className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
              onScroll={(e) => {
                const scrollLeft = e.target.scrollLeft;
                const width = e.target.offsetWidth;
                const newIndex = Math.round(scrollLeft / width);
                if (newIndex !== activeIndex) {
                  setActiveIndex(newIndex);
                }
              }}
            >
              {mediaItems.map((item, index) => (
                <div key={index} className="flex-none w-full h-full snap-center relative">
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-black relative">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${item.id}?autoplay=1&mute=1&loop=1&playlist=${item.id}&controls=0&modestbranding=1&rel=0&showinfo=0`}
                        title="Venue Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      <div className="absolute top-6 left-6 px-4 py-2 bg-[#CCFF00] text-black rounded-xl text-[10px] font-bold uppercase shadow-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                        Live Feed
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={`${turf.name} ${index}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-8 left-8 px-5 py-2.5 bg-black/40 backdrop-blur-xl rounded-2xl text-[10px] font-bold uppercase border border-white/10 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                    Media {index + 1} / {mediaItems.length}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="absolute top-8 right-8 flex gap-2">
              <div className="px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full text-[10px] font-bold uppercase border border-white/10 text-zinc-400">
                Strategic View
              </div>
            </div>
          </div>

          {/* Booking Card - Moved to Hero Row */}
          <div className="md:col-span-5 lg:col-span-4 h-full">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl h-full flex flex-col justify-between overflow-hidden">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-zinc-500">Professional Booking Portal</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#CCFF00]">₹{turf.pricePerHour}</span>
                    <span className="text-zinc-500 font-bold text-xs">/hr</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-zinc-500">Facility Timeline</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      return (
                        <button
                          key={dateStr}
                          onClick={() => handleDateChange(date)}
                          className={`flex-none w-12 h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            selectedDate.toISOString().split('T')[0] === dateStr 
                            ? "bg-[#CCFF00] border-[#CCFF00] text-black" 
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-[8px] font-bold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-sm font-black">{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-normal text-zinc-500">Available Slots</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-custom">
                    {availableTimes.length > 0 ? (
                      availableTimes.map((slot, idx) => {
                        const time = slot.startTime;
                        const price = slot.price;
                        const isBooked = isTimeSlotBooked(time);
                        const isSelected = selectedStartTime === time;
                        const isAvailable = !isBooked;

                        return (
                          <button
                            key={idx}
                            disabled={!isAvailable}
                            onClick={() => handleTimeSelection(time)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                              isSelected
                              ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_5px_15px_rgba(204,255,0,0.3)]"
                              : isAvailable
                              ? "bg-zinc-900/50 border-zinc-800 text-white hover:border-[#CCFF00]/50"
                              : "bg-zinc-900/20 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-50"
                            }`}
                          >
                            <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? "text-black" : "text-zinc-400"}`}>{time}</span>
                            <span className={`text-[9px] font-bold ${isSelected ? "text-black/70" : "text-[#CCFF00]"}`}>₹{price}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-2 py-4 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <Clock className="w-5 h-5 text-zinc-700 mx-auto mb-1" />
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">No Slots Generated</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 py-2">
                  <Benefit text="Flexible Cancellation" />
                  <Benefit text="Verified Facilities" />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {selectedStartTime && (
                  <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Total Payable</span>
                      <span className="text-xl font-black text-[#CCFF00]">₹{totalPrice}</span>
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleBookingClick}
                  disabled={bookingLoading || !selectedStartTime}
                  className="w-full bg-[#CCFF00] text-black h-16 rounded-2xl font-bold uppercase tracking-normal flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-[#CCFF00]/20"
                >
                  {bookingLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {selectedStartTime ? `Pay ₹${totalPrice} & Reserve` : "Select a Slot"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-normal text-zinc-600">
                  <ShieldCheck className="w-4 h-4" />
                  Secure Checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Details Section */}
      <div className="container mx-auto px-4 pt-2 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Details (Now optimized for density) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-4">
                {/* Consolidated Intel Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#CCFF00] rounded-full" />
                    <h2 className="text-xl font-bold uppercase">Venue Intelligence</h2>
                  </div>
                  {turf.description && (
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
                      {turf.description}
                    </p>
                  )}
                  
                  {/* Performance Specs */}
                  <div className="flex flex-wrap gap-2">
                    {turf.sportTypes?.map((sport, i) => (
                      <span key={i} className="px-2.5 py-1 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase text-[#CCFF00] tracking-wider">{sport}</span>
                    ))}
                    {turf.groundTypes?.map((ground, i) => (
                      <span key={i} className="px-2.5 py-1 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase text-zinc-500 tracking-wider">{ground}</span>
                    ))}
                  </div>
                </div>


              </div>

              {/* High-Density Amenities */}
              {turf.facilities && turf.facilities.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#CCFF00] rounded-full" />
                    <h2 className="text-xl font-bold uppercase tracking-tight">Amenities</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {turf.facilities.map((facility, index) => (
                      <AmenityItem 
                        key={index}
                        icon={facility.toLowerCase().includes('parking') ? <Car /> : 
                              facility.toLowerCase().includes('water') ? <Coffee /> :
                              facility.toLowerCase().includes('washroom') ? <Users /> :
                              facility.toLowerCase().includes('lighting') ? <Zap /> :
                              <ShieldCheck />} 
                        text={facility} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Optional info or policies) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-4">
               {turf.location && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold uppercase tracking-tight">How to Reach</h2>
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-[1.5rem] p-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[#CCFF00]/10 text-[#CCFF00]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-zinc-200 text-sm font-bold mb-0.5">
                          {turf.location}{turf.city ? `, ${turf.city}` : ""}{turf.state ? `, ${turf.state}` : ""}
                        </p>
                        <a
                          href={turf.mapUrl || (turf.locationData?.coordinates
                            ? `https://www.google.com/maps?q=${turf.locationData.coordinates[1]},${turf.locationData.coordinates[0]}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${turf.location} ${turf.city || ""} ${turf.state || ""}`)}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#CCFF00] text-[10px] font-black uppercase tracking-wider hover:underline flex items-center gap-2"
                        >
                          <Navigation size={12} /> Launch Navigation
                        </a>
                      </div>
                    </div>
                    <VenueMap turf={turf} />
                  </div>
                </div>
              )}

              {/* Ground Contacts */}
              {((turf.managerContacts && turf.managerContacts.length > 0) || turf.owner) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold uppercase tracking-tight">Ground Contacts</h2>
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-[1.5rem] p-5 space-y-3">
                    {/* Owner Record */}
                    {turf.owner && (
                      <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-[#CCFF00]/40 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#CCFF00]" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#111] border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {turf.owner.profilePicture ? (
                              <img src={turf.owner.profilePicture} alt={turf.owner.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white text-sm font-bold uppercase tracking-tight">{turf.owner.name}</span>
                            <span className="text-zinc-500 text-[10px] font-medium lowercase tracking-normal">{turf.owner.email}</span>
                            <span className="text-[#CCFF00] text-[9px] font-bold uppercase tracking-widest mt-0.5">Venue Owner</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {turf.owner.phone && (
                            <a href={`tel:${turf.owner.phone}`} className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#CCFF00] hover:text-black transition-all shrink-0">
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          <a href={`mailto:${turf.owner.email}`} className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#CCFF00] hover:text-black transition-all shrink-0">
                            <Mail className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Venue Managers */}
                    {turf.managerContacts && turf.managerContacts.map((contact, i) => (
                      <a
                        key={i}
                        href={`tel:${contact.phone}`}
                        className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-[#CCFF00]/40 hover:bg-zinc-900 transition-all group pl-5"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white text-sm font-bold uppercase tracking-tight">{contact.name}</span>
                          <span className="text-zinc-500 text-[10px] font-bold">Venue Manager • {contact.phone}</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center text-[#CCFF00] group-hover:bg-[#CCFF00] group-hover:text-black transition-all shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-12 border-t border-zinc-900">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold uppercase">Athlete Reviews</h2>
            <div className="flex items-center gap-3 text-[#CCFF00] font-bold">
              <Star className="fill-current w-5 h-5" />
              <span className="text-xl">{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
              <span className="text-zinc-500">/ 5.0</span>
            </div>
          </div>
          <Reviews turfId={id} />
        </div>
      </div>
      {/* Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPolicyModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-scale-in">
            <div className="p-8 md:p-12 space-y-8">
              <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-[#CCFF00] rounded-full" />
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Venue Policies</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[3px] mt-1">Rules & Regulations</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="p-3 rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </header>

              <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-6">
                  {turf.policies ? (
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {turf.policies}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[11px]">
                        Standard facility rules apply at this venue.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex justify-end">
                <button 
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="bg-[#CCFF00] text-black px-10 py-4 rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:scale-105 transition-transform"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VenueMap = ({ turf }) => {
  const hasCoords =
    turf?.locationData?.coordinates?.length === 2 &&
    turf.locationData.coordinates[0] !== 0;

  const lat = hasCoords ? turf.locationData.coordinates[1] : null;
  const lng = hasCoords ? turf.locationData.coordinates[0] : null;

  // Build the embed URL
  const addressQuery = encodeURIComponent(
    [turf.location, turf.city, turf.state].filter(Boolean).join(", ")
  );

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-700/50" style={{ height: 220 }}>
      <iframe
        title="Venue Location"
        src={embedSrc}
        width="100%"
        height="100%"
        style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) saturate(0.8) brightness(0.85)" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-black/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-[#CCFF00]" />
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider truncate max-w-[160px]">
            {turf.city || turf.location}
          </span>
        </div>
        <a
          href={hasCoords
            ? `https://www.google.com/maps?q=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[#CCFF00] text-[10px] font-black uppercase tracking-wider hover:underline"
        >
          <ExternalLink size={10} />
          Open in Maps
        </a>
      </div>
    </div>
  );
};

const AmenityItem = ({ icon, text }) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-[#CCFF00]/50 transition-colors group">
    <div className="text-[#CCFF00] shrink-0 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { className: "w-4 h-4" })}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 group-hover:text-white transition-colors truncate">{text}</span>
  </div>
);

const Benefit = ({ text }) => (
  <div className="flex items-center gap-3 text-zinc-400">
    <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
    <span className="text-[10px] font-bold uppercase">{text}</span>
  </div>
);

export default TurfDetails;
