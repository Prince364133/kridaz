import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Star, Shield, Award, 
  CheckCircle, ChevronLeft, MessageSquare, Send, Loader2, Info, User,
  Camera, Zap, CalendarDays
} from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday } from "date-fns";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { ProfessionalMapper } from "../mappers/professional.mapper";

const PRI = "#84CC16";

export default function ProfessionalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const [pro, setPro] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [message, setMessage] = useState("");

  const dates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    fetchProDetails();
  }, [id, selectedDate]);

  const fetchProDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/professional/details/${id}?date=${selectedDate}`);
      const mapped = ProfessionalMapper.toClientModel(res.data.professional);
      setPro(mapped);
      setAvailability(res.data.availability);
      setReviews(res.data.reviews);
      setSelectedSlots([]); // Clear slots on date change
    } catch (error) {
      console.error("Error fetching professional details:", error);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = (slot) => {
    if (selectedSlots.some(s => s.startTime === slot.startTime)) {
      setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleBooking = async () => {
    gateInteraction(async () => {
      if (selectedSlots.length === 0) {
        toast.error("Please select at least one slot");
        return;
      }

      try {
        setBookingLoading(true);
        const totalAmount = selectedSlots.length * (pro.price || 0);
        
        if (user.walletBalance < totalAmount) {
          toast.error("Insufficient balance. Please top up your wallet.");
          navigate("/wallet");
          return;
        }

        await axiosInstance.post("/api/professional/book", {
          professionalId: id,
          date: selectedDate,
          slots: selectedSlots,
          totalAmount,
          bookingType: pro.role === "coach" ? "HOURLY" : "MATCH",
          message
        });

        toast.success("Booking request sent! Coins reserved until professional accepts.");
        navigate("/my-joined-games"); // Or a new "My Professional Bookings" page
      } catch (error) {
        console.error("Booking error:", error);
        toast.error(error.response?.data?.message || "Booking failed");
      } finally {
        setBookingLoading(false);
      }
    }, {
      title: "Hire Professional",
      message: "Take your game to the next level. Sign in to book top-tier coaches and umpires for your next match."
    });
  };

  if (loading && !pro) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-[#84CC16]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs uppercase tracking-widest">Back to Listing</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-8">
            <div className="bg-neutral-900/40 rounded-[40px] border border-neutral-800 p-8 md:p-12 mb-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative">
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-[32px] overflow-hidden border-4 border-[#84CC16]/20">
                    <div className="w-full h-full bg-[#84CC16]/10 flex items-center justify-center overflow-hidden">
                      {pro.profilePicture ? (
                        <img 
                          src={pro.profilePicture} 
                          alt={pro.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center bg-[#1a1a1a]"
                        style={{ display: pro.profilePicture ? 'none' : 'flex' }}
                      >
                        <span className="text-[#84CC16] font-black text-5xl tracking-tighter">
                          {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#84CC16] p-2 rounded-xl shadow-xl">
                    <Shield size={20} className="text-black" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-display text-4xl md:text-5xl uppercase leading-none">{pro.name}</h1>
                    <span className="px-3 py-1 rounded-full bg-[#84CC16]/10 text-[#84CC16] text-[10px] font-bold tracking-widest border border-[#84CC16]/20 uppercase">
                      PRO {pro.role}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-[#84CC16]" /> {pro.city}, {pro.state}</span>
                    <span className="flex items-center gap-1"><Star size={14} className="fill-[#84CC16] text-[#84CC16]" /> {pro.rating?.toFixed(1) || "5.0"} ({pro.numReviews || 0} reviews)</span>
                    <span className="flex items-center gap-1"><Award size={14} className="text-[#84CC16]" /> {pro.businessDetails?.experience || "5+ Years"} exp</span>
                  </div>

                  <p className="text-gray-400 leading-relaxed mb-8 max-w-2xl">
                    {pro.bio || `Specialized in ${pro.gameTypes?.join(", ")}. Providing high-quality professional services to elevate your sports experience. Certified and experienced in handling complex match scenarios and coaching sessions.`}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {pro.gameTypes?.map(sport => (
                      <span key={sport} className="px-4 py-2 rounded-xl bg-black border border-neutral-800 text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications & Reviews Tabs (Simplified for now) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-neutral-900/40 rounded-[40px] border border-neutral-800 p-8">
                <h3 className="font-display text-xl uppercase mb-6 flex items-center gap-2">
                  <Shield size={18} className="text-[#84CC16]" /> Certifications
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {pro.certifications?.length > 0 ? pro.certifications.map((cert, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-black border border-neutral-800 overflow-hidden group cursor-pointer">
                      <img src={cert} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  )) : [1, 2, 3].map(i => (
                    <div key={i} className="aspect-square rounded-2xl bg-black/40 border border-dashed border-neutral-800 flex items-center justify-center">
                      <Camera size={20} className="text-neutral-800" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-900/40 rounded-[40px] border border-neutral-800 p-8">
                <h3 className="font-display text-xl uppercase mb-6 flex items-center gap-2">
                  <Star size={18} className="text-[#84CC16]" /> User Reviews
                </h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review, i) => (
                      <div key={i} className="border-b border-neutral-800 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-white/10 overflow-hidden bg-[#84CC16]/10 flex items-center justify-center shrink-0">
                              {review.user?.profilePicture ? (
                                <img 
                                  src={review.user.profilePicture} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ display: review.user?.profilePicture ? 'none' : 'flex' }}
                              >
                                <span className="text-[#84CC16] font-black text-[8px]">
                                  {review.user?.name ? review.user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : '?'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold">{review.user?.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={8} className={i < review.rating ? "fill-[#84CC16] text-[#84CC16]" : "text-neutral-800"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic line-clamp-2">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Widget */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="bg-[#84CC16] rounded-[40px] p-8 text-black mb-6 shadow-2xl shadow-[#84CC16]/20">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Price per {pro.role === "coach" ? "hour" : "match"}</p>
                    <p className="text-4xl font-display uppercase leading-none">₹{pro.price || "500"}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle size={16} /> Instant Request
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <Shield size={16} /> Secured Payment
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <Clock size={16} /> Flexible Cancellation
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-[40px] p-8">
                <h4 className="font-display text-lg uppercase mb-6 flex items-center justify-between">
                  Select Schedule
                  <CalendarDays size={18} className="text-[#84CC16]" />
                </h4>

                {/* Date Selection */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-2xl border transition-all ${
                          isSelected 
                          ? "bg-[#84CC16] border-[#84CC16] text-black" 
                          : "bg-black border-neutral-800 text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        <span className="text-[8px] font-bold uppercase tracking-widest mb-1">{format(date, 'EEE')}</span>
                        <span className="text-xl font-display">{format(date, 'dd')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slots */}
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Available Slots</p>
                {loading ? (
                   <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#84CC16]" size={24} /></div>
                ) : !availability || availability.slots.length === 0 ? (
                  <div className="text-center py-10 bg-black/40 rounded-2xl border border-dashed border-neutral-800 mb-8">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">No slots available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {availability.slots.map((slot, i) => (
                      <button 
                        key={i}
                        disabled={!slot.isAvailable}
                        onClick={() => handleSlotToggle(slot)}
                        className={`px-4 py-3 rounded-xl border text-[10px] font-bold transition-all ${
                          !slot.isAvailable 
                          ? "bg-neutral-900 border-neutral-950 text-neutral-800 cursor-not-allowed line-through" 
                          : selectedSlots.some(s => s.startTime === slot.startTime)
                          ? "bg-[#84CC16]/20 border-[#84CC16] text-[#84CC16]"
                          : "bg-black border-neutral-800 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message */}
                <div className="mb-8">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Special Request (Optional)</label>
                  <textarea 
                    placeholder="E.g. Focus on batting drills..."
                    className="w-full bg-black border border-neutral-800 rounded-2xl p-4 text-xs font-medium focus:border-[#84CC16] outline-none transition-colors h-24 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Booking Footer */}
                <div className="pt-6 border-t border-neutral-800">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</p>
                      <p className="text-2xl font-display text-white">₹{selectedSlots.length * (pro.price || 0)}</p>
                    </div>
                    <p className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">{selectedSlots.length} Slots Selected</p>
                  </div>

                  <button 
                    onClick={handleBooking}
                    disabled={bookingLoading || selectedSlots.length === 0}
                    className="w-full bg-[#84CC16] text-black py-4 rounded-[20px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {bookingLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Send Booking Request"}
                  </button>
                  <p className="text-center text-[9px] text-gray-500 mt-4 uppercase tracking-[0.2em]">Coins will be reserved until accepted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
