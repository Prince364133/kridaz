import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../hooks/useAxiosInstance";
import { Calendar, Clock, MapPin, User, IndianRupee, ChevronLeft, Download, ShieldCheck, Share2, Wallet, CreditCard, Zap, Copy, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

const BookingPass = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#84CC16]"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-4">{error || "Something went wrong"}</h1>
        <Link to="/" className="px-6 py-2 bg-[#84CC16] text-black rounded-lg font-bold">
          Go Back Home
        </Link>
      </div>
    );
  }

  const { turf, timeSlot, user, totalPrice, qrCode, createdAt, paymentMethod, cashback } = booking;

  return (
    <div className="min-h-screen bg-[#000] pb-20 pt-6">
      <div className="container mx-auto max-w-lg px-4">
        <Link to="/booking-history" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Back to Bookings</span>
        </Link>

        {/* The Pass Card */}
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          {/* Top Section - Brand/Status */}
          <div className="p-8 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-[#84CC16] font-black text-xl italic tracking-tighter">TURFSPOT</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Entry Pass No: {id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-[#84CC16]/10 border border-[#84CC16]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#84CC16] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-[#84CC16] uppercase">Active Pass</span>
              </div>
            </div>
          </div>

          {/* Turf Info Section */}
          <div className="px-8 py-4">
            <h1 className="text-4xl font-bold text-white uppercase tracking-tight mb-2 leading-none">
              {turf.name}
            </h1>
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin size={14} className="text-[#84CC16]" />
              <span className="text-sm font-medium">{turf.location}</span>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="relative my-4">
            <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-10 bg-black rounded-r-full border-r border-t border-b border-white/10"></div>
            <div className="mx-8 border-t border-dashed border-white/20"></div>
            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-10 bg-black rounded-l-full border-l border-t border-b border-white/10"></div>
          </div>

          {/* Booking Details Grid */}
          <div className="p-8 grid grid-cols-2 gap-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Booking Date</p>
              <div className="flex items-center gap-2 text-white">
                <Calendar size={16} className="text-[#84CC16]" />
                <span className="font-bold">{format(parseISO(timeSlot.startTime), "d MMM yyyy")}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Time Slot</p>
              <div className="flex items-center gap-2 text-white">
                <Clock size={16} className="text-[#84CC16]" />
                <span className="font-bold italic">
                  {format(parseISO(timeSlot.startTime), "hh:mm a")} - {format(parseISO(timeSlot.endTime), "hh:mm a")}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Player Name</p>
              <div className="flex items-center gap-2 text-white">
                <User size={16} className="text-[#84CC16]" />
                <span className="font-bold">{user?.name || "Guest"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Payment Mode</p>
              <div className="flex items-center gap-2 text-white">
                {paymentMethod === "WALLET" ? <Wallet size={16} className="text-[#84CC16]" /> : <CreditCard size={16} className="text-[#84CC16]" />}
                <span className="font-bold uppercase tracking-tight text-sm">{paymentMethod || "ONLINE"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Paid</p>
              <div className="flex items-center gap-1 text-[#84CC16]">
                <IndianRupee size={16} className="font-bold" />
                <span className="font-black text-xl">{totalPrice}</span>
              </div>
              {cashback > 0 && (
                <p className="text-[9px] font-black text-[#84CC16] uppercase tracking-tighter mt-1 flex items-center gap-1">
                  <Zap size={10} className="fill-[#84CC16]" />
                  ₹{cashback} Cashback Applied
                </p>
              )}
            </div>
          </div>

          {/* Contact & Navigation Section */}
          {(turf.managerContacts?.length > 0 || turf.mapUrl || turf.owner?.email) && (
            <div className="px-8 py-6 bg-white/5 border-t border-b border-white/5 space-y-6">
              <h4 className="text-[10px] font-black text-[#84CC16] uppercase tracking-[0.2em]">Contact & Navigation</h4>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Map Link */}
                {turf.mapUrl && (
                  <a 
                    href={turf.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group/map bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#84CC16]/50 transition-all"
                  >
                    <div className="w-10 h-10 bg-[#84CC16] rounded-xl flex items-center justify-center text-black">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">Navigate to Ground</p>
                      <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Open in Google Maps</p>
                    </div>
                    <ChevronLeft size={16} className="text-zinc-600 group-hover/map:text-[#84CC16] group-hover/map:translate-x-1 rotate-180 transition-all" />
                  </a>
                )}

                {/* Manager Contacts */}
                {turf.managerContacts?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Venue Managers</p>
                    <div className="grid grid-cols-1 gap-2">
                      {turf.managerContacts.map((contact, idx) => (
                        <a 
                          key={idx}
                          href={`tel:${contact.phone}`}
                          className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="text-white text-sm font-bold">{contact.name}</span>
                          <span className="text-[#84CC16] text-xs font-black italic tracking-wider">{contact.phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Support Emails */}
                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Support Contacts</p>
                    <div className="flex flex-col gap-2">
                      {turf.owner?.email && (
                        <div className="flex items-center justify-between text-xs px-1 group/email">
                          <span className="text-zinc-500">Venue:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{turf.owner.email}</span>
                            <button 
                              onClick={() => copyToClipboard(turf.owner.email, "Venue email")}
                              className="text-zinc-600 hover:text-[#84CC16] transition-colors"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs px-1 group/email">
                        <span className="text-zinc-500">Platform:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#84CC16] font-bold">support@turfspot.com</span>
                          <button 
                            onClick={() => copyToClipboard("support@turfspot.com", "Support email")}
                            className="text-zinc-600 hover:text-[#84CC16] transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="bg-white/5 p-8 flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(132,204,22,0.1)]">
              <img src={qrCode} alt="Entry QR" className="w-48 h-48" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-bold uppercase tracking-widest text-xs">Scan at Entrance</p>
              <p className="text-zinc-500 text-[10px] font-medium">Please show this pass to the turf manager</p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-8 pt-6 space-y-4">
            <Link 
              to={`/booking-invoice/${id}`}
              className="flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] rounded-2xl py-4 text-black text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
            >
              <FileText size={18} />
              View Invoice
            </Link>
            
            <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-3 text-white text-xs font-bold uppercase tracking-wider transition-all"
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
                  alert("Link copied to clipboard!");
                }
              }}
              className="flex items-center justify-center gap-2 bg-[#84CC16] hover:bg-[#a3e635] rounded-2xl py-3 text-black text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Verified Digital Entry Pass</span>
        </div>
      </div>
    </div>
  );
};

export default BookingPass;
