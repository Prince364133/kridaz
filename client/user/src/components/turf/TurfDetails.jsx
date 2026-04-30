import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useTurfData from "../../hooks/useTurfData";
import useReviews from "../../hooks/useReviews";
import Reviews from "../reviews/Reviews";
import TurfDetailsSkeleton from "../ui/TurfDetailsSkeleton";
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
  Info
} from "lucide-react";

const TurfDetails = () => {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, turfs } = useTurfData();
  const { averageRating, reviews } = useReviews(id);
  const turf = turfs.find((t) => t._id === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const galleryRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll logic
  React.useEffect(() => {
    let interval;
    const imagesLength = turf?.images?.length || 0;
    if (isAutoPlaying && imagesLength > 1) {
      interval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % imagesLength;
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
  }, [isAutoPlaying, activeIndex, turf?.images?.length]);

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
            className="inline-flex items-center gap-2 bg-[#84CC16] text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const handleReservation = () => {
    if (isLoggedIn) {
      navigate(`/reserve/${id}`);
    } else {
      navigate(`/login`);
    }
  };

  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeID(turf.youtubeUrl);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <div className="container mx-auto px-4 mb-8">
        <Link 
          to="/turfs" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#84CC16] transition-colors mb-6 group uppercase text-xs tracking-widest font-bold"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Search
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight tracking-tight animate-slide-in-left">
              {turf.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold uppercase tracking-wide animate-fade-in">
              <div className="flex items-center gap-2 text-[#84CC16]">
                <Star className="w-5 h-5 fill-[#84CC16]" />
                <span>{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
                <span className="text-zinc-500">({reviews?.length || 124} Verified Reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-5 h-5 text-[#84CC16]" />
                <span>{turf.location}, Mumbai</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 animate-fade-in">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-4 rounded-full border transition-all duration-300 ${
                isFavorite 
                ? "bg-[#84CC16] border-[#84CC16] text-black" 
                : "bg-zinc-900/50 border-zinc-800 text-white hover:border-[#84CC16]"
              }`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-white hover:border-[#84CC16] transition-all duration-300">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Gallery Section */}
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Image Gallery - Scrollable & Auto-sliding */}
          <div className="md:col-span-8 relative aspect-video rounded-[2.5rem] overflow-hidden group border border-zinc-800 shadow-2xl bg-zinc-900">
            <div 
              ref={galleryRef}
              className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide scroll-smooth"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {(turf.images && turf.images.length > 0 ? turf.images : [turf.image]).map((img, index) => (
                <div key={index} className="flex-none w-full h-full snap-center relative">
                  <img 
                    src={img || "/banner-1.png"} 
                    alt={`${turf.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 px-5 py-2.5 bg-black/40 backdrop-blur-xl rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
                    Archive {index + 1} / {turf.images?.length || 1}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gallery Controls Overlay */}
            <div className="absolute top-8 right-8 flex gap-2">
              <div className="px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-zinc-400">
                16:9 Tactical View
              </div>
            </div>
          </div>

          {/* Video Column */}
          <div className="md:col-span-4 h-full">
            {/* Video Slot - Full Height */}
            <div className="h-full min-h-[300px] rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-black relative group shadow-2xl">
              {videoId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
                  title="Venue Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Stream Available</p>
                </div>
              )}
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#84CC16] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                Live Feed
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#84CC16]">Security Protocol</p>
                <p className="text-white text-xs font-bold uppercase">Real-time surveillance active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Booking Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-16">
            {/* About */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-[#84CC16] rounded-full" />
                <h2 className="text-2xl font-bold uppercase tracking-wider">Facility Overview</h2>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                Experience top-tier sports facilities at {turf.name}. Our professional-grade turf and
                cricket pitches are designed for both casual players and professional athletes. 
                Located in {turf.location}, we offer a seamless booking experience 
                with premium amenities including player lounges, showers, and a cafe area.
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold uppercase tracking-wider">Facility Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {turf.facilities && turf.facilities.length > 0 ? (
                  turf.facilities.map((facility, index) => (
                    <AmenityItem 
                      key={index}
                      icon={facility.toLowerCase().includes('parking') ? <Car /> : 
                            facility.toLowerCase().includes('water') ? <Coffee /> :
                            facility.toLowerCase().includes('washroom') ? <Users /> :
                            facility.toLowerCase().includes('lighting') ? <Zap /> :
                            <ShieldCheck />} 
                      text={facility} 
                    />
                  ))
                ) : (
                  <>
                    <AmenityItem icon={<Zap />} text="Floodlights" />
                    <AmenityItem icon={<Users />} text="Changing Rooms" />
                    <AmenityItem icon={<ShieldCheck />} text="Security" />
                    <AmenityItem icon={<Clock />} text="24/7 Access" />
                    <AmenityItem icon={<Car />} text="Parking" />
                    <AmenityItem icon={<Coffee />} text="Water" />
                  </>
                )}
              </div>
            </div>

            {/* How to Reach */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold uppercase tracking-wider">How to Reach</h2>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#84CC16]/10 text-[#84CC16]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-zinc-200 font-bold mb-1">Plot No. 42, Sector 8, Near Crystal Mall, {turf.location}, Mumbai - 400053</p>
                    <button className="text-[#84CC16] text-sm font-bold uppercase tracking-widest hover:underline">
                      View on Maps
                    </button>
                  </div>
                </div>
                <div className="w-full h-64 bg-zinc-800/50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-zinc-700">
                  <Activity className="w-12 h-12 text-zinc-600 mb-2" />
                  <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Map Loading...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Professional Booking Portal</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">₹{turf.pricePerHour}</span>
                      <span className="text-zinc-500 font-bold">/hr</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-black/40 hover:border-[#84CC16] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#84CC16]" />
                        <span className="font-bold uppercase text-xs tracking-widest">Select Date</span>
                      </div>
                      <span className="text-zinc-500 text-sm font-medium">Today</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-black/40 hover:border-[#84CC16] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#84CC16]" />
                        <span className="font-bold uppercase text-xs tracking-widest">Select Time</span>
                      </div>
                      <span className="text-zinc-500 text-sm font-medium">1h onwards</span>
                    </button>
                  </div>

                  <div className="space-y-4 py-4">
                    <Benefit text="Flexible Cancellation" />
                    <Benefit text="Verified Facilities" />
                    <Benefit text="Digital Pass" />
                  </div>

                  <button 
                    onClick={handleReservation}
                    className="w-full bg-[#84CC16] text-black h-16 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Reserve Now
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    <ShieldCheck className="w-4 h-4" />
                    Enterprise-Grade Secure Checkout
                  </div>
                </div>
              </div>

              <button className="w-full bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/50 transition-colors group">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-[#84CC16]/10 group-hover:text-[#84CC16] transition-colors">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest">Venue Policies</p>
                    <p className="text-zinc-500 text-xs font-medium">Rules & Refunds</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-[#84CC16] transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-20 border-t border-zinc-900">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold uppercase tracking-tight">Customer Reviews</h2>
            <div className="flex items-center gap-4 text-[#84CC16] font-bold">
              <Star className="fill-current" />
              <span className="text-2xl">{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
              <span className="text-zinc-500">/ 5.0</span>
            </div>
          </div>
          <Reviews turfId={id} />
        </div>

      </div>
    </div>
  );
};

const AmenityItem = ({ icon, text }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-[#84CC16]/50 transition-colors group">
    <div className="text-[#84CC16] group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <span className="text-xs font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{text}</span>
  </div>
);

const Benefit = ({ text }) => (
  <div className="flex items-center gap-3 text-zinc-400">
    <CheckCircle2 className="w-4 h-4 text-[#84CC16]" />
    <span className="text-[10px] font-black uppercase tracking-widest">{text}</span>
  </div>
);

export default TurfDetails;
