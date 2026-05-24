import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  ChevronLeft, 
  Download, 
  Share2, 
  Navigation, 
  Info,
  ShieldCheck,
  Zap,
  User as UserIcon,
  ExternalLink
} from "lucide-react";
import useBookingPass from "../hooks/useBookingPass";
import { motion } from "framer-motion";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import { TurfCard } from "@features/turf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const BookingPass = () => {
  const { id } = useParams();
  const { booking, loading } = useBookingPass(id);
  const passRef = useRef(null);

  const handleDownload = async () => {
    if (!passRef.current) return;
    try {
      const toastId = toast.loading("Generating pass...");
      const canvas = await html2canvas(passRef.current, { scale: 2, useCORS: true, backgroundColor: "#0A0A0A" });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Booking_Pass_${booking?.turf?.name?.replace(/\s+/g, '_') || 'Kridaz'}.png`;
      link.click();
      toast.success("Pass downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Error generating pass:", error);
      toast.error("Failed to download pass.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kridaz Booking Pass: ${booking?.turf?.name}`,
          text: `Check out my booking at ${booking?.turf?.name} on ${booking?.timeSlot?.date} at ${booking?.timeSlot?.formattedStartTime}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const turfId = booking?.turf?.id || booking?.turf?._id;
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(turfId, { limit: 3 });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Verifying Entry Pass...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[32px] text-center max-w-md w-full">
          <Info className="w-16 h-16 text-zinc-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2 uppercase">Pass Not Found</h2>
          <p className="text-zinc-400 mb-8 text-sm">We couldn't find the booking pass you're looking for. It might have expired or doesn't exist.</p>
          <Link 
            to="/booking-history" 
            className="inline-flex items-center gap-2 bg-[#84CC16] text-black px-8 py-4 rounded-2xl font-bold uppercase text-xs hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { turf, timeSlot, user, totalPrice, qrCode } = booking;

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-20 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-10">
          <Link 
            to="/booking-history" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex gap-3">
            <button onClick={handleDownload} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#84CC16] transition-all">
              <Download size={18} />
            </button>
            <button onClick={handleShare} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#84CC16] transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* The Digital Pass */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Background Glow */}
          <div className="absolute -inset-4 bg-[#84CC16]/10 blur-3xl rounded-[40px] pointer-events-none" />

          {/* Pass Body */}
          <div ref={passRef} className="relative bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
            {/* Top Section: Venue Image & Basic Info */}
            <div className="relative h-48 sm:h-56">
              <img 
                src={turf.images?.[0] || turf.image || "/banner-1.png"} 
                className="w-full h-full object-cover" 
                alt={turf.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
              <div className="absolute bottom-6 left-8 right-8">
                <div className="flex items-center gap-2 text-[#84CC16] font-bold text-[10px] uppercase tracking-widest mb-2">
                  <ShieldCheck size={14} />
                  <span>Verified Entry Pass</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                  {turf.name}
                </h1>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-8 space-y-8">
              {/* Primary Info Row */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Scheduled For</p>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Calendar size={16} className="text-[#84CC16]" />
                    <span className="text-sm">{timeSlot.date}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Window</p>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Clock size={16} className="text-[#84CC16]" />
                    <span className="text-sm">{timeSlot.formattedStartTime} - {timeSlot.formattedEndTime}</span>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Venue Location</p>
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="p-2 bg-[#84CC16]/10 text-[#84CC16] rounded-xl shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-1 leading-tight">{turf.location}</p>
                    <a 
                      href={turf.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(turf.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#84CC16] text-[10px] font-black uppercase tracking-wider hover:underline"
                    >
                      <Navigation size={10} />
                      Start Navigation
                    </a>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Section */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Total Value</p>
                    <p className="text-sm font-black text-white">₹{totalPrice}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Status</p>
                    <p className={`text-[10px] font-black uppercase ${booking.paymentType === "PARTIAL" ? "text-orange-400" : "text-[#84CC16]"}`}>
                        {booking.paymentType === "PARTIAL" ? "Partial Paid" : "Fully Paid"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#84CC16] uppercase tracking-tighter">
                      <ShieldCheck size={10} />
                      <span>Advance Paid</span>
                    </div>
                    <p className="text-lg font-black text-white leading-none">₹{booking.advanceAmount || totalPrice}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-orange-400 uppercase tracking-tighter">
                      <Clock size={10} />
                      <span>Balance at Venue</span>
                    </div>
                    <p className="text-lg font-black text-white leading-none">₹{booking.balanceAmount || 0}</p>
                  </div>
                </div>

                {booking.paymentType === "PARTIAL" && (
                    <div className="flex items-center gap-2 p-2 bg-orange-400/10 rounded-xl">
                        <Info size={12} className="text-orange-400" />
                        <p className="text-[8px] font-bold text-orange-400 uppercase leading-none">Please pay balance at venue before playing</p>
                    </div>
                )}
              </div>

              {/* Contacts Section */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">On-Ground Support</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {turf.managerContacts && turf.managerContacts.length > 0 ? (
                    turf.managerContacts.map((manager, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-[#84CC16]/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[#84CC16]">
                            <UserIcon size={14} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">{manager.name || "Venue Manager"}</p>
                            <p className="text-xs font-bold text-white">{manager.phone}</p>
                          </div>
                        </div>
                        <a href={`tel:${manager.phone}`} className="p-2 bg-[#84CC16] text-black rounded-lg hover:scale-110 transition-transform">
                          <Phone size={14} fill="currentColor" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-center border border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase">Manager contacts not provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Support */}
              <div className="space-y-3 pt-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Correspondence</p>
                 <div className="flex flex-col gap-2">
                    {turf.owner?.email && (
                      <div className="flex items-center gap-3 text-xs">
                        <Mail size={14} className="text-[#84CC16]" />
                        <span className="text-zinc-400 font-bold uppercase text-[10px]">Venue:</span>
                        <span className="text-white font-medium">{turf.owner.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                        <Mail size={14} className="text-[#84CC16]" />
                        <span className="text-zinc-400 font-bold uppercase text-[10px]">Support:</span>
                        <span className="text-white font-medium">contact@kridaz.com</span>
                    </div>
                 </div>
              </div>

              {/* QR Code Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <div className="w-2 h-2 rounded-full bg-[#84CC16]/20" />
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Entry Verification */}
              <div className="flex flex-col items-center gap-6 pb-4">
                <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] group overflow-hidden">
                  <motion.div 
                    animate={{ x: [-100, 200] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent skew-x-12"
                  />
                  <img src={qrCode} alt="Entry QR" className="w-40 h-40 relative z-10" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Scan at Entrance</p>
                  <p className="text-[8px] font-bold text-zinc-600 uppercase">Valid for 1 Match Entry</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Accent */}
            <div className="p-6 bg-[#84CC16] text-black flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Zap size={16} fill="currentColor" />
                    <span className="text-xs font-black uppercase italic tracking-tighter">Powered by Kridaz</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-80">
                    <span>Payment: {booking.paymentMethod}</span>
                    {booking.cashback > 0 && (
                        <>
                            <span className="w-1 h-1 bg-black rounded-full" />
                            <span>₹{booking.cashback} Cashback</span>
                        </>
                    )}
                  </div>
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase">
                    {booking.paymentType === "PARTIAL" ? "Booking Value:" : "Total Paid:"}
                  </span>
                  <span className="text-lg font-black italic">₹{totalPrice}</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
           <button onClick={handleDownload} className="w-full bg-zinc-900 border border-zinc-800 text-white h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
              <Download size={14} />
              Save Pass Image
           </button>
           <button 
             onClick={() => window.print()}
             className="w-full bg-white/5 border border-white/10 text-white h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
           >
              <ExternalLink size={14} />
              Print Pass
           </button>
        </div>

        {/* Recommendation Section: Keep Playing Next Week */}
        {(similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
          <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-[#84CC16] tracking-[0.25em] flex items-center gap-2">
                <Zap size={14} className="fill-current animate-pulse" /> Keep Playing Next Week
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Exclusively recommended sports hubs near {turf?.name || "this venue"}
              </p>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-[280px] rounded-3xl bg-zinc-900/40 border border-white/5 animate-pulse relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[50%]" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-[80%]" />
                      <div className="h-3 bg-white/5 rounded w-[50%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarTurfs.map((t) => (
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
      </div>
    </div>
  );
};

export default BookingPass;
