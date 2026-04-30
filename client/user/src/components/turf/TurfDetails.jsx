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
  const [isFavorite, setIsFavorite] = useState(false);

  if (loading) {
    return <TurfDetailsSkeleton />;
  }

  const turf = turfs.find((t) => t._id === id);

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[500px]">
          <div className="md:col-span-8 relative rounded-[2rem] overflow-hidden group">
            <img 
              src={turf.image || "/banner-1.png"} 
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-[#84CC16] text-black flex items-center justify-center pl-1 hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-current border-b-[12px] border-b-transparent ml-1" />
              </button>
            </div>
          </div>
          <div className="md:col-span-4 h-full">
            <div className="h-full rounded-[2rem] overflow-hidden border-2 border-[#84CC16] p-1">
              <img 
                src={turf.image || "/banner-1.png"} 
                alt="Turf thumbnail"
                className="w-full h-full object-cover rounded-[1.8rem]"
              />
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
                <AmenityItem icon={<Zap />} text="Floodlights" />
                <AmenityItem icon={<Users />} text="Changing Rooms" />
                <AmenityItem icon={<ShieldCheck />} text="Security" />
                <AmenityItem icon={<Clock />} text="24/7 Access" />
                <AmenityItem icon={<Car />} text="Parking" />
                <AmenityItem icon={<Coffee />} text="Water" />
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
