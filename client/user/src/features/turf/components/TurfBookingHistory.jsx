import {
 Clock, MapPin, Calendar, QrCode, ShieldCheck, Zap, Activity, Wallet,
 CreditCard, FileText, Ticket, AlertOctagon, IndianRupee,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "@hooks/useWriteReview";
import TurfBookingHistorySkeleton from "@components/ui/TurfBookingHistorySkeleton";
import WriteReview from "@components/reviews/WriteReview";
import RaiseDisputeModal from "@components/dispute/RaiseDisputeModal";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import useRecommendations from "@hooks/useRecommendations";
import { TurfCard } from "@features/turf";

// ── Design tokens (exact match to OwnerDashboard) ──────────────────────────
const BG = "#000000";
const CARD = "#000000";
const BORDER = "#2D2D2D";
const ACCENT = "#CCFF00";
const MUTED = "#878C9F";
const MUTED2 = "#999999";

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_META = {
 CONFIRMED: { label: "Confirmed", color: ACCENT, bg: `${ACCENT}15`, border: `${ACCENT}30` },
 CANCELLED: { label: "Cancelled", color: "#EF4444", bg: "#EF444415", border: "#EF444430" },
 COMPLETED: { label: "Completed", color: "#10B981", bg: "#10B98115", border: "#10B98130" },
 DISPUTED: { label: "Under Review", color: "#F59E0B", bg: "#F59E0B15", border: "#F59E0B30" },
 PLAYING: { label: "In Progress", color: "#3B82F6", bg: "#3B82F615", border: "#3B82F630" },
};

// ── Helper: hours until slot ───────────────────────────────────────────────
const hoursUntil = (dateStr) =>
  (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60);

const TurfBookingHistory = () => {
 const { loading, bookings, cancelBooking } = useBookingHistory();
 const {
 isReviewModalOpen, rating, review, isSubmitting,
 openReviewModal, closeReviewModal,
 handleRatingChange, handleReviewChange, submitReview,
 } = useWriteReview();

 const [selectedDisputeBooking, setSelectedDisputeBooking] = useState(null);

 // Proximity recommendations near user's latest booked turf
 const latestTurfId = bookings?.[0]?.turf?.id || bookings?.[0]?.turf?._id;
 const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(latestTurfId, { limit: 4 });

 // General proximity recommendations for empty booking states
 const { recommendations, loading: recsLoading } = useRecommendations({ limit: 4 });

 const fetchBookingsRefresh = () => window.location.reload();

 if (loading) return <TurfBookingHistorySkeleton />;

 return (
 <div>
 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 
 

 <div>
 
 {/* ── Bookings Feed ───────────────────────────────────────────── */}
  <div className="space-y-4">
    {bookings.length === 0 ? (
      <div className="bg-[#111111] p-20 rounded-[24px] border border-white/5 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#222] flex items-center justify-center text-gray-500 mb-4">
          <Calendar size={24} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">No Bookings Yet</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Explore local arenas and book your first game!</p>
        <Link to="/" className="mt-6 px-6 py-3 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#b3ff00] transition-colors">
          Explore Venues
        </Link>
      </div>
    ) : (
      bookings.map((booking) => {
        const sm = STATUS_META[booking.status] || STATUS_META.CONFIRMED;
        const hrs = hoursUntil(booking.playStartTime);
        const slotOver = new Date() > new Date(booking.playEndTime);

        return (
          <div key={booking._id} className="bg-[#111111] border border-white/5 rounded-[24px] p-4 flex flex-col md:flex-row gap-6 hover:border-[#CCFF00]/30 transition-colors group relative overflow-hidden">
            
            {/* Left Image */}
            <div className="w-full md:w-64 h-40 shrink-0 rounded-2xl overflow-hidden bg-[#222]">
              <img src={booking.turf?.images?.[0] || 'https://images.unsplash.com/photo-1518605368461-1ee7111d4e7a?auto=format&fit=crop&q=80'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Turf" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-[#CCFF00]/10 text-[#CCFF00] rounded text-[9px] font-black uppercase tracking-widest">{booking.turf?.sportType || 'FOOTBALL'}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">BOOKING ID: #{booking._id?.slice(-5).toUpperCase() || 'B7402'}</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">{booking.turf?.name || 'Decathlon Sports Arena'}</h2>
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Clock size={12} className="text-gray-500" /> {booking.timeSlot?.formattedStartTime || '18:00'} - {booking.timeSlot?.formattedEndTime || '19:30'}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-500" /> {booking.timeSlot?.date || '12 Oct 2026'}</div>
                  <div className="flex items-center gap-1.5">
                    {/* Placeholder for players count if available, using MapPin for location */}
                    <MapPin size={12} className="text-gray-500" /> {booking.turf?.city || 'Location'}
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2 mt-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link to={`/booking-pass/${booking._id}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  <Ticket size={12} /> Pass
                </Link>
                <Link to={`/booking-invoice/${booking._id}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  <FileText size={12} /> Invoice
                </Link>
                {booking.status === "CONFIRMED" && hrs >= 72 && !slotOver && (
                  <button onClick={() => cancelBooking(booking)} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    Cancel
                  </button>
                )}
                {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
                  <button onClick={() => setSelectedDisputeBooking(booking)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-500/50 hover:text-yellow-500 text-gray-400 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    Dispute
                  </button>
                )}
                {booking.status === "COMPLETED" && (
                  <button onClick={() => openReviewModal(booking.turf._id)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] text-gray-400 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    Review
                  </button>
                )}
              </div>
            </div>

            {/* Right: Price & Status */}
            <div className="flex flex-col justify-between items-end py-2 shrink-0 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Paid</span>
                <div className="text-2xl font-black text-white">₹{booking.advanceAmount || booking.totalPrice || '1,500'}</div>
                {booking.paymentType === "PARTIAL" && (
                  <div className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Bal: ₹{booking.balanceAmount}</div>
                )}
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className="px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest" style={{ color: sm.color, backgroundColor: sm.bg, border: `1px solid ${sm.border}` }}>
                  {sm.label}
                </div>
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>

  {/* Case A: Bookings exist -> Render Proximity Recommendations near latest venue */}
  {bookings.length > 0 && (similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
    <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black uppercase text-[#CCFF00] tracking-tight flex items-center gap-2">
          Recommended Arenas Near You
        </h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-inter">
          Handpicked grounds matching your recent game history
        </p>
      </div>

      {similarLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="h-[280px] rounded-[24px] bg-[#111] border border-white/5 animate-pulse relative overflow-hidden"
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
    </div>
  )}

  {/* Case B: Bookings is empty -> Render general trending proximity feeds */}
  {bookings.length === 0 && (recsLoading || (recommendations && recommendations.length > 0)) && (
    <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
      <div className="space-y-1 text-center md:text-left">
        <h3 className="text-lg font-black uppercase text-[#CCFF00] tracking-tight flex items-center gap-2 justify-center md:justify-start">
          Trending Arenas Near You
        </h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-inter">
          Highly frequented grounds & elite hubs active in your city
        </p>
      </div>

      {recsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="h-[280px] rounded-[24px] bg-[#111] border border-white/5 animate-pulse relative overflow-hidden"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {recommendations.map((t) => (
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

  {/* ── Modals ──────────────────────────────────────────────────────── */}
  {isReviewModalOpen && (
    <WriteReview
      rating={rating}
      review={review}
      isSubmitting={isSubmitting}
      onClose={closeReviewModal}
      onRatingChange={handleRatingChange}
      onReviewChange={handleReviewChange}
      onSubmit={submitReview}
    />
  )}

  {selectedDisputeBooking && (
    <RaiseDisputeModal
      booking={selectedDisputeBooking}
      onClose={() => setSelectedDisputeBooking(null)}
      onSuccess={fetchBookingsRefresh}
    />
  )}
  </div>
  </div>
  </div>
 );
};

export default TurfBookingHistory;
