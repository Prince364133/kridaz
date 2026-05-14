import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Check, X, Clock, User, Phone, Mail, MessageSquare, Loader2, Calendar, Shield, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CoachBookings() {
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
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error("Error handling booking:", error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  );

  return (
    <div className="space-y-8 animate-fade-in font-open-sans">
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
          Booking <span className="text-[#CCFF00]">Requests</span>
        </h1>
        <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Manage your upcoming and pending assignments</p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center shadow-[var(--shadow-2)]">
          <Calendar size={48} className="text-[#2D2D2D] mb-4" />
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter">No Requests Found</h3>
          <p className="text-[11px] text-[#444] font-inter">You don't have any booking requests yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden group hover:border-[#CCFF00]/30 transition-all shadow-[var(--shadow-2)]">
              <div className="p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  {/* User Info */}
                  <div className="flex gap-6">
                    <div className="relative">
                      <img 
                        src={booking.user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80"} 
                        className="w-20 h-20 rounded-[6px] object-cover border border-[#2D2D2D]"
                      />
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#CCFF00] rounded-[4px] flex items-center justify-center border border-[#CCFF00]/20">
                        <User size={12} className="text-black" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-inter mb-2 tracking-tight">{booking.user?.name}</h3>
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#878C9F] tracking-wider uppercase font-inter"><Phone size={12} className="text-[#CCFF00]" /> {booking.user?.phone}</span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#878C9F] tracking-wider uppercase font-inter"><Mail size={12} className="text-[#CCFF00]" /> {booking.user?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="flex flex-col md:items-end gap-2">
                    <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border font-inter ${
                      booking.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                      booking.status === 'ACCEPTED' ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]' :
                      'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {booking.status}
                    </div>
                    <p className="text-2xl font-bold text-white mt-2 font-inter tracking-tight">₹{booking.totalAmount}</p>
                    <p className="text-[10px] font-medium text-[#878C9F] uppercase tracking-wider font-inter">Reserved in wallet</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[#2D2D2D] grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-medium text-[#878C9F] uppercase tracking-wider font-inter">Scheduled Session</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[6px] bg-[#2D2D2D]/30 flex flex-col items-center justify-center border border-[#2D2D2D] text-center">
                        <span className="text-[9px] font-bold text-[#CCFF00] uppercase font-inter">{format(new Date(booking.date), 'MMM')}</span>
                        <span className="text-xl font-bold text-white leading-none font-inter">{format(new Date(booking.date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-inter">
                          {booking.slots.map(s => s.startTime).join(", ")}
                        </p>
                        <p className="text-[11px] font-medium text-[#999999] uppercase tracking-wider font-inter">{booking.bookingType} Session</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <p className="text-[10px] font-medium text-[#878C9F] uppercase tracking-wider font-inter">User Message</p>
                    <div className="p-4 bg-[#2D2D2D]/30 border border-[#2D2D2D] rounded-[6px] text-[13px] text-[#999999] italic font-open-sans">
                      "{booking.message || "No special instructions provided."}"
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'PENDING' && (
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => handleAction(booking._id, 'ACCEPTED')}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-12 bg-[#CCFF00] text-black rounded-[6px] font-bold uppercase text-[11px] tracking-widest hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2 font-inter shadow-[var(--shadow-2)]"
                    >
                      {actionLoading === booking._id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Accept Request
                    </button>
                    <button 
                      onClick={() => handleAction(booking._id, 'REJECTED')}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-12 bg-transparent text-white border border-[#2D2D2D] rounded-[6px] font-bold uppercase text-[11px] tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 font-inter"
                    >
                      {actionLoading === booking._id ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />} Reject
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
