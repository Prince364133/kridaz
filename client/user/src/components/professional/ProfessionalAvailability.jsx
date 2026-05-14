import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Calendar, Clock, Plus, Trash2, Save, Loader2, CalendarDays, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday, parse } from "date-fns";
import ClockPicker from "../common/ClockPicker";

/**
 * ProfessionalAvailability — Role-aware schedule management.
 * Fully rebranded for Scorer users with Teal Green (#00C187) and Inter typography.
 */

export default function ProfessionalAvailability() {
  const { user, role } = useSelector((state) => state.auth);
  
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ startTime: "09:00", endTime: "10:00" });
  const [hasAvailability, setHasAvailability] = useState({}); // To track which dates have slots

  const timeToDate = (timeStr) => {
    if (!timeStr) return new Date();
    return parse(timeStr, 'HH:mm', new Date());
  };

  const dateToTime = (date) => {
    return format(date, 'HH:mm');
  };

  const dates = Array.from({ length: 28 }, (_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setFetching(true);
      const professionalId = user?._id || user?.id || user?.user;
      if (!professionalId) return;
      const res = await axiosInstance.get(`/api/professional/details/${professionalId}?date=${selectedDate}`);
      if (res.data.availability) {
        setSlots(res.data.availability.slots);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setSlots([]);
    } finally {
      setFetching(false);
    }
  };

  const handleAddSlot = async () => {
    if (slots.some(s => s.startTime === newSlot.startTime)) {
      toast.error("Slot already exists", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
      return;
    }
    const updatedSlots = [...slots, { ...newSlot, isAvailable: true }].sort((a, b) => a.startTime.localeCompare(b.startTime));
    setSlots(updatedSlots);

    try {
      setLoading(true);
      const promises = [];
      for (let i = 0; i < 28; i++) {
        const targetDate = format(addDays(startOfToday(), i), 'yyyy-MM-dd');
        promises.push(axiosInstance.put("/api/professional/availability", {
          date: targetDate,
          slots: updatedSlots
        }));
      }
      await Promise.all(promises);
      
      const newHasAvailability = {};
      for (let i = 0; i < 28; i++) {
        const d = format(addDays(startOfToday(), i), 'yyyy-MM-dd');
        newHasAvailability[d] = true;
      }
      setHasAvailability(prev => ({...prev, ...newHasAvailability}));
      
      toast.success("Batch update complete: 28 days synchronized", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
    } catch (error) {
      toast.error("Batch synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = async (startTime) => {
    const updatedSlots = slots.filter(s => s.startTime !== startTime);
    setSlots(updatedSlots);
    await handleSave(updatedSlots, selectedDate);
  };

  const handleSave = async (customSlots = null, customDate = null) => {
    try {
      setLoading(true);
      const targetDate = typeof customDate === 'string' ? customDate : selectedDate;
      const targetSlots = Array.isArray(customSlots) ? customSlots : slots;
      
      await axiosInstance.put("/api/professional/availability", {
        date: targetDate,
        slots: targetSlots
      });
      
      if (!customDate) {
        toast.success("Schedule synchronized", {
            style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
        });
      }
      
      setHasAvailability(prev => ({
        ...prev,
        [targetDate]: targetSlots.length > 0
      }));
    } catch (error) {
      toast.error("Synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-inter h-full custom-scrollbar pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
        <div className="space-y-1.5">
          <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-white uppercase font-inter">
            Node <span style={{ color: themeColor }}>Availability</span>
          </h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">Configure your professional timeline and active slots</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-10 py-4 rounded-2xl text-black font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 transition-all disabled:opacity-50 font-inter shadow-2xl active:scale-95"
          style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-black border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-8 flex items-center gap-3 font-inter">
              <CalendarDays size={18} style={{ color: themeColor }} /> Select Date
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {dates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                const hasSlots = hasAvailability[dateStr];
                return (
                  <button 
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                      ? "text-black shadow-lg" 
                      : "bg-white/[0.02] border-white/5 text-neutral-500 hover:border-white/20"
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? themeColor : undefined,
                      borderColor: isSelected ? themeColor : undefined,
                      boxShadow: isSelected ? `0 10px 20px ${themeColor}33` : undefined
                    }}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest mb-1.5 font-inter">{format(date, 'EEE')}</span>
                    <span className="text-xl font-black leading-none font-inter">{format(date, 'dd')}</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-60 font-inter">{format(date, 'MMM')}</span>
                    {hasSlots && !isSelected && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-black border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#00C187]/5 blur-[80px] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-end gap-6 mb-12 pb-10 border-b border-white/5 relative z-10">
              <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Start Time</label>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden focus-within:border-[#00C187]/50 transition-all">
                  <ClockPicker 
                    value={timeToDate(newSlot.startTime)}
                    onChange={(date) => setNewSlot({...newSlot, startTime: dateToTime(date)})}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">End Time</label>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden focus-within:border-[#00C187]/50 transition-all">
                  <ClockPicker 
                    value={timeToDate(newSlot.endTime)}
                    onChange={(date) => setNewSlot({...newSlot, endTime: dateToTime(date)})}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddSlot}
                className="h-16 px-8 bg-white/[0.03] border border-white/5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#00C187]/10 hover:border-[#00C187]/30 transition-all flex items-center justify-center gap-3 font-inter"
                style={{ color: themeColor }}
              >
                <Plus size={18} /> Add Slot
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 font-inter">Active Intervals for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</h3>
            </div>
            
            {fetching ? (
              <div className="py-24 flex justify-center"><Loader2 className="animate-spin" style={{ color: themeColor }} size={40} /></div>
            ) : slots.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                <Clock size={48} className="mx-auto text-neutral-800 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700 font-inter">No timeline defined for this node</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                {slots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-[#00C187]/30 transition-all shadow-lg">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#00C187]/10 flex items-center justify-center border border-[#00C187]/20">
                        <Clock size={20} style={{ color: themeColor }} />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-white font-inter tracking-tight">{slot.startTime} - {slot.endTime}</p>
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] font-inter mt-1`} style={{ color: slot.isAvailable ? themeColor : "#ef4444" }}>
                          {slot.isAvailable ? "Available" : "Assigned"}
                        </p>
                      </div>
                    </div>
                    {slot.isAvailable && (
                      <button 
                        onClick={() => handleRemoveSlot(slot.startTime)}
                        className="p-3 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
