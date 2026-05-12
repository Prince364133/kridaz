import {
 Clock, MapPin, Calendar, QrCode, ShieldCheck, Zap, Activity, Wallet,
 CreditCard, FileText, Ticket, AlertOctagon, IndianRupee,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import useBookingHistory from "../../hooks/useBookingHistory";
import useWriteReview from "../../hooks/useWriteReview";
import TurfBookingHistorySkeleton from "../../components/ui/TurfBookingHistorySkeleton";
import WriteReview from "../../components/reviews/WriteReview";
import RaiseDisputeModal from "../../components/dispute/RaiseDisputeModal";

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
 (new Date(dateStr) - new Date()) / (1000 * 60 * 60);

const TurfBookingHistory = () => {
 const { loading, bookings, cancelBooking } = useBookingHistory();
 const {
 isReviewModalOpen, rating, review, isSubmitting,
 openReviewModal, closeReviewModal,
 handleRatingChange, handleReviewChange, submitReview,
 } = useWriteReview();

 const [selectedDisputeBooking, setSelectedDisputeBooking] = useState(null);

 const fetchBookingsRefresh = () => window.location.reload();

 if (loading) return <TurfBookingHistorySkeleton />;

 return (
 <div className="bg-[#000000] min-h-screen">
 <div className="max-w-4xl mx-auto p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in relative pb-24">
 {/* Background Glows */}
 <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

 <div className="space-y-8 lg:space-y-10 relative z-10">
 
 {/* Role Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white">
 BOOKING <span className="text-[#CCFF00]">HISTORY</span>
 </h1>
 <p className="text-gray-500 font-medium tracking-wider uppercase text-[10px] mt-2">
 Manage Bookings • View Details • Resolve Issues
 </p>
 </div>
 <div className="hidden lg:flex items-center gap-6">
 <div className="text-right">
 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Bookings</p>
 <p className="text-2xl font-black text-[#CCFF00] ">{bookings.length}</p>
 </div>
 <div className="w-[1px] h-10 bg-[#2D2D2D]" />
 <div className="text-right">
 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Player Level</p>
 <p className="text-2xl font-black text-white ">PRO</p>
 </div>
 </div>
 </div>

 {/* Control Center */}
 <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)]">
 <div className="flex flex-col gap-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <div className="p-1.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[4px] border border-[#CCFF00]/20">
 <ShieldCheck size={16} />
 </div>
 <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
 Booking Center
 </h2>
 </div>
 <p className="text-[10px] font-normal text-[#999999] uppercase tracking-widest">
 Orchestrating Player Reservations
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* ── Bookings Feed ───────────────────────────────────────────── */}
 <div className="space-y-6">
 {bookings.length === 0 ? (
 <div className="bg-[#000000] p-20 rounded-[8px] border border-[#2D2D2D] text-center relative overflow-hidden group min-h-[400px] flex flex-col items-center justify-center">
 <div className="absolute inset-0 bg-[#CCFF00]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[80px]" />
 <div className="relative z-10 space-y-4">
 <div className="w-16 h-16 mx-auto rounded-full bg-[#2D2D2D] flex items-center justify-center text-gray-500 border border-[#404040]">
 <Calendar size={24} />
 </div>
 <div>
 <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
 No Bookings Yet
 </h2>
 <p className="text-[12px] font-normal text-[#999999] uppercase tracking-widest mt-1">
 You haven't booked any venues yet. Explore local arenas!
 </p>
 </div>
 <Link
 to="/"
 className="inline-block mt-4 px-8 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all border border-[#2D2D2D] text-[#999999] hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
 >
 Explore Venues
 </Link>
 </div>
 </div>
 ) : (
 bookings.map((booking) => {
 const sm = STATUS_META[booking.status] || STATUS_META.CONFIRMED;
 const hrs = hoursUntil(booking.playStartTime);
 const slotOver = new Date() > new Date(booking.playEndTime);

 return (
 <div
 key={booking._id}
 className="bg-[#000000] rounded-[8px] border border-[#2D2D2D] overflow-hidden group hover:border-[#CCFF00]/30 transition-colors relative"
 >
 {/* ── Card Header ─────────────────────────────────── */}
 <div className="px-6 py-4 border-b border-[#2D2D2D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-lg font-bold text-white uppercase tracking-tight">
 {booking.turf.name}
 </h2>
 <div className="flex items-center gap-2 mt-1 text-gray-400">
 <MapPin size={12} className="text-[#CCFF00]" />
 <span className="text-[12px]">{booking.turf.location}</span>
 </div>
 </div>

 {/* Status badge */}
 <div
 className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] shrink-0 self-start sm:self-auto border"
 style={{ backgroundColor: sm.bg, borderColor: sm.border }}
 >
 <span
 className="w-1.5 h-1.5 rounded-full shrink-0"
 style={{
 backgroundColor: sm.color,
 animation: booking.status === "CONFIRMED" ? "pulse 2s infinite" : "none",
 }}
 />
 <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sm.color }}>
 {sm.label}
 </span>
 </div>
 </div>

 {/* ── Details Row ─────────────────────────────────── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2D2D2D]">
 {[
 { label: "Date", icon: Calendar, value: booking.timeSlot.date },
 { label: "Time", icon: Clock, value: `${booking.timeSlot.formattedStartTime} – ${booking.timeSlot.formattedEndTime}` },
 {
 label: "Payment",
 icon: booking.paymentMethod === "WALLET" ? Wallet : CreditCard,
 value: booking.paymentMethod,
 },
 {
 label: "Amount",
 icon: IndianRupee,
 value: `₹${booking.advanceAmount || booking.totalPrice}`,
 sub: booking.paymentType === "PARTIAL"
 ? `Balance ₹${booking.balanceAmount}`
 : "Fully Paid",
 subColor: booking.paymentType === "PARTIAL" ? "#F59E0B" : "#CCFF00",
 },
 ].map(({ label, icon: Icon, value, sub, subColor }) => (
 <div key={label} className="px-5 py-4 bg-[#000000]">
 <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1.5 text-gray-500">
 {label}
 </p>
 <div className="flex items-center gap-1.5">
 <Icon size={13} className="text-[#CCFF00]" />
 <span className="text-[12px] font-bold text-white truncate">{value}</span>
 </div>
 {sub && (
 <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: subColor }}>
 {sub}
 </p>
 )}
 {booking.cashback > 0 && label === "Payment" && (
 <div className="flex items-center gap-1 mt-1 text-[#CCFF00]">
 <Zap size={9} className="fill-current" />
 <span className="text-[9px] font-bold uppercase tracking-wider">
 ₹{booking.cashback} cashback
 </span>
 </div>
 )}
 </div>
 ))}
 </div>

 {/* ── QR Thumbnail + Actions ──────────────────────── */}
 <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 {/* QR thumb */}
 <Link
 to={`/booking-pass/${booking._id}`}
 className="flex items-center gap-3 group/qr"
 >
 <div className="p-2 rounded-[6px] shrink-0 bg-white">
 <img src={booking.qrCode} alt="QR" className="w-12 h-12" />
 </div>
 <div>
 <p className="text-[11px] font-bold text-white uppercase tracking-wider">Entry Pass</p>
 <p className="text-[10px] font-bold uppercase tracking-widest transition-colors text-gray-500 group-hover/qr:text-[#CCFF00]">
 Tap to open →
 </p>
 </div>
 </Link>

 {/* Action buttons */}
 <div className="flex flex-wrap gap-2 justify-end">

 {/* Open Ticket */}
 <Link
 to={`/booking-pass/${booking._id}`}
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all bg-[#CCFF00] text-black hover:opacity-90"
 >
 <Ticket size={12} />
 Open Ticket
 </Link>

 {/* Invoice */}
 <Link
 to={`/booking-invoice/${booking._id}`}
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all border border-[#2D2D2D] text-[#999999] hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
 >
 <FileText size={12} />
 Invoice
 </Link>

 {/* Write review */}
 <button
 onClick={() => openReviewModal(booking.turf._id)}
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all border border-[#2D2D2D] text-[#999999] hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
 >
 <Zap size={12} />
 Review
 </button>

 {/* 72-hr notice */}
 {booking.status === "CONFIRMED" && hrs < 72 && !slotOver && (
 <div
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[10px] font-bold uppercase tracking-widest bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]"
 >
 <AlertOctagon size={12} />
 Can't cancel within 72hrs
 </div>
 )}

 {/* Cancel */}
 {booking.status === "CONFIRMED" && hrs >= 72 && !slotOver && (
 <button
 onClick={() => cancelBooking(booking)}
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20"
 >
 <AlertOctagon size={12} />
 Cancel
 </button>
 )}

 {/* Raise dispute */}
 {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
 <button
 onClick={() => setSelectedDisputeBooking(booking)}
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all border border-[#2D2D2D] text-[#999999] hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
 >
 <AlertOctagon size={12} />
 Dispute
 </button>
 )}

 {/* Dispute review state */}
 {booking.status === "DISPUTED" && (
 <div
 className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest"
 style={{ backgroundColor: "#F59E0B10", border: "1px solid #F59E0B30", color: "#F59E0B" }}
 >
 <ShieldCheck size={12} />
 Under Review
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>

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
 );
};

export default TurfBookingHistory;
