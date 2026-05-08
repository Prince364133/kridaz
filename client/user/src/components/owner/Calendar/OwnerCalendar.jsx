import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Clock, 
  Calendar as CalendarIcon,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';
import useAxiosInstance from "@hooks/useAxiosInstance";
import { format, addDays, subDays } from "date-fns";
import CountUp from "react-countup";

const OwnerCalendar = () => {
  const axiosInstance = useAxiosInstance();
  const [view, setView] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async (date) => {
    setLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await axiosInstance.get(`/api/owner/dashboard/calendar?date=${formattedDate}`);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  // Generate timeline headers based on all unique slot times across all facilities
  const allTimeSlots = data?.facilities?.reduce((acc, fac) => {
    fac.slots.forEach(slot => {
      if (!acc.includes(slot.startTime)) acc.push(slot.startTime);
    });
    return acc;
  }, []).sort() || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8 font-inter overflow-x-hidden space-y-6">
      
      {/* Top Filter Bar - Matching Dashboard Pattern */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="bg-[#111111] p-1 rounded-[10px] flex items-center border border-[#2D2D2D]">
          {['Month', 'Week', 'Day'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-8 py-2 rounded-[8px] text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                view === v ? 'bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'text-[#878C9F] hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-[#111111] border border-[#2D2D2D] hover:border-[#CCFF00]/50 text-white px-6 py-2.5 rounded-[8px] text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all">
            Schedule Overview
          </button>
          <button className="bg-[#CCFF00] hover:bg-[#B3FF00] text-black px-6 py-2.5 rounded-[8px] text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_4px_15px_rgba(204,255,0,0.15)]">
            <Plus size={16} strokeWidth={3} /> Block Slots
          </button>
        </div>
      </div>

      {/* Control Strip - Now Styled as a Dashboard Card */}
      <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-[var(--shadow-2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00]/5 blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-10 relative z-10">
          <div className="space-y-1">
            <p className="text-[#CCFF00] text-[10px] font-bold uppercase tracking-[2px]">{format(selectedDate, "EEEE")}</p>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-semibold text-white tracking-tight font-outfit uppercase">{format(selectedDate, "dd MMM yyyy")}</h2>
              <div className="flex items-center gap-2 ml-2">
                <button onClick={handlePrevDay} className="w-9 h-9 flex items-center justify-center hover:bg-[#2D2D2D] rounded-[6px] text-[#999999] hover:text-white transition-all border border-[#2D2D2D]">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextDay} className="w-9 h-9 flex items-center justify-center hover:bg-[#2D2D2D] rounded-[6px] text-[#999999] hover:text-white transition-all border border-[#2D2D2D]">
                  <ChevronRight size={20} />
                </button>
              </div>
              <button onClick={handleToday} className="ml-2 px-5 py-2 bg-[#2D2D2D] border border-[#404040] rounded-[6px] text-[10px] font-bold uppercase tracking-widest hover:text-[#CCFF00] transition-all">
                Today
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]" />
              <span className="text-[11px] font-medium text-[#999999] uppercase tracking-wider">Confirmed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2D2D2D] border border-[#444444]" />
              <span className="text-[11px] font-medium text-[#999999] uppercase tracking-wider">Available</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-[#2D2D2D] hidden md:block" />

          <div className="flex items-center gap-3 bg-[#111111] px-5 py-2 rounded-full border border-[#2D2D2D]">
             <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
             <span className="text-[11px] font-bold text-white uppercase tracking-widest">{data?.stats?.averageLoad || 0}% Load</span>
          </div>
        </div>
      </div>

      {/* Main Grid Container - Dashboard Card Style */}
      <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden flex flex-col shadow-[var(--shadow-2)] relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin" />
              <p className="text-[#CCFF00] text-[9px] font-bold uppercase tracking-[4px]">Synchronizing Matrix</p>
            </div>
          </div>
        )}

        {/* Grid Header */}
        <div className="flex border-b border-[#2D2D2D]">
          <div className="w-[280px] p-6 border-r border-[#2D2D2D] shrink-0 bg-[#000000]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-[3px]">Facilities</span>
              <Filter size={14} className="text-[#878C9F] hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          <div className="flex-1 flex overflow-x-auto no-scrollbar bg-[#111111]">
            {allTimeSlots.map((time, idx) => (
              <div key={idx} className="min-w-[130px] py-4 text-center border-r border-[#2D2D2D]/30 last:border-r-0">
                <span className="text-[10px] font-bold text-[#878C9F] tracking-[2px] uppercase">{time}</span>
              </div>
            ))}
            {allTimeSlots.length === 0 && (
               <div className="flex-1 py-4 px-6 text-[10px] text-[#444] uppercase tracking-widest italic">No operational slots detected for this date</div>
            )}
          </div>
        </div>

        {/* Grid Rows */}
        <div className="flex-1 flex flex-col max-h-[600px] overflow-y-auto no-scrollbar">
          {data?.facilities?.map((facility) => (
            <div key={facility.id} className="flex border-b border-[#2D2D2D]/30 last:border-b-0 min-h-[140px] group transition-colors">
              {/* Facility Info Column */}
              <div className="w-[280px] p-6 border-r border-[#2D2D2D] shrink-0 flex flex-col justify-center bg-[#000000] group-hover:bg-[#111111] transition-all relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-10 bg-transparent group-hover:bg-[#CCFF00] transition-all" />
                <h3 className="text-sm font-semibold text-white mb-1.5 uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{facility.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#2D2D2D] rounded text-[9px] font-bold text-[#878C9F] uppercase tracking-wider border border-[#404040]">{facility.category}</span>
                </div>
              </div>

              {/* Timeline Cells */}
              <div className="flex-1 relative bg-[#000000] overflow-x-auto no-scrollbar flex">
                {allTimeSlots.map((time, idx) => {
                  const slot = facility.slots.find(s => s.startTime === time);
                  const isBooked = slot?.isBooked;
                  
                  return (
                    <div key={idx} className="min-w-[130px] h-full border-r border-[#2D2D2D]/20 last:border-r-0 flex items-center justify-center p-3">
                      {slot ? (
                        <div 
                          className={`w-full h-full rounded-[6px] flex flex-col justify-between p-3 border transition-all ${
                            isBooked 
                              ? "bg-[#CCFF00]/5 border-[#CCFF00]/20 shadow-sm" 
                              : "bg-transparent border-dashed border-[#2D2D2D] opacity-20 hover:opacity-100 hover:bg-[#111111] hover:border-solid"
                          } cursor-pointer group/slot`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${isBooked ? "text-[#CCFF00]" : "text-[#444444]"}`}>
                              {isBooked ? "Active" : "Open"}
                            </span>
                          </div>
                          
                          <div className="space-y-0.5">
                            <p className={`text-[12px] font-semibold uppercase tracking-tight truncate ${isBooked ? "text-white" : "text-[#333]"}`}>
                              {isBooked ? (slot.bookingDetails?.userName || "Booked") : "Slot Vacant"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1">
                             <Clock size={10} className={isBooked ? "text-[#CCFF00]/60" : "text-[#222]"} />
                             <span className={`text-[9px] font-bold uppercase tracking-tight ${isBooked ? "text-[#CCFF00]/80" : "text-[#222]"}`}>
                               1 Hr
                             </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {(!data?.facilities || data.facilities.length === 0) && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-32 bg-[#000000]">
               <CalendarIcon size={40} className="text-[#2D2D2D] mb-6" />
               <p className="text-[#999999] text-[10px] font-bold uppercase tracking-[5px] opacity-40">No Facilities Registered</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats Strip - Styled as Dashboard StatsCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          { title: "Average Load", value: data?.stats?.averageLoad || 0, suffix: "%", icon: Clock, trend: "Stable" },
          { title: "Confirmed Slots", value: data?.stats?.confirmedSlots || 0, icon: Activity, trend: "+12%" },
          { title: "Est. Daily Revenue", value: data?.stats?.totalRevenue || 0, prefix: "₹", icon: Zap, trend: "+₹1.2k" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
            <stat.icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] flex items-center justify-center transition-all border border-[#CCFF00]/20">
                <stat.icon size={20} />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold uppercase tracking-wider border border-[#CCFF00]/20">
                {stat.trend}
              </div>
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[2px]">{stat.title}</h3>
              <div className="text-3xl font-semibold text-white tracking-tight flex items-baseline gap-1 font-outfit">
                {stat.prefix && <span className="text-lg text-white/40 font-normal">{stat.prefix}</span>}
                <CountUp end={stat.value} duration={2} separator="," decimals={stat.value % 1 === 0 ? 0 : 1} />
                {stat.suffix && <span className="text-lg text-white/40 font-normal">{stat.suffix}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default OwnerCalendar;
