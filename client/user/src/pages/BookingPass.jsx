import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Calendar, Clock, MapPin, User, IndianRupee, ChevronLeft, Download,
  ShieldCheck, Share2, Wallet, CreditCard, Zap, Copy, FileText, AlertOctagon,
  QrCode,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import RaiseDisputeModal from "@components/dispute/RaiseDisputeModal";

// G��G�� Design tokens (exact match to OwnerDashboard) G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
const BG      = "#000000";
const CARD_BG = "#000000";
const BORDER  = "#2D2D2D";
const ACCENT  = "#55DEE8";
const MUTED   = "#878C9F";
const MUTED2  = "#999999";

const BookingPass = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/user/booking/${id}`);
        setBooking(data);
      } catch (err) {
        setError("Booking not found or has been cancelled.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCancel = async () => {
    const playTime = new Date(booking.playStartTime);
    const now = new Date();
    const hoursRemaining = (playTime - now) / (1000 * 60 * 60);

    let confirmMsg =
      "Are you sure you want to cancel this booking? No refund will be issued as it's within 72 hours of the slot.";
    if (hoursRemaining >= 72) {
      confirmMsg =
        "Are you sure you want to cancel? Since you are cancelling more than 72 hours before the slot, you will receive a 30% refund in your wallet. The remaining 70% is non-refundable.";
    }

    if (!window.confirm(confirmMsg)) return;

    setIsCancelling(true);
    try {
      const response = await axiosInstance.post(`/api/booking/user/cancel/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Booking cancelled successfully.");
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  // G��G�� Loading state G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div
          className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2"
          style={{ borderColor: ACCENT }}
        />
      </div>
    );
  }

  // G��G�� Error state G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��
  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ backgroundColor: BG }}>
        <p className="text-white font-semibold text-xl uppercase tracking-widest">
          {error || "Something went wrong"}
        </p>
        <Link
          to="/"
          className="px-8 py-3 rounded-[8px] text-[13px] font-normal uppercase tracking-widest transition-all"
          style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  const { turf, timeSlot, user, totalPrice, qrCode, createdAt, paymentMethod, cashback, status } = booking;
  const isSlotOver = new Date() > new Date(booking.playEndTime);
  const hoursUntilSlot = (new Date(booking.playStartTime) - new Date()) / (1000 * 60 * 60);

  const statusMeta = {
    CONFIRMED: { label: "Active Pass",    color: ACCENT,     bg: `${ACCENT}15`,  border: `${ACCENT}30`  },
    CANCELLED: { label: "Cancelled",      color: "#EF4444",  bg: "#EF444415",    border: "#EF444430"    },
    COMPLETED: { label: "Completed",      color: "#10B981",  bg: "#10B98115",    border: "#10B98130"    },
    DISPUTED:  { label: "Under Review",   color: "#F59E0B",  bg: "#F59E0B15",    border: "#F59E0B30"    },
    PLAYING:   { label: "In Progress",    color: "#3B82F6",  bg: "#3B82F615",    border: "#3B82F630"    },
  };
  const sm = statusMeta[status] || statusMeta.CONFIRMED;

  return (
    <div className="min-h-screen pb-24 pt-6" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-lg px-4">

        {/* G��G�� Back Nav G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
        <Link
          to="/booking-history"
          className="inline-flex items-center gap-2 mb-8 text-[12px] font-normal uppercase tracking-[0.2em] transition-all"
          style={{ color: MUTED2 }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = MUTED2}
        >
          <ChevronLeft size={16} />
          Back to Bookings
        </Link>

        {/* G��G�� Pass Card G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
        <div
          className="rounded-[8px] overflow-hidden relative"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          {/* Ambient glow */}
          <div
            className="absolute top-0 right-0 w-40 h-40 blur-[80px] pointer-events-none"
            style={{ backgroundColor: `${ACCENT}08` }}
          />

          {/* G��G�� Header Row G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <div>
              <h3
                className="text-xl font-black italic tracking-tighter"
                style={{ color: ACCENT }}
              >
                KRIDAZ
              </h3>
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mt-0.5" style={{ color: MUTED }}>
                Entry Pass -+ {id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Status pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-[6px]"
              style={{ backgroundColor: sm.bg, border: `1px solid ${sm.border}` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: sm.color,
                  animation: status === "CONFIRMED" ? "pulse 2s infinite" : "none",
                }}
              />
              <span className="text-[10px] font-normal uppercase tracking-widest" style={{ color: sm.color }}>
                {sm.label}
              </span>
            </div>
          </div>

          {/* G��G�� Venue Name G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          <div className="px-6 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
              {turf.name}
            </h1>
            <div className="flex items-center gap-2" style={{ color: MUTED2 }}>
              <MapPin size={13} style={{ color: ACCENT }} />
              <span className="text-[12px]">{turf.location}</span>
            </div>
          </div>

          {/* G��G�� Details Grid G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          <div
            className="grid grid-cols-2 gap-px"
            style={{ backgroundColor: BORDER }}
          >
            {[
              {
                label: "Booking Date",
                icon: Calendar,
                value: format(parseISO(timeSlot.startTime), "d MMM yyyy"),
              },
              {
                label: "Time Slot",
                icon: Clock,
                value: `${format(parseISO(timeSlot.startTime), "hh:mm a")} G�� ${format(parseISO(timeSlot.endTime), "hh:mm a")}`,
              },
              {
                label: "Player",
                icon: User,
                value: user?.name || "Guest",
              },
              {
                label: "Payment",
                icon: paymentMethod === "WALLET" ? Wallet : CreditCard,
                value: paymentMethod || "ONLINE",
              },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="px-6 py-5" style={{ backgroundColor: CARD_BG }}>
                <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>
                  {label}
                </p>
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: ACCENT }} />
                  <span className="text-[13px] font-semibold text-white">{value}</span>
                </div>
              </div>
            ))}

            {/* Total Paid G�� full width */}
            <div className="col-span-2 px-6 py-5" style={{ backgroundColor: CARD_BG }}>
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>
                Total Paid
              </p>
              <div className="flex items-baseline gap-1">
                <IndianRupee size={18} style={{ color: ACCENT }} />
                <span className="text-3xl font-semibold text-white">{totalPrice}</span>
              </div>
              {cashback > 0 && (
                <p className="flex items-center gap-1 mt-1.5 text-[10px] font-normal uppercase tracking-wider" style={{ color: ACCENT }}>
                  <Zap size={10} className="fill-current" />
                  G�{cashback} cashback applied
                </p>
              )}
            </div>
          </div>

          {/* G��G�� Contact & Navigation G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          {(turf.managerContacts?.length > 0 || turf.mapUrl || turf.owner?.email) && (
            <div className="px-6 py-5 space-y-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-normal uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
                Contact &amp; Navigation
              </p>

              {turf.mapUrl && (
                <a
                  href={turf.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-[8px] transition-all group/map"
                  style={{ border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}50`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                >
                  <div
                    className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-[13px] font-semibold">Navigate to Ground</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED2 }}>Open in Google Maps</p>
                  </div>
                  <ChevronLeft size={14} className="rotate-180 transition-transform group-hover/map:translate-x-1" style={{ color: MUTED }} />
                </a>
              )}

              {turf.managerContacts?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>Venue Managers</p>
                  {turf.managerContacts.map((contact, idx) => (
                    <a
                      key={idx}
                      href={`tel:${contact.phone}`}
                      className="flex items-center justify-between px-4 py-3 rounded-[8px] transition-all"
                      style={{ border: `1px solid ${BORDER}` }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}50`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                    >
                      <span className="text-[13px] font-semibold text-white">{contact.name}</span>
                      <span className="text-[12px] font-normal" style={{ color: ACCENT }}>{contact.phone}</span>
                    </a>
                  ))}
                </div>
              )}

              {turf.owner?.email && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>Support</p>
                  <div className="flex items-center justify-between px-4 py-3 rounded-[8px]" style={{ border: `1px solid ${BORDER}` }}>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>Venue</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-white">{turf.owner.email}</span>
                      <button
                        onClick={() => copyToClipboard(turf.owner.email, "Venue email")}
                        className="transition-colors"
                        style={{ color: MUTED }}
                        onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 rounded-[8px]" style={{ border: `1px solid ${BORDER}` }}>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>Platform</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold" style={{ color: ACCENT }}>contact@kridaz.com</span>
                      <button
                        onClick={() => copyToClipboard("contact@kridaz.com", "Support email")}
                        className="transition-colors"
                        style={{ color: MUTED }}
                        onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                        onMouseLeave={e => e.currentTarget.style.color = MUTED}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* G��G�� QR Code G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          <div
            className="flex flex-col items-center gap-4 py-8"
            style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
          >
            <div
              className="p-4 rounded-[8px]"
              style={{ backgroundColor: "#fff", boxShadow: `0 0 40px ${ACCENT}15` }}
            >
              <img src={qrCode} alt="Entry QR" className="w-44 h-44" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold text-white uppercase tracking-[0.2em]">Scan at Entrance</p>
              <p className="text-[10px] mt-1" style={{ color: MUTED2 }}>Show this pass to the venue manager</p>
            </div>
          </div>

          {/* G��G�� Actions G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
          <div className="p-6 space-y-3">

            {/* Primary: View Invoice */}
            <Link
              to={`/booking-invoice/${id}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] text-[13px] font-normal uppercase tracking-widest transition-all"
              style={{ backgroundColor: ACCENT, color: "#000" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <FileText size={16} />
              View Invoice
            </Link>

            {/* Secondary row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
              >
                <Download size={14} />
                Save Pass
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Booking at ${turf.name}`,
                      text: `My booking pass for ${turf.name} on ${format(parseISO(timeSlot.startTime), "d MMM yyyy")}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
              >
                <Share2 size={14} />
                Share
              </button>
            </div>

            {/* 72-hr policy notice */}
            {status === "CONFIRMED" && hoursUntilSlot < 72 && !isSlotOver && (
              <div
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[8px] text-[11px] font-normal uppercase tracking-widest"
                style={{ backgroundColor: "#EF444410", border: "1px solid #EF444430", color: "#EF4444" }}
              >
                <AlertOctagon size={15} />
                Can't cancel within 72hrs of slot time
              </div>
            )}

            {/* Cancel button */}
            {status === "CONFIRMED" && hoursUntilSlot >= 72 && !isSlotOver && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] text-[13px] font-normal uppercase tracking-widest transition-all disabled:opacity-50"
                style={{ backgroundColor: "#EF444410", border: "1px solid #EF444430", color: "#EF4444" }}
                onMouseEnter={e => { if (!isCancelling) e.currentTarget.style.backgroundColor = "#EF444420"; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#EF444410"}
              >
                <AlertOctagon size={16} />
                {isCancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}

            {/* Raise dispute */}
            {status !== "CANCELLED" && status !== "DISPUTED" && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] text-[13px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#F59E0B50"; e.currentTarget.style.color = "#F59E0B"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED2; }}
              >
                <AlertOctagon size={16} />
                Raise a Dispute
              </button>
            )}

            {/* Dispute review state */}
            {status === "DISPUTED" && (
              <div
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[8px] text-[13px] font-normal uppercase tracking-widest"
                style={{ backgroundColor: "#F59E0B10", border: "1px solid #F59E0B30", color: "#F59E0B" }}
              >
                <ShieldCheck size={16} />
                Dispute Under Review
              </div>
            )}
          </div>
        </div>

        {/* G��G�� Security Badge G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G��G�� */}
        <div className="mt-6 flex items-center justify-center gap-2" style={{ color: MUTED }}>
          <ShieldCheck size={14} />
          <span className="text-[10px] font-normal uppercase tracking-[0.3em]">Verified Digital Entry Pass</span>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <RaiseDisputeModal
          booking={booking}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default BookingPass;
