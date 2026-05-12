import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Check, X, Clock, User, Phone, Mail, MessageSquare, Loader2, Calendar, Shield, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ProfessionalBookings() {
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
 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
 );

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="pb-6 border-b border-white/5">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Booking <span className="text-primary">Requests</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Manage your upcoming and pending assignments</p>
 </div>

 {bookings.length === 0 ? (
 <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
 <Calendar size={48} className="text-white/10 mb-4" />
 <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">No Requests Found</h3>
 <p className="text-gray-500 text-sm">You don't have any booking requests yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6">
 {bookings.map((booking) => (
 <div key={booking._id} className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/20 transition-all">
 <div className="p-8">
 <div className="flex flex-col md:flex-row justify-between gap-8">
 <div className="flex gap-6">
 <div className="relative">
 <img 
 src={booking.user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80"} 
 className="w-20 h-20 rounded-2xl object-cover border border-white/10"
 />
 <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
 <User size={12} className="text-black" />
 </div>
 </div>
 <div>
 <h3 className="text-2xl font-black text-white uppercase mb-2">{booking.user?.name}</h3>
 <div className="flex flex-wrap gap-4">
 <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Phone size={12} className="text-primary" /> {booking.user?.phone}</span>
 <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Mail size={12} className="text-primary" /> {booking.user?.email}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col md:items-end gap-2">
 <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
 booking.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
 booking.status === 'ACCEPTED' ? 'bg-primary/10 border-primary/20 text-primary' :
 'bg-red-500/10 border-red-500/20 text-red-500'
 }`}>
 {booking.status}
 </div>
 <p className="text-3xl font-display text-white mt-2">₹{booking.totalAmount}</p>
 </div>
 </div>

 <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="space-y-4">
 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Scheduled Session</p>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/10 text-center">
 <span className="text-[8px] font-black text-primary uppercase">{format(new Date(booking.date), 'MMM')}</span>
 <span className="text-xl font-black text-white leading-none">{format(new Date(booking.date), 'dd')}</span>
 </div>
 <div>
 <p className="text-xs font-black text-white">
 {booking.slots.map(s => s.startTime).join(", ")}
 </p>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{booking.bookingType} Session</p>
 </div>
 </div>
 </div>

 <div className="space-y-4 md:col-span-2">
 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">User Message</p>
 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-gray-400 ">
 "{booking.message || "No special instructions provided."}"
 </div>
 </div>
 </div>

 {booking.status === 'PENDING' && (
 <div className="mt-8 flex gap-4">
 <button 
 onClick={() => handleAction(booking._id, 'ACCEPTED')}
 disabled={actionLoading === booking._id}
 className="flex-1 h-14 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2"
 >
 {actionLoading === booking._id ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Accept Request
 </button>
 <button 
 onClick={() => handleAction(booking._id, 'REJECTED')}
 disabled={actionLoading === booking._id}
 className="flex-1 h-14 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"
 >
 {actionLoading === booking._id ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />} Reject
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
