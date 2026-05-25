import {
 Clock, MapPin, Calendar, QrCode, ShieldCheck, Zap, Activity, Wallet,
 CreditCard, FileText, Ticket, AlertOctagon, IndianRupee, Loader2, User,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "@hooks/useWriteReview";
import TurfBookingHistorySkeleton from "@components/ui/TurfBookingHistorySkeleton";
import WriteReview from "@components/reviews/WriteReview";
import RaiseDisputeModal from "@components/dispute/RaiseDisputeModal";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import useRecommendations from "@hooks/useRecommendations";
import { TurfCard } from "@features/turf";
import axiosInstance from "@hooks/useAxiosInstance";
import { useGetMyJoinedGamesQuery } from "@redux/api/gamesApi";

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

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("subTab") || "venues";
  const validTabs = ["venues", "games", "professionals"];
  const subTabParam = validTabs.includes(rawTab) ? rawTab : "venues";
  const [bookingSubTab, setBookingSubTabState] = useState(subTabParam);

  const setBookingSubTab = (subTabName) => {
    setBookingSubTabState(subTabName);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("subTab", subTabName);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (subTabParam && subTabParam !== bookingSubTab) {
      setBookingSubTabState(subTabParam);
    }
  }, [subTabParam]);

  // Load Joined Games
  const { data: joinedGamesData, isLoading: loadingJoinedGames } = useGetMyJoinedGamesQuery();
  const joinedGames = joinedGamesData?.games || [];

  // Load Hired Professionals Bookings
  const [professionalBookings, setProfessionalBookings] = useState([]);
  const [loadingProBookings, setLoadingProBookings] = useState(false);

  useEffect(() => {
    const fetchProBookings = async () => {
      setLoadingProBookings(true);
      try {
        const res = await axiosInstance.get("/api/professional/user-bookings");
        if (res.data.success) {
          setProfessionalBookings(res.data.bookings || []);
        }
      } catch (error) {
        console.error("Failed to load professional bookings:", error);
      } finally {
        setLoadingProBookings(false);
      }
    };
    fetchProBookings();
  }, []);

  // Proximity recommendations near user's latest booked turf
  const latestTurfId = bookings?.[0]?.turf?.id || bookings?.[0]?.turf?._id;
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(latestTurfId, { limit: 4 });

  // General proximity recommendations for empty booking states
  const { recommendations, loading: recsLoading } = useRecommendations({ limit: 4 });

  const fetchBookingsRefresh = () => window.location.reload();

  if (loading) return <TurfBookingHistorySkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header and Sub-Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#CCFF00]" />
              Booking & Game History
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Manage your turf reservations, joined matches, and hired professionals</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setBookingSubTab('venues')}
              className={`px-4 py-2.5 rounded-[6px] font-black uppercase tracking-wider text-[10px] border transition-all ${ bookingSubTab === 'venues' ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_4px_12px_rgba(204,255,0,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10' }`}
            >
              Venue Bookings
            </button>
            <button 
              onClick={() => setBookingSubTab('games')}
              className={`px-4 py-2.5 rounded-[6px] font-black uppercase tracking-wider text-[10px] border transition-all ${ bookingSubTab === 'games' ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_4px_12px_rgba(204,255,0,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10' }`}
            >
              Joined Games
            </button>
            <button 
              onClick={() => setBookingSubTab('professionals')}
              className={`px-4 py-2.5 rounded-[6px] font-black uppercase tracking-wider text-[10px] border transition-all ${ bookingSubTab === 'professionals' ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_4px_12px_rgba(204,255,0,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10' }`}
            >
              Hired Professionals
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {bookingSubTab === 'venues' && (
            <div>
              {/* ── Bookings Feed ───────────────────────────────────────────── */}
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="bg-[#111111] p-20 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#222] flex items-center justify-center text-gray-500 mb-4">
                      <Calendar size={24} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">No Bookings Yet</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Explore local arenas and book your first game!</p>
                    <Link to="/" className="mt-6 px-6 py-3 rounded-[6px] bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#b3ff00] transition-colors">
                      Explore Venues
                    </Link>
                  </div>
                ) : (
                  bookings.map((booking) => {
                    const sm = STATUS_META[booking.status] || STATUS_META.CONFIRMED;
                    const hrs = hoursUntil(booking.playStartTime);
                    const slotOver = new Date() > new Date(booking.playEndTime);

                    return (
                      <div key={booking.id || booking._id} className="bg-[#111111] border border-white/5 rounded-[8px] p-4 flex flex-col md:flex-row gap-6 hover:border-[#CCFF00]/30 transition-colors group relative overflow-hidden">
                        
                        {/* Left Image */}
                        <div className="w-full md:w-64 h-40 shrink-0 rounded-[8px] overflow-hidden bg-[#222]">
                          <img src={booking.turf?.images?.[0] || 'https://images.unsplash.com/photo-1518605368461-1ee7111d4e7a?auto=format&fit=crop&q=80'} className="w-full h-full object-cover transition-all duration-500" alt="Turf" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="px-2 py-1 bg-[#CCFF00]/10 text-[#CCFF00] rounded text-[9px] font-black uppercase tracking-widest">{booking.turf?.sportType || 'FOOTBALL'}</span>
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">BOOKING ID: #{(booking.id || booking._id)?.slice(-5).toUpperCase() || 'B7402'}</span>
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">{booking.turf?.name || 'Decathlon Sports Arena'}</h2>
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={12} className="text-gray-500" /> {booking.timeSlot?.formattedStartTime || '18:00'} - {booking.timeSlot?.formattedEndTime || '19:30'}</div>
                              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-500" /> {booking.timeSlot?.date || '12 Oct 2026'}</div>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-gray-500" /> {booking.turf?.city || 'Location'}
                              </div>
                            </div>
                          </div>

                          {/* Actions Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Link to={`/booking-pass/${booking.id || booking._id}`} className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                              <Ticket size={12} /> Pass
                            </Link>
                            <Link to={`/booking-invoice/${booking.id || booking._id}`} className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                              <FileText size={12} /> Invoice
                            </Link>
                            {booking.status === "CONFIRMED" && hrs >= 72 && !slotOver && (
                              <button onClick={() => cancelBooking(booking)} className="px-4 py-2 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                Cancel
                              </button>
                            )}
                            {booking.status !== "CANCELLED" && booking.status !== "DISPUTED" && (
                              <button onClick={() => setSelectedDisputeBooking(booking)} className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:border-yellow-500/50 hover:text-yellow-500 text-gray-400 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                Dispute
                              </button>
                            )}
                            {booking.status === "COMPLETED" && (
                              <button onClick={() => openReviewModal(booking.turf._id)} className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] text-gray-400 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                Review
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right: Price & Status */}
                        <div className="flex flex-col justify-between items-end py-2 shrink-0 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Paid</span>
                            <div className="text-2xl font-black text-white">₹{Number(booking.advanceAmount) || Number(booking.totalPrice) || Number(booking.turf?.pricePerHour) || '1,500'}</div>
                            {booking.paymentType === "PARTIAL" && (
                              <div className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Bal: ₹{Number(booking.balanceAmount) || 0}</div>
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
                          className="h-[280px] rounded-[8px] bg-[#111] border border-white/5 animate-pulse relative overflow-hidden"
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
                          className="h-[280px] rounded-[8px] bg-[#111] border border-white/5 animate-pulse relative overflow-hidden"
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
            </div>
          )}

          {bookingSubTab === 'games' && (
            <div className="space-y-4">
              {loadingJoinedGames ? (
                <div className="text-center py-12 bg-[#0a0a0a] rounded-[8px] border border-white/5">
                  <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Joined Games...</p>
                </div>
              ) : joinedGames.length === 0 ? (
                <div className="bg-[#111111] p-16 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center text-gray-500 mb-4">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">No Joined Games</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">You haven't joined any match lobbies or training games yet.</p>
                </div>
              ) : (
                joinedGames.map((game) => {
                  const statusColors = {
                    JOINED: 'text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20',
                    PENDING: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                    CANCELLED: 'text-red-500 bg-red-500/10 border-red-500/20'
                  };
                  const statusText = game.mySlotStatus || 'JOINED';
                  const statusClass = statusColors[statusText] || 'text-gray-400 bg-white/5 border-white/10';

                  return (
                    <div key={game._id} className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />
                      
                      <div className="relative bg-[#0d0d0d] rounded-[8px] p-4 flex flex-col md:flex-row gap-6 w-full">
                        <div className="w-full md:w-48 h-32 shrink-0 rounded-[8px] overflow-hidden bg-white/5 flex items-center justify-center relative">
                          {game.turf?.images?.[0] ? (
                            <img src={game.turf.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Zap className="w-8 h-8 text-[#CCFF00]" />
                              <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">{game.gameType || 'CRICKET'}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-1.5 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded text-[8px] font-black uppercase tracking-widest border border-[#CCFF00]/20">
                                {game.gameType || 'CRICKET'}
                              </span>
                              {game.format && (
                                <span className="px-1.5 py-0.5 bg-white/5 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/10">
                                  {game.format}
                                </span>
                              )}
                              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                ID: #{game._id?.slice(-5).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                              {game.name || `${game.gameType} Practice Match`}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={12} className="text-[#CCFF00]" /> {game.time}</div>
                              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#CCFF00]" /> {new Date(game.date).toLocaleDateString('en-GB')}</div>
                              <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#CCFF00]" /> {game.turf?.name || game.customVenue || "Local Ground"}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                              Role: <span className="text-white font-black">{game.myRole || 'Player'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end py-1 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Entry Fee</p>
                            <p className="text-xl font-black text-white">
                              {Number(game.perPlayerCharge) > 0 ? `₹${game.perPlayerCharge}` : 'Free'}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-[8px] text-[8px] font-black uppercase tracking-widest border ${statusClass}`}>
                            {statusText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {bookingSubTab === 'professionals' && (
            <div className="space-y-4">
              {loadingProBookings ? (
                <div className="text-center py-12 bg-[#0a0a0a] rounded-[8px] border border-white/5">
                  <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Hired Professionals...</p>
                </div>
              ) : professionalBookings.length === 0 ? (
                <div className="bg-[#111111] p-16 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center text-gray-500 mb-4">
                    <User size={24} />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">No Professionals Hired</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Book certified coaches, umpires, scorers, or commentators to elevate your game!</p>
                </div>
              ) : (
                professionalBookings.map((booking) => {
                  const statusColors = {
                    APPROVED: 'text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20',
                    PENDING: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                    REJECTED: 'text-red-500 bg-red-500/10 border-red-500/20',
                    COMPLETED: 'text-[#55DEE8] bg-[#55DEE8]/10 border-[#55DEE8]/20'
                  };
                  const statusClass = statusColors[booking.status] || 'text-gray-400 bg-white/5 border-white/10';
                  const profName = booking.professional?.user?.name || booking.professional?.businessName || "Professional";
                  const profPic = booking.professional?.user?.profilePicture;

                  let slotsStr = "N/A";
                  try {
                    if (Array.isArray(booking.slots)) {
                      slotsStr = booking.slots.map(s => `${s.startTime} - ${s.endTime}`).join(", ");
                    } else if (typeof booking.slots === 'string') {
                      slotsStr = booking.slots;
                    }
                  } catch (e) {
                    console.error(e);
                  }

                  return (
                    <div key={booking.id} className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />
                      
                      <div className="relative bg-[#0d0d0d] rounded-[8px] p-4 flex flex-col md:flex-row gap-6 w-full">
                        <div className="w-full md:w-32 h-32 shrink-0 rounded-[8px] overflow-hidden bg-white/5 flex items-center justify-center border border-white/5 relative">
                          {profPic ? (
                            <img src={profPic} className="w-full h-full object-cover transition-all duration-500" alt="" />
                          ) : (
                            <User className="w-12 h-12 text-gray-600" />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-1.5 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded text-[8px] font-black uppercase tracking-widest border border-[#55DEE8]/20">
                                {booking.bookingType || 'PROFESSIONAL'}
                              </span>
                              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                ID: #{booking.id?.slice(-5).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                              {profName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={12} className="text-[#CCFF00]" /> {slotsStr}</div>
                              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#CCFF00]" /> {booking.date}</div>
                            </div>
                            {booking.message && (
                              <p className="text-[10px] text-gray-500 italic mt-3 border-l-2 border-white/10 pl-2 leading-relaxed">
                                "{booking.message}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end py-1 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
                            <p className="text-xl font-black text-white">₹{booking.totalAmount}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-[8px] text-[8px] font-black uppercase tracking-widest border ${statusClass}`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
    </div>
 );
};

export default TurfBookingHistory;
