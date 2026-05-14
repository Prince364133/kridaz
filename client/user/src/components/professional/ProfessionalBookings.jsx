import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Check, X, Clock, User, Phone, Mail, MessageSquare, Loader2, Calendar, Shield, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

/**
 * ProfessionalBookings — Rebranded for the Scorer Portal.
 * Enforces Teal Green (#00C187) and Inter typography.
 */

export default function ProfessionalBookings() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/professional/my-bookings");
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      await axiosInstance.post("/api/professional/handle-request", { bookingId, status });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      fetchBookings();
    } catch (error) {
      console.error("Error handling booking:", error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin" style={{ color: themeColor }} size={40} /></div>
  );

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase">
          Match <span style={{ color: themeColor }}>Requests</span>
        </h1>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">Manage your upcoming assignments and session invites</p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-black rounded-3xl border border-white/5 border-dashed p-12 text-center shadow-2xl">
          <Calendar size={48} className="text-neutral-800 mb-6" />
          <h3 className="text-[13px] font-black text-neutral-600 uppercase tracking-widest font-inter mb-2">No Requests Found</h3>
          <p className="text-[11px] text-neutral-700 font-black uppercase tracking-widest font-inter">Your assignment queue is currently empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-black border border-white/5 rounded-3xl overflow-hidden group hover:bg-white/[0.01] transition-all shadow-2xl">
              <div className="p-8 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex gap-6">
                    <div className="relative">
                      <img 
                        src={booking.user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80"} 
                        className="w-16 h-16 rounded-2xl object-cover border border-white/5"
                        alt={booking.user?.name}
                      />
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: themeColor }}>
                        <User size={14} className="text-black" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight font-inter uppercase mb-1.5">{booking.user?.name}</h3>
                      <div className="flex flex-wrap gap-5">
                        <span className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter"><Phone size={12} style={{ color: themeColor }} /> {booking.user?.phone}</span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter"><Mail size={12} style={{ color: themeColor }} /> {booking.user?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border font-inter ${
                      booking.status === 'PENDING' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                      booking.status === 'ACCEPTED' ? 'bg-[#00C187]/10 border-[#00C187]/20' :
                      'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}
                    style={{ 
                      color: booking.status === 'ACCEPTED' ? themeColor : undefined,
                      borderColor: booking.status === 'ACCEPTED' ? themeColor : undefined 
                    }}>
                      {booking.status === 'ACCEPTED' ? 'SCHEDULED' : booking.status}
                    </div>
                    <p className="text-3xl font-black text-white mt-2 font-inter tracking-tighter">₹{Number(booking.totalAmount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">Match Schedule</p>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex flex-col items-center justify-center border border-white/5 text-center shadow-inner">
                        <span className="text-[9px] font-black uppercase font-inter" style={{ color: themeColor }}>{format(new Date(booking.date), 'MMM')}</span>
                        <span className="text-xl font-black text-white leading-none font-inter mt-0.5">{format(new Date(booking.date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white font-inter tracking-tight uppercase">
                          {booking.slots.map(s => s.startTime).join(", ")}
                        </p>
                        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest font-inter mt-1">{booking.bookingType} Portal</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 md:col-span-2">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">Match Brief</p>
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-[13px] text-neutral-400 italic font-inter leading-relaxed">
                      "{booking.message || "Standard match scoring and management assignment."}"
                    </div>
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => handleAction(booking._id, 'ACCEPTED')}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-14 text-black rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 font-inter shadow-xl"
                      style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
                    >
                      {actionLoading === booking._id ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Confirm Slot
                    </button>
                    <button 
                      onClick={() => handleAction(booking._id, 'REJECTED')}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-14 bg-white/5 text-neutral-500 hover:text-white border border-white/5 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all transform active:scale-95 flex items-center justify-center gap-3 font-inter"
                    >
                      {actionLoading === booking._id ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />} Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
