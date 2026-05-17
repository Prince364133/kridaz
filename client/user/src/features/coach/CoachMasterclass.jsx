import React, { useState, useEffect } from "react";
import { Video, PlayCircle, Plus, Layout, Calendar, Clock, Zap } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";

/**
 * CoachMasterclass — Virtual training content feed.
 * Standardized for the Console design language (Inter font, 8px radii, Lime theme).
 */

export default function CoachMasterclass() {
  const { loading } = useCoachDashboard();
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

  if (loading) return <DashboardSkeleton />;

  const themeColor = "#CCFF00";

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white font-inter pb-24">
      <div className="p-4 lg:px-10 lg:pt-10 lg:pb-12 space-y-12 animate-fade-in relative">
        
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: themeColor }} />
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight font-['Open_Sans'] uppercase leading-none">
                Digital <span style={{ color: themeColor }}>Masterclass</span>
              </h1>
              <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">{getTimeGreeting()} | Virtual Training Content Feed</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-8 py-4 rounded-lg backdrop-blur-xl">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-black" style={{ backgroundColor: themeColor }}>
                <Calendar size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-base font-black leading-none uppercase tracking-tight">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long" })}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                   {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <button className="px-8 py-4 text-black rounded-lg text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl" style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}>
              <Plus size={18} /> New Upload
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden hover:border-white/20 transition-all duration-500 shadow-2xl">
               <div className="aspect-video bg-white/[0.02] flex items-center justify-center relative">
                  <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <PlayCircle size={32} style={{ color: themeColor }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/5">
                     <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Training Node #{i}</span>
                  </div>
               </div>
               <div className="p-8 space-y-5">
                  <div className="space-y-2">
                     <h3 className="text-[20px] font-black text-white group-hover:text-[#CCFF00] transition-colors uppercase tracking-widest leading-tight font-inter">Advanced Batting Mechanics</h3>
                     <p className="text-neutral-500 text-[11px] font-bold uppercase leading-relaxed tracking-widest line-clamp-2">Mastering the professional stride and follow-through sequence.</p>
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t border-white/5">
                     <div className="flex items-center gap-3 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                        <Layout size={14} />
                        <span>742 Sessions</span>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border" style={{ color: themeColor, borderColor: `${themeColor}33`, backgroundColor: `${themeColor}1A` }}>DRAFT NODE</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
