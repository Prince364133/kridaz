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
const BG     = "#000000";
const CARD   = "#000000";
const BORDER = "#2D2D2D";
const ACCENT = "#CCFF00";
const MUTED  = "#878C9F";
const MUTED2 = "#999999";

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_META = {
  CONFIRMED: { label: "Confirmed",     color: ACCENT,    bg: `${ACCENT}15`,  border: `${ACCENT}30`  },
  CANCELLED: { label: "Cancelled",     color: "#EF4444", bg: "#EF444415",    border: "#EF444430"    },
  COMPLETED: { label: "Completed",     color: "#10B981", bg: "#10B98115",    border: "#10B98130"    },
  DISPUTED:  { label: "Under Review",  color: "#F59E0B", bg: "#F59E0B15",    border: "#F59E0B30"    },
  PLAYING:   { label: "In Progress",   color: "#3B82F6", bg: "#3B82F615",    border: "#3B82F630"    },
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
    <div className="min-h-screen pb-24 pt-2" style={{ backgroundColor: BG }}>
      <div className="max-w-4xl mx-auto px-4 space-y-8 lg:space-y-10">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2" style={{ color: ACCENT }}>
              <Activity size={13} className="animate-pulse" />
              <span className="text-[10px] font-normal uppercase tracking-[0.3em]">Booking Management</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">
              Booking <span style={{ color: ACCENT }}>History</span>
            </h1>
            <p className="text-[12px]" style={{ color: MUTED2 }}>
              View and manage your previous bookings and upcoming games.
            </p>
          </div>

          {/* Stats mini-cards */}
          <div className="flex gap-4 shrink-0">
            <div
              className="px-6 py-4 rounded-[8px] text-center min-w-[120px] transition-all"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}30`}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>
                Total
              </p>
              <p className="text-3xl font-semibold text-white">{bookings.length}</p>
            </div>
            <div
              className="px-6 py-4 rounded-[8px] text-center min-w-[120px] transition-all"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}30`}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>
                Level
              </p>
              <p className="text-3xl font-semibold text-white">PRO</p>
            </div>
          </div>
        </div>

        {/* ── Bookings Feed ───────────────────────────────────────────── */}
        <div className="space-y-6">
          {bookings.length === 0 ? (
            /* Empty state – matches OwnerDashboard EmptyState */
            <div
              className="flex flex-col items-center justify-center gap-4 text-center py-24 rounded-[8px]"
              style={{ border: `1px dashed ${BORDER}` }}
            >
              <Calendar size={36} style={{ color: BORDER }} />
              <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                No Bookings Yet
              </p>
              <p className="text-[11px]" style={{ color: "#444" }}>
                You haven't booked any venues yet. Explore local arenas and start playing!
              </p>
              <Link
                to="/"
                className="mt-2 px-8 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
              >
                Explore Venues
              </Link>
            </div>
          ) : (
            bookings.map((booking) => {
              const sm = STATUS_META[booking.status] || STATUS_META.CONFIRMED;
              const hrs = hoursUntil(booking.playStartTime);
              const slotOver = new Date() > new Date(booking.playEndTime);

              return (
                <div
                  key={booking._id}
                  className="rounded-[8px] overflow-hidden transition-all duration-300 group"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}30`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                >
                  {/* ── Card Header ─────────────────────────────────── */}
                  <div
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                  >
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">
                        {booking.turf.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1" style={{ color: MUTED2 }}>
                        <MapPin size={12} style={{ color: ACCENT }} />
                        <span className="text-[12px]">{booking.turf.location}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] shrink-0 self-start sm:self-auto"
                      style={{ backgroundColor: sm.bg, border: `1px solid ${sm.border}` }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: sm.color,
                          animation: booking.status === "CONFIRMED" ? "pulse 2s infinite" : "none",
                        }}
                      />
                      <span className="text-[10px] font-normal uppercase tracking-widest" style={{ color: sm.color }}>
                        {sm.label}
                      </span>
                    </div>
                  </div>

                  {/* ── Details Row ─────────────────────────────────── */}
                  <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-px"
                    style={{ backgroundColor: BORDER }}
                  >
                    {[
                      { label: "Date",    icon: Calendar,    value: booking.timeSlot.date },
                      { label: "Time",    icon: Clock,       value: `${booking.timeSlot.formattedStartTime} – ${booking.timeSlot.formattedEndTime}` },
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
                        subColor: booking.paymentType === "PARTIAL" ? "#F59E0B" : ACCENT,
                      },
                    ].map(({ label, icon: Icon, value, sub, subColor }) => (
                      <div key={label} className="px-5 py-4" style={{ backgroundColor: CARD }}>
                        <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-1.5" style={{ color: MUTED }}>
                          {label}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} style={{ color: ACCENT }} />
                          <span className="text-[12px] font-semibold text-white truncate">{value}</span>
                        </div>
                        {sub && (
                          <p className="text-[9px] font-normal uppercase tracking-wider mt-1" style={{ color: subColor }}>
                            {sub}
                          </p>
                        )}
                        {booking.cashback > 0 && label === "Payment" && (
                          <div className="flex items-center gap-1 mt-1" style={{ color: ACCENT }}>
                            <Zap size={9} className="fill-current" />
                            <span className="text-[9px] font-normal uppercase tracking-wider">
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
                      <div
                        className="p-2 rounded-[6px] shrink-0"
                        style={{ backgroundColor: "#fff" }}
                      >
                        <img src={booking.qrCode} alt="QR" className="w-12 h-12" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-white">Entry Pass</p>
                        <p className="text-[10px] uppercase tracking-widest transition-colors"
                           style={{ color: MUTED2 }}
                           onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                           onMouseLeave={e => e.currentTarget.style.color = MUTED2}
                        >
                          Tap to open →
                        </p>
                      </div>
                    </Link>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 justify-end">

                      {/* Open Ticket */}
                      <Link
                        to={`/booking-pass/${booking._id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest transition-all"
                        style={{ backgroundColor: ACCENT, color: "#000" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                      >
                        <Ticket size={12} />
                        Open Ticket
                      </Link>

                      {/* Invoice */}
                      <Link
                        to={`/booking-invoice/${booking._id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest transition-all"
                        style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.color = ACCENT; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
                      >
                        <FileText size={12} />
                        Invoice
                      </Link>

                      {/* Write review */}
                      <button
                        onClick={() => openReviewModal(booking.turf._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest transition-all"
                        style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.color = ACCENT; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
                      >
                        <Zap size={12} />
                        Review
                      </button>

                      {/* 72-hr notice */}
                      {booking.status === "CONFIRMED" && hrs < 72 && !slotOver && (
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[10px] font-normal uppercase tracking-widest"
                          style={{ backgroundColor: "#EF444410", border: "1px solid #EF444430", color: "#EF4444" }}
                        >
                          <AlertOctagon size={12} />
                          Can't cancel within 72hrs
                        </div>
                      )}

                      {/* Cancel */}
                      {booking.status === "CONFIRMED" && hrs >= 72 && !slotOver && (
                        <button
                          onClick={() => cancelBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest transition-all"
                          style={{ backgroundColor: "#EF444410", border: "1px solid #EF444430", color: "#EF4444" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#EF444420"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#EF444410"}
                        >
                          <AlertOctagon size={12} />
                          Cancel
                        </button>
                      )}

                      {/* Raise dispute */}
                      {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
                        <button
                          onClick={() => setSelectedDisputeBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[11px] font-normal uppercase tracking-widest transition-all"
                          style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#F59E0B50"; e.currentTarget.style.color = "#F59E0B"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
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
