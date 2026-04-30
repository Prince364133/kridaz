import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Mail, Phone, 
  CheckCircle2, AlertCircle, Trash2, Edit2, Star, Zap, X
} from "lucide-react";
import useTurfDetails from "@hooks/owner/useTurfDetails";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";

// Booking Information Popup
const BookingModal = ({ slot, onClose }) => {
  if (!slot) return null;
  const { bookingDetails, startTime, endTime, isBooked } = slot;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D0D0D] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Slot Telemetry</p>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8 pt-0 space-y-6">
          {isBooked ? (
            <>
              <div className="flex items-center gap-4 p-6 bg-primary/5 border border-primary/20 rounded-[24px]">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  {bookingDetails.user.profileImage ? (
                    <img src={bookingDetails.user.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={28} className="text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{bookingDetails.user.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-0.5 bg-primary text-black text-[8px] font-black uppercase rounded">Verified</div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Athlete Profile</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Contact Intelligence</p>
                <div className="grid grid-cols-1 gap-3">
                  <a href={`mailto:${bookingDetails.user.email}`} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary">
                        <Mail size={14} />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">{bookingDetails.user.email}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-700" />
                  </a>
                  <a href={`tel:${bookingDetails.user.phoneNumber}`} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary">
                        <Phone size={14} />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">{bookingDetails.user.phoneNumber}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-700" />
                  </a>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-white/[0.02] rounded-[24px] border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Impact</span>
                  <span className="text-[8px] text-gray-600 font-bold uppercase">Settled via Platform</span>
                </div>
                <span className="text-3xl font-black text-primary italic">₹{bookingDetails.totalPrice}</span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                <Zap size={32} className="text-gray-700" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Available Unit</h4>
                <p className="text-gray-500 text-sm max-w-[200px] mx-auto mt-2">No bookings detected for this sequence. Slot is open for athlete deployment.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-8 pt-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { turfData, isLoading, error } = useTurfDetails(id);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  React.useEffect(() => {
    if (turfData?.slots?.length > 0) {
      const dates = [...new Set(turfData.slots.map(slot => new Date(slot.startTime).toISOString().split('T')[0]))].sort();
      if (dates.length > 0 && !dates.includes(selectedDate)) {
        setSelectedDate(dates[0]);
      }
    }
  }, [turfData, selectedDate]);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return (
    <div className="p-8 text-center">
      <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-bold text-white mb-2">Error Loading Arena</h2>
      <p className="text-gray-500 mb-6">{error || "Connection failure to command center"}</p>
      {error && typeof error === 'string' && error.includes("{") && (
        <pre className="text-[8px] text-gray-700 bg-black/20 p-4 rounded mb-6 max-w-md mx-auto overflow-auto text-left">
          {error}
        </pre>
      )}
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-black font-bold rounded-xl">Go Back</button>
    </div>
  );

  if (!turfData || !turfData.turf) return (
    <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[32px]">
      <Zap size={48} className="mx-auto text-gray-700 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Arena Data Not Found</h2>
      <p className="text-gray-500 mb-6">We couldn't retrieve the operational metrics for this facility.</p>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-black font-bold rounded-xl">Go Back</button>
    </div>
  );

  const { turf, slots = [] } = turfData;

  // Filter slots for selected date
  const filteredSlots = slots.filter(slot => {
    const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
    return slotDate === selectedDate;
  });

  // Group slots by day for the calendar selector
  const uniqueDates = [...new Set(slots.map(slot => new Date(slot.startTime).toISOString().split('T')[0]))].sort();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Popups */}
      {selectedSlot && (
        <BookingModal 
          slot={selectedSlot} 
          onClose={() => setSelectedSlot(null)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest w-fit"
        >
          <ArrowLeft size={14} />
          Back to Inventory
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="w-32 h-32 rounded-[24px] overflow-hidden border border-white/10 shrink-0 shadow-2xl">
                <img src={turf.image} alt={turf.name} className="w-full h-full object-cover" />
             </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <h1 className="text-5xl font-black uppercase tracking-tight text-white">{turf.name}</h1>
                   <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-1">
                      <Star size={12} className="text-primary fill-primary" />
                      <span className="text-[10px] font-bold text-primary">{turf.avgRating?.toFixed(1) || "NEW"}</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-500 text-xs font-medium uppercase tracking-wider">
                   <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" />
                      {turf.location}
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" />
                      {turf.openTime} - {turf.closeTime}
                   </div>
                </div>
             </div>
          </div>
          <div className="flex gap-3">
             <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Edit2 size={14} />
                Edit Arena
             </button>
             <button className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2">
                <Trash2 size={14} />
                Decommission
             </button>
          </div>
        </div>
      </div>

      {/* Operational Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-primary/60">Sport Arsenal</p>
            <div className="flex flex-wrap gap-2">
               {turf.sportTypes?.map((sport, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase">
                     {sport}
                  </span>
               ))}
            </div>
         </div>
         <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ground Composition</p>
            <div className="flex flex-wrap gap-2">
               {turf.groundTypes?.map((ground, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-[10px] font-black uppercase">
                     {ground}
                  </span>
               ))}
            </div>
         </div>
         <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Facility Intelligence</p>
            <div className="flex flex-wrap gap-2">
               {turf.facilities?.map((facility, i) => (
                  <span key={i} className="px-3 py-1 bg-primary border border-primary rounded-lg text-black text-[10px] font-black uppercase">
                     {facility}
                  </span>
               ))}
            </div>
         </div>
      </div>

      {/* Booking Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Date Selector */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Timeline Control
           </h3>
           <div className="flex flex-col gap-2">
              {uniqueDates.length > 0 ? (
                uniqueDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex justify-between items-center ${
                      selectedDate === date 
                      ? "bg-primary border-primary text-black scale-[1.02] shadow-lg shadow-primary/20" 
                      : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-col">
                       <span className="text-xs font-black uppercase tracking-tighter">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
                       </span>
                       <span className="text-[10px] opacity-60 font-bold">
                          {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                       </span>
                    </div>
                    {selectedDate === date && <Zap size={14} fill="currentColor" />}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No Active Slots</p>
                </div>
              )}
           </div>
        </div>

        {/* Slots Grid */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                 <Clock size={16} className="text-primary" />
                 Slot Manifest <span className="ml-2 px-2 py-0.5 bg-white/5 rounded text-[10px] text-primary">{filteredSlots.length} Active</span>
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Available</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Booked</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSlots.length > 0 ? (
                filteredSlots.map((slot) => (
                  <button 
                    key={slot._id} 
                    onClick={() => setSelectedSlot(slot)}
                    className={`relative overflow-hidden p-6 rounded-[24px] border transition-all duration-500 group text-left ${
                      slot.isBooked 
                      ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(132,204,22,0.1)]" 
                      : "bg-white/[0.02] border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time Sequence</p>
                          <h4 className="text-lg font-black text-white">
                             {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                             {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </h4>
                       </div>
                       {slot.isBooked ? (
                         <div className="px-3 py-1 bg-primary text-black rounded-full">
                            <span className="text-[9px] font-black uppercase tracking-widest">Booked</span>
                         </div>
                       ) : (
                         <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available</span>
                         </div>
                       )}
                    </div>

                    {slot.isBooked ? (
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                               {slot.bookingDetails.user.profileImage ? (
                                 <img src={slot.bookingDetails.user.profileImage} className="w-full h-full object-cover" />
                               ) : (
                                 <Users size={16} className="text-primary" />
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h5 className="text-sm font-bold text-white truncate uppercase tracking-tight">{slot.bookingDetails.user.name}</h5>
                               <p className="text-[9px] text-primary font-bold uppercase tracking-widest italic">View Details</p>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center opacity-20 group-hover:opacity-60 transition-opacity">
                         <CheckCircle2 size={32} className="text-gray-400 mb-3" />
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Open Slot</p>
                      </div>
                    )}

                    {/* Design Flourish */}
                    {slot.isBooked && (
                      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
                    )}
                  </button>
                ))
              ) : (
                <div className="col-span-full py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Zap size={24} className="text-white/20" />
                   </div>
                   <h4 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Zero Operational Data</h4>
                   <p className="text-gray-500 text-sm max-w-xs mx-auto">No slots are configured for the selected timeline. Adjust your arena settings to deploy new sessions.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

const ChevronRight = ({ className, size = 16 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
