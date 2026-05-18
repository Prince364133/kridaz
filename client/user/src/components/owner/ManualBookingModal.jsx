import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Phone, Mail, CreditCard, Banknote, MapPin, ChevronRight, Check } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

const ManualBookingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "CASH"
  });

  useEffect(() => {
    if (isOpen) {
      fetchTurfs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTurf && selectedDate) {
      fetchSlots();
    }
  }, [selectedTurf, selectedDate]);

  const fetchTurfs = async () => {
    try {
      const res = await axiosInstance.get("/api/owner/turf/all");
      setTurfs(res.data || []);
    } catch (err) {
      toast.error("Failed to load grounds");
    }
  };

  const fetchSlots = async () => {
    if (!selectedTurf || !selectedDate) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/user/turf/timeSlot?date=${selectedDate}&turfId=${selectedTurf._id}`);
      const { timeSlots: turfDetails, bookedTime } = res.data;
      
      // Calculate available slots based on generatedSlots and bookedTime
      if (turfDetails && turfDetails.generatedSlots) {
        const slots = turfDetails.generatedSlots
          .filter(slot => slot.isActive)
          .map(slot => {
            const isBooked = bookedTime.some(booking => {
              const bStart = format(parseISO(booking.startTime), "hh:mm a");
              return bStart === slot.startTime;
            });
            return {
              ...slot,
              isBooked
            };
          });
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTurf || !selectedSlot || !customerData.name) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);
    try {
      await axiosInstance.post("/api/owner/bookings/manual", {
        turfId: selectedTurf._id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        selectedTurfDate: selectedDate,
        totalPrice: selectedTurf.pricePerHour, 
        paymentMethod: customerData.paymentMethod,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone
      });

      toast.success("Manual booking successful!");
      onClose();
      // Reset state
      setStep(1);
      setSelectedTurf(null);
      setSelectedSlot(null);
      setCustomerData({ name: "", email: "", phone: "", paymentMethod: "CASH" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden shadow-[var(--shadow-2)] relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2D2D2D] flex items-center justify-between bg-[#000000]">
          <div className="flex items-center gap-3">
             <div className="w-1 h-6 bg-[#55DEE8] rounded-full" />
             <div>
               <h2 className="text-[20px] font-bold uppercase tracking-tight text-white font-open-sans">Manual <span className="text-[#55DEE8]">Booking</span></h2>
               <p className="text-[10px] font-medium text-[#878C9F] uppercase tracking-[0.2em] mt-0.5 font-inter">Console Step {step} of 3</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] rounded-[4px] transition-all text-[#878C9F] hover:text-white border border-transparent hover:border-[#2D2D2D]">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar bg-[#000000]">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turfs.map(turf => (
                <button 
                  key={turf._id}
                  onClick={() => { setSelectedTurf(turf); setStep(2); }}
                  className={`flex items-start gap-4 p-4 rounded-[6px] border transition-all text-left group ${selectedTurf?._id === turf._id ? 'bg-[#55DEE8]/5 border-[#55DEE8]' : 'bg-[#000000] border-[#2D2D2D] hover:border-[#55DEE8]/30'}`}
                >
                  <div className="w-14 h-14 rounded-[4px] bg-[#1A1A1A] overflow-hidden flex-shrink-0 border border-[#2D2D2D]">
                    <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] uppercase tracking-wider text-white font-inter">{turf.name}</h3>
                    <p className="text-[9px] text-[#878C9F] flex items-center gap-1 mt-1 uppercase font-bold tracking-widest"><MapPin size={10} className="text-[#55DEE8]" /> {turf.location}</p>
                    <p className="text-[12px] font-black text-[#55DEE8] mt-2 tracking-widest font-inter">Rs {turf.pricePerHour}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Booking Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55DEE8]" size={16} />
                       <input 
                         type="date" 
                         min={format(new Date(), "yyyy-MM-dd")}
                         className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-[#55DEE8] font-bold text-white font-inter appearance-none"
                         value={selectedDate}
                         onChange={e => setSelectedDate(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Active Facility</label>
                    <div className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-3 px-4 text-[13px] font-bold flex justify-between items-center text-white font-inter">
                       <span className="uppercase truncate max-w-[120px]">{selectedTurf?.name}</span>
                       <button onClick={() => setStep(1)} className="text-[#55DEE8] text-[10px] hover:underline font-black tracking-widest">SWITCH</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Schedule Matrix</label>
                 {loading ? (
                    <div className="py-10 text-center animate-pulse text-[10px] font-black text-[#878C9F] uppercase tracking-widest font-inter">Accessing Ground Feed...</div>
                 ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                       {availableSlots.map((slot, i) => (
                          <button 
                            key={i}
                            disabled={slot.isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 rounded-[4px] border text-[10px] font-black tracking-tighter transition-all font-inter ${
                              selectedSlot === slot 
                              ? 'bg-[#55DEE8] text-black border-[#55DEE8]' 
                              : slot.isBooked 
                              ? 'bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed opacity-50' 
                              : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#55DEE8]/50 text-[#878C9F] hover:text-white'
                            }`}
                          >
                             {slot.startTime}
                          </button>
                       ))}
                    </div>
                 )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Player Name</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
                        <input 
                          type="text" 
                          className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-[#55DEE8] font-bold text-white font-inter"
                          placeholder="ENTER FULL NAME"
                          value={customerData.name}
                          onChange={e => setCustomerData({...customerData, name: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Contact Number</label>
                     <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
                        <input 
                          type="tel" 
                          className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-[#55DEE8] font-bold text-white font-inter"
                          placeholder="+91 XXXXX XXXXX"
                          value={customerData.phone}
                          onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                     <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
                        <input 
                          type="email" 
                          className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-[#55DEE8] font-bold text-white font-inter"
                          placeholder="PLAYER@EXAMPLE.COM"
                          value={customerData.email}
                          onChange={e => setCustomerData({...customerData, email: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[0.15em] ml-1 font-inter">Settlement Method</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => setCustomerData({...customerData, paymentMethod: "CASH"})}
                       className={`flex items-center gap-3 p-3 rounded-[6px] border transition-all ${customerData.paymentMethod === "CASH" ? 'bg-[#55DEE8]/5 border-[#55DEE8]' : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#55DEE8]/30'}`}
                     >
                        <Banknote size={18} className={customerData.paymentMethod === "CASH" ? 'text-[#55DEE8]' : 'text-[#878C9F]'} />
                        <div className="text-left">
                           <p className="text-[11px] font-black uppercase tracking-widest text-white font-inter">CASH / OFFLINE</p>
                        </div>
                     </button>
                     <button 
                       onClick={() => setCustomerData({...customerData, paymentMethod: "ONLINE"})}
                       className={`flex items-center gap-3 p-3 rounded-[6px] border transition-all ${customerData.paymentMethod === "ONLINE" ? 'bg-[#55DEE8]/5 border-[#55DEE8]' : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#55DEE8]/30'}`}
                     >
                        <CreditCard size={18} className={customerData.paymentMethod === "ONLINE" ? 'text-[#55DEE8]' : 'text-[#878C9F]'} />
                        <div className="text-left">
                           <p className="text-[11px] font-black uppercase tracking-widest text-white font-inter">ONLINE / UPI</p>
                        </div>
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#2D2D2D] bg-[#000000] flex items-center justify-between">
           <div className="hidden sm:block">
              {selectedTurf && (
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter">Total Settlement</p>
                    <p className="text-[20px] font-bold text-[#55DEE8] font-open-sans">Rs {selectedTurf.pricePerHour}</p>
                 </div>
              )}
           </div>

           <div className="flex gap-2 w-full sm:w-auto">
              {step > 1 && (
                 <button 
                   onClick={() => setStep(step - 1)}
                   className="flex-1 sm:flex-none px-6 py-2.5 rounded-[6px] bg-[#1A1A1A] text-white font-bold uppercase tracking-widest text-[11px] hover:bg-[#2D2D2D] transition-all border border-[#2D2D2D] font-inter"
                 >
                    Back
                 </button>
              )}
              {step < 3 ? (
                 <button 
                   disabled={!selectedTurf || (step === 2 && !selectedSlot)}
                   onClick={() => setStep(step + 1)}
                   className="flex-1 sm:flex-none px-6 py-2.5 rounded-[6px] bg-white text-black font-bold uppercase tracking-widest text-[11px] hover:bg-[#55DEE8] transition-all disabled:opacity-20 font-inter"
                 >
                    Continue
                 </button>
              ) : (
                 <button 
                   disabled={loading || !customerData.name}
                   onClick={handleSubmit}
                   className="flex-1 sm:flex-none px-6 py-2.5 rounded-[6px] bg-[#55DEE8] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-[#b3ff00] transition-all shadow-[0_0_20px_rgba(204,255,0,0.15)] disabled:opacity-50 font-inter"
                 >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManualBookingModal;
