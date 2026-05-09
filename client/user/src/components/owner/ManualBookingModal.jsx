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
      const res = await axiosInstance.get("/api/owner/turfs");
      setTurfs(res.data.turfs || []);
    } catch (err) {
      toast.error("Failed to load grounds");
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      // Need a public or owner route to get slots for a date
      // Reusing the user route if possible, or using the owner's turf details
      const res = await axiosInstance.get(`/api/user/turf/${selectedTurf._id}`);
      const turfData = res.data;
      
      // Calculate occupied slots for the date
      // This is complex because we need to check existing bookings for that date
      // For now, let's assume we have a simple way to get available slots
      // In a real scenario, we'd call an endpoint like /api/turf/:id/slots?date=...
      
      // Temporary: using timeSlots from turf data
      setAvailableSlots(turfData.timeSlots || []);
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
        totalPrice: selectedTurf.price, // Or calculate based on slot duration
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Manual <span className="text-[#CCFF00]">Booking</span></h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Step {step} of 3: {step === 1 ? 'Select Ground' : step === 2 ? 'Choose Time' : 'Customer Info'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turfs.map(turf => (
                <button 
                  key={turf._id}
                  onClick={() => { setSelectedTurf(turf); setStep(2); }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${selectedTurf?._id === turf._id ? 'bg-[#CCFF00]/10 border-[#CCFF00]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                  <div className="w-16 h-16 rounded-xl bg-black overflow-hidden flex-shrink-0">
                    <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">{turf.name}</h3>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 uppercase font-bold"><MapPin size={10} /> {turf.location}</p>
                    <p className="text-xs font-black text-[#CCFF00] mt-2 tracking-widest">₹{turf.price}/SLOT</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Booking Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CCFF00]" size={18} />
                       <input 
                         type="date" 
                         min={format(new Date(), "yyyy-MM-dd")}
                         className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                         value={selectedDate}
                         onChange={e => setSelectedDate(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Selected Ground</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold flex justify-between items-center">
                       <span className="uppercase">{selectedTurf?.name}</span>
                       <button onClick={() => setStep(1)} className="text-[#CCFF00] text-[10px]">CHANGE</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Available Slots</label>
                 {loading ? (
                    <div className="py-10 text-center animate-pulse text-[10px] font-black text-gray-500 uppercase tracking-widest">Scanning Schedule...</div>
                 ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                       {availableSlots.map((slot, i) => (
                          <button 
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 rounded-lg border text-[10px] font-black tracking-widest transition-all ${selectedSlot === slot ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400'}`}
                          >
                             {format(parseISO(slot.startTime), "hh:mm a")}
                          </button>
                       ))}
                    </div>
                 )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Customer Name</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                          placeholder="John Doe"
                          value={customerData.name}
                          onChange={e => setCustomerData({...customerData, name: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                     <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="tel" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                          placeholder="+91 98765 43210"
                          value={customerData.phone}
                          onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address (For Invoice)</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="email" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                          placeholder="john@example.com"
                          value={customerData.email}
                          onChange={e => setCustomerData({...customerData, email: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => setCustomerData({...customerData, paymentMethod: "CASH"})}
                       className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${customerData.paymentMethod === "CASH" ? 'bg-[#CCFF00]/10 border-[#CCFF00]' : 'bg-white/5 border-white/10'}`}
                     >
                        <Banknote className={customerData.paymentMethod === "CASH" ? 'text-[#CCFF00]' : 'text-gray-500'} />
                        <div className="text-left">
                           <p className="text-xs font-black uppercase tracking-widest">Cash / Offline</p>
                           <p className="text-[9px] font-bold text-gray-600 uppercase">Received by Partner</p>
                        </div>
                     </button>
                     <button 
                       onClick={() => setCustomerData({...customerData, paymentMethod: "ONLINE"})}
                       className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${customerData.paymentMethod === "ONLINE" ? 'bg-[#CCFF00]/10 border-[#CCFF00]' : 'bg-white/5 border-white/10'}`}
                     >
                        <CreditCard className={customerData.paymentMethod === "ONLINE" ? 'text-[#CCFF00]' : 'text-gray-500'} />
                        <div className="text-left">
                           <p className="text-xs font-black uppercase tracking-widest">Online / UPI</p>
                           <p className="text-[9px] font-bold text-gray-600 uppercase">Paid via External App</p>
                        </div>
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
           <div className="hidden sm:block">
              {selectedTurf && selectedSlot && (
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Payable</p>
                    <p className="text-xl font-black text-[#CCFF00]">₹{selectedTurf.price}</p>
                 </div>
              )}
           </div>

           <div className="flex gap-3 w-full sm:w-auto">
              {step > 1 && (
                 <button 
                   onClick={() => setStep(step - 1)}
                   className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/10"
                 >
                    Back
                 </button>
              )}
              {step < 3 ? (
                 <button 
                   disabled={!selectedTurf || (step === 2 && !selectedSlot)}
                   onClick={() => setStep(step + 1)}
                   className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-[#CCFF00] transition-all disabled:opacity-20"
                 >
                    Continue
                 </button>
              ) : (
                 <button 
                   disabled={loading || !customerData.name}
                   onClick={handleSubmit}
                   className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-[#CCFF00] text-black font-black uppercase tracking-widest text-[10px] hover:bg-[#b3ff00] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)] disabled:opacity-50"
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
