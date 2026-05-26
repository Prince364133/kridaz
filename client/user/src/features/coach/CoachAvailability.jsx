import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Calendar, Clock, Plus, Trash2, Save, Loader2, CalendarDays, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday, parse } from "date-fns";
import ClockPicker from "@components/common/ClockPicker";

export default function CoachAvailability() {
  const { user } = useSelector((state) => state.auth);
  const themeColor = "#55DEE8";
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ startTime: "09:00", endTime: "10:00" });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

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
      const coachId = user?._id || user?.id || user?.user;
      if (!coachId) return;
      const res = await axiosInstance.get(`/api/coach/availability/${coachId}?date=${selectedDate}`);
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

  const handleAddSlot = () => {
    if (slots.some(s => s.startTime === newSlot.startTime)) {
      toast.error("Slot already exists");
      return;
    }
    setSlots([...slots, { ...newSlot, isAvailable: true }].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const handleRemoveSlot = (startTime) => {
    setSlots(slots.filter(s => s.startTime !== startTime));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const coachId = user?._id || user?.id || user?.user;
      await axiosInstance.put("/api/coach/availability", {
        coachId,
        date: selectedDate,
        slots
      });
      toast.success("Schedule synchronized", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
    } catch (error) {
      toast.error("Synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative font-['Open_Sans']">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 pb-2 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: themeColor }} />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                Coach <span style={{ color: themeColor }}>Availability</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
              {getTimeGreeting()}, {user?.name || "Coach"} | Professional Schedule Console
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-8 py-4 rounded-[6px] backdrop-blur-xl">
              <div className="w-12 h-12 bg-opacity-10 rounded-md flex items-center justify-center" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80" style={{ color: themeColor }}>
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })} ΓÇó{" "}
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-4 rounded-[6px] text-black font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 transition-all disabled:opacity-50 font-inter shadow-2xl active:scale-95 hover:brightness-110"
              style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}66` }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Schedule
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[8px] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-opacity-10 rounded-[6px]" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white font-inter">
                  Select Date
                </h3>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {dates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button 
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-[8px] border transition-all duration-300 ${ isSelected ? "text-black border-transparent shadow-lg" : "bg-[#2D2D2D]/30 border-[#2D2D2D] text-[#878C9F] hover:border-[#55DEE8]/30 hover:bg-[#2D2D2D]/50" }`}
                      style={isSelected ? { backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}66` } : {}}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest mb-1 font-inter">{format(date, 'EEE')}</span>
                      <span className="text-[18px] font-bold leading-none font-inter">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-opacity-5 border border-opacity-10 rounded-[8px] p-6 lg:p-8 relative overflow-hidden group" style={{ backgroundColor: `${themeColor}0d`, borderColor: `${themeColor}1a` }}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={60} style={{ color: themeColor }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Zap style={{ color: themeColor }} size={20} />
                <h4 className="text-[11px] font-bold uppercase tracking-wider font-inter" style={{ color: themeColor }}>Operational Tips</h4>
              </div>
              <ul className="space-y-3 text-[11px] font-medium text-[#878C9F] uppercase tracking-widest leading-relaxed font-inter relative z-10">
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>Define specific slots for different session types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>System prevents removal of assigned slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>Maintaining consistency improves booking rates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Slot Management */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[8px] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-opacity-10 rounded-[6px]" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                  <Clock size={18} />
                </div>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white font-inter">
                  Time Slot Configuration
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-end gap-4 mb-10 pb-10 border-b border-white/5">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-medium text-[#999999] uppercase tracking-widest font-inter flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColor }} /> Start Time
                  </label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden transition-all hover:border-white/10 focus-within:border-white/20">
                    <ClockPicker 
                      value={timeToDate(newSlot.startTime)}
                      onChange={(date) => setNewSlot({...newSlot, startTime: dateToTime(date)})}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-medium text-[#999999] uppercase tracking-widest font-inter flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: themeColor }} /> End Time
                  </label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden transition-all hover:border-white/10 focus-within:border-white/20">
                    <ClockPicker 
                      value={timeToDate(newSlot.endTime)}
                      onChange={(date) => setNewSlot({...newSlot, endTime: dateToTime(date)})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddSlot}
                  className="h-[54px] px-8 bg-transparent text-white hover:text-black rounded-[8px] font-bold uppercase text-[11px] tracking-[2px] transition-all flex items-center gap-3 font-inter group shadow-lg border border-white/10"
                  onMouseEnter={(e) => { 
                    e.target.style.backgroundColor = themeColor; 
                    e.target.style.borderColor = themeColor; 
                    e.target.style.boxShadow = `0 10px 30px ${themeColor}66`;
                  }}
                  onMouseLeave={(e) => { 
                    e.target.style.backgroundColor = 'transparent'; 
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Slot
                </button>
              </div>
              
              {fetching ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin" style={{ color: themeColor }} size={40} />
                  <p className="text-[10px] font-bold uppercase tracking-[4px] text-[#2D2D2D]">Fetching Schedule</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-[#2D2D2D] rounded-[12px] bg-[#2D2D2D]/5 group hover:bg-[#2D2D2D]/10 transition-all">
                  <Clock size={48} className="mx-auto text-[#2D2D2D] mb-6 transition-colors group-hover:opacity-50" />
                  <p className="text-[11px] font-bold uppercase tracking-[4px] text-[#555] font-inter mb-2">No Slots Defined</p>
                  <p className="text-[9px] text-[#444] uppercase tracking-widest">Define your availability above to sync your professional calendar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-[8px] group hover:border-white/10 transition-all shadow-md relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: slot.isAvailable ? themeColor : "#ef4444" }} />
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[8px] bg-opacity-10 border border-opacity-20 flex items-center justify-center transition-colors" style={{ backgroundColor: `${themeColor}1a`, borderColor: `${themeColor}33` }}>
                          <Clock size={18} style={{ color: themeColor }} />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-white font-inter tracking-tight">{slot.startTime} - {slot.endTime}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slot.isAvailable ? themeColor : "#ef4444" }} />
                            <p className="text-[9px] font-bold uppercase tracking-[2px] font-inter" style={{ color: slot.isAvailable ? themeColor : "#ef4444" }}>
                              {slot.isAvailable ? "Available" : "Assigned"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {slot.isAvailable && (
                        <button 
                          onClick={() => handleRemoveSlot(slot.startTime)}
                          className="p-3 text-[#555] hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-all border border-transparent hover:border-red-500/20"
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
    </div>
  );
}
