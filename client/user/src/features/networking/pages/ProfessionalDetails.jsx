import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Calendar as CalendarIcon, Clock, MapPin, Star, Shield, Award, 
  CheckCircle, ChevronLeft, MessageSquare, Send, Loader2, Info, User,
  Camera, Zap, CalendarDays, Trophy, Activity, CheckCircle2, AlertTriangle, ShieldCheck,
  Globe, Users, Target, Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday } from "date-fns";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

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
      setPro(res.data.professional);
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
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <Loader2 className="animate-spin text-[#55DEE8]" size={40} />
    </div>
  );

  if (!pro) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
      <h2 className="text-white text-2xl font-bold mb-4">Professional Not Found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-12 pb-20 px-6 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-8">
            <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-8 md:p-12 mb-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative">
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden p-1 bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">
                    <div className="w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
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
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-black text-5xl tracking-tighter">
                          {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-heading text-4xl md:text-5xl uppercase leading-none">{pro.name}</h1>
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[10px] font-bold tracking-widest border border-[#BFF367]/20 uppercase">
                      PRO {pro.role}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-lg text-white/60 mb-8 font-sans">
                    <span className="flex items-center gap-2"><MapPin size={18} className="text-[#55DEE8]" /> {pro.city}, {pro.state}</span>
                    <span className="flex items-center gap-2"><Star size={18} className="fill-[#BFF367] text-[#BFF367]" /> {pro.rating?.toFixed(1) || "5.0"} ({pro.numReviews || 0} reviews)</span>
                    <span className="flex items-center gap-2"><Award size={18} className="text-[#55DEE8]" /> {pro.businessDetails?.experience || "5+ Years"} exp</span>
                  </div>

                  <p className="text-white/70 leading-relaxed mb-10 max-w-2xl text-[18px] font-sans">
                    {pro.bio || `Specialized in ${pro.gameTypes?.join(", ")}. Providing high-quality professional services to elevate your sports experience. Certified and experienced in handling complex match scenarios and coaching sessions.`}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {pro.gameTypes?.map(sport => (
                      <span key={sport} className="px-5 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/10 text-xs font-bold tracking-widest text-white/80 uppercase">
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Dossier Matrix */}
            <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-8 mb-8">
              <h3 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
                <Briefcase size={18} className="text-[#55DEE8]" /> Professional Matrix
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Operational Headline</p>
                  <div className="p-4 bg-black/40 rounded-xl border border-neutral-800 text-white font-bold tracking-wide">
                    {pro.specialization || "Senior Professional"}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Proficiency Level</p>
                  <div className="p-4 bg-black/40 rounded-xl border border-neutral-800 text-[#BFF367] font-bold tracking-wide uppercase">
                    {pro.coachingLevel || "Elite Associate"}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Industry Tenure</p>
                  <div className="p-4 bg-black/40 rounded-xl border border-neutral-800 text-white font-bold tracking-wide">
                    {pro.experience || "5+ Professional Seasons"}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Engagement</p>
                    <div className="p-4 bg-black/40 rounded-xl border border-neutral-800 text-white font-bold tracking-wide uppercase">
                      {pro.availabilityMode || "Hybrid Mode"}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Languages</p>
                    <div className="p-4 bg-black/40 rounded-xl border border-neutral-800 text-white font-bold tracking-wide flex items-center gap-2 uppercase">
                      <Globe size={16} className="text-[#55DEE8]" /> {pro.languages?.join(", ") || "English, Hindi"}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-neutral-800/50 my-6" />

              <h3 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
                <Target size={18} className="text-[#55DEE8]" /> Specialization Scopes
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Operational Types</p>
                  <div className="flex flex-wrap gap-2">
                    {["Individual", "Group", "Team", "Clinic"].map(type => (
                      <span key={type} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border ${["Individual", "Team"].includes(type) ? 'bg-[#55DEE8]/10 text-[#55DEE8] border-[#55DEE8]/20' : 'bg-black/40 text-gray-500 border-neutral-800'}`}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Target Demographics</p>
                  <div className="flex flex-wrap gap-2">
                    {["Kids (<12)", "Teens (13-19)", "Adults (20+)", "Seniors"].map(demo => (
                      <span key={demo} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border ${["Adults (20+)", "Teens (13-19)"].includes(demo) ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-black/40 text-gray-500 border-neutral-800'}`}>
                        {demo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-neutral-800/50 my-6" />

              <h3 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
                <Award size={18} className="text-[#55DEE8]" /> Career Milestones
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
                {[
                  { date: "2024", title: "Officiated State Level Finals", desc: "Selected from top 10 umpires for the season finale." },
                  { date: "2022", title: "ICC Panel Induction", desc: "Officially inducted into the regional professional panel." }
                ].map((milestone, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-black text-[#55DEE8] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-col text-[8px] font-black leading-tight z-10">
                      <span className="text-gray-500">YR</span>
                      {milestone.date}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-neutral-800 bg-black/40 hover:border-[#55DEE8]/30 transition-all">
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">{milestone.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{milestone.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Performance & Analytics KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center text-center hover:border-[#55DEE8]/30 transition-all">
                <Trophy size={24} className="text-[#55DEE8] mb-3" />
                <h4 className="text-2xl font-black text-white">{pro.totalMatches || 142}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Matches Officiated</p>
              </div>
              <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center text-center hover:border-[#BFF367]/30 transition-all">
                <Activity size={24} className="text-[#BFF367] mb-3" />
                <h4 className="text-2xl font-black text-white">{pro.accuracy || 94.5}%</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Decision Accuracy</p>
              </div>
              <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center text-center hover:border-[#55DEE8]/30 transition-all">
                <ShieldCheck size={24} className="text-[#55DEE8] mb-3" />
                <h4 className="text-2xl font-black text-white">{pro.reliability || 98.5}%</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Reliability Score</p>
              </div>
              <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-all">
                <Star size={24} className="text-amber-500 mb-3 fill-amber-500" />
                <h4 className="text-2xl font-black text-white">{pro.rating?.toFixed(1) || 4.8}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Kridaz Rating</p>
              </div>
            </div>

            {/* Enterprise Certifications */}
            <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-8 mb-8">
              <h3 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
                <Shield size={18} className="text-[#55DEE8]" /> Credentials & Licenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "BCCI Level 2 Umpire", issuer: "BCCI", status: "Active", expiry: "Dec 2027", badge: "Elite", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800" },
                  { name: "ICC Match Referee Seminar", issuer: "ICC", status: "Active", expiry: "Aug 2026", badge: "Standard", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800" }
                ].map((cert, idx) => (
                  <div key={idx} className="relative rounded-[1.5rem] border border-neutral-800 overflow-hidden group hover:border-[#55DEE8]/30 transition-all aspect-[4/3] bg-black">
                    <img src={cert.image} alt={cert.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 pointer-events-none">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex gap-2 items-center">
                          <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] text-[8px] font-black uppercase tracking-widest rounded border border-[#55DEE8]/20 backdrop-blur-md">
                            {cert.status}
                          </span>
                          {cert.badge === 'Elite' && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded border border-amber-500/20 backdrop-blur-md">
                              Elite
                            </span>
                          )}
                        </div>
                        <Award size={16} className={cert.badge === 'Elite' ? 'text-amber-500' : 'text-[#55DEE8]'} />
                      </div>
                      
                      <h4 className="text-sm font-bold text-white tracking-tight uppercase mb-1 drop-shadow-md">{cert.name}</h4>
                      
                      <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest drop-shadow-md">
                        <span>{cert.issuer}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span>Exp: {cert.expiry}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Widget */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Select Schedule Card */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-neutral-800/60 shadow-lg">
                <h2 className="font-heading text-xl font-bold text-white mb-6">Select Schedule</h2>

                {/* Date Selection */}
                <div className="mb-6">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {dates.slice(0, 5).map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button 
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-lg transition-all ${
                            isSelected 
                            ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black" 
                            : "bg-black border border-neutral-800 text-gray-400 hover:border-neutral-600"
                          }`}
                        >
                          <span className="text-[10px] font-semibold mb-1">{format(date, 'EEE')}</span>
                          <span className="text-lg font-bold leading-none">{format(date, 'dd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-sm font-semibold text-gray-400 mb-3 block">Available Slots</span>
                  {loading ? (
                    <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-[#55DEE8]" size={24} /></div>
                  ) : !availability || availability.slots.length === 0 ? (
                    <div className="text-center py-6 bg-black/40 rounded-lg border border-dashed border-neutral-800">
                      <p className="text-xs font-semibold text-neutral-500">No slots available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availability.slots.map((slot, i) => (
                        <button 
                          key={i}
                          disabled={!slot.isAvailable}
                          onClick={() => handleSlotToggle(slot)}
                          className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            !slot.isAvailable 
                            ? "bg-neutral-900 border border-neutral-900 text-neutral-600 cursor-not-allowed line-through" 
                            : selectedSlots.some(s => s.startTime === slot.startTime)
                            ? "bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#BFF367] text-[#BFF367]"
                            : "bg-black border border-neutral-800 text-gray-300 hover:border-neutral-600"
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea 
                  placeholder="Special request (Optional)"
                  className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm focus:border-[#55DEE8] outline-none transition-colors h-20 resize-none text-white font-sans placeholder:text-gray-600"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Checkout Card */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 lg:p-8 border border-neutral-800/60 shadow-lg">
                <h2 className="font-heading text-2xl font-bold text-white mb-6">Checkout</h2>
                
                {/* Selected Slots Preview */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-[#55DEE8]" />
                    <span className="text-base font-bold text-white">{pro.name}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-[#55DEE8] mt-0.5" />
                    <div>
                      {selectedSlots.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {selectedSlots.map((slot, idx) => (
                            <span key={idx} className="text-base font-bold text-white/90">
                              {slot.startTime} - {slot.endTime} <span className="text-neutral-600 font-normal mx-2">|</span> {format(new Date(selectedDate), 'dd/MM/yyyy')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-base font-bold text-neutral-600">Select slots above</span>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-800/50 my-6" />

                <div>
                  <h3 className="font-heading text-xl font-bold text-white mb-4">Price Details</h3>
                  <div className="space-y-4 font-sans">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/60">Slot Price</span>
                      <span className="text-white font-bold">₹ {selectedSlots.length * (pro.price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/60">Service Charge</span>
                      <span className="text-white font-bold">₹ 0</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xl font-bold text-white">Total Amount</span>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">₹ {selectedSlots.length * (pro.price || 0)}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-800/50 my-6" />

                <div className="mb-8 font-sans">
                  <h3 className="font-heading text-xl font-bold text-white mb-4">Payment</h3>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-bold text-white">Advance Pay</span>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">₹ {selectedSlots.length * (pro.price || 0)}</span>
                  </div>
                  <p className="text-xs text-yellow-500/80 font-medium">( Pay remaining at venue )</p>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={bookingLoading || selectedSlots.length === 0}
                  className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black py-4 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:grayscale shadow-lg active:scale-95"
                >
                  {bookingLoading ? <Loader2 className="animate-spin mx-auto text-black" size={20} /> : "PAY NOW"}
                </button>
              </div>

              {/* Reviews Card */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-neutral-800/60 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-white/60 font-sans">How was your experience</span>
                  <button className="px-3 py-1.5 rounded-md border border-[#BFF367]/40 text-[#BFF367] text-xs font-bold hover:bg-[#BFF367]/10 transition-colors">
                    RATE PRO
                  </button>
                </div>
                
                <h3 className="font-heading text-base font-bold text-white mb-6">Recent Reviews</h3>
                
                {reviews.length === 0 ? (
                  <p className="text-sm text-white/40 pb-2 font-sans italic">No reviews yet.</p>
                ) : (
                  <div className="space-y-6 font-sans">
                    {reviews.slice(0, 4).map((review, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-white/5">
                          {review.user?.profilePicture ? (
                            <img src={review.user.profilePicture} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white/40 text-xs font-bold uppercase">
                              {review.user?.name?.slice(0,2) || "?"}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                          {review.comment || "Loved the experience!"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
