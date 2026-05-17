import React, { useState, useEffect } from "react";
import { Calendar, Plus, Clock, Users, ArrowRight, Video } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachSessions() {
  const { dashboardData, loading } = useCoachDashboard();
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

  const sessions = dashboardData?.sessions || [];

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative font-['Open_Sans']">
        
        {/* Header Section — Exact Copy of Dashboard Design */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 pb-2 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#CCFF00] rounded-full" />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                Training <span className="text-[#CCFF00]">Sessions</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
              {getTimeGreeting()} | Operational Training Feed
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-4 rounded-2xl backdrop-blur-xl">
              <div className="w-12 h-12 bg-[#CCFF00]/10 rounded-xl flex items-center justify-center text-[#CCFF00]">
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[#CCFF00] text-[10px] font-semibold uppercase tracking-widest opacity-80">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })} •{" "}
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>

            <button className="px-6 py-4 bg-[#CCFF00] hover:bg-[#CCFF00]/90 text-black rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all font-inter shadow-2xl active:scale-95">
              <Plus size={16} /> New Session
            </button>
          </div>
        </header>

        <div className="relative z-10">

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center shadow-[var(--shadow-2)]">
          <div className="w-20 h-20 bg-[#2D2D2D]/30 rounded-[6px] flex items-center justify-center mb-6">
            <Calendar size={32} className="text-[#2D2D2D]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter mb-2">No Sessions Scheduled</h3>
          <p className="text-[11px] text-[#444] font-inter max-w-xs mx-auto">Your training calendar is currently empty. Click "New Session" to start scheduling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => (
            <div key={session._id} className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex gap-6 flex-1">
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#2D2D2D]/30 rounded-[6px] border border-[#2D2D2D] text-center">
                    <span className="text-[#CCFF00] text-[9px] font-bold uppercase tracking-wider mb-1 font-inter">
                      {new Date(session.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-white leading-none font-inter">
                      {new Date(session.date).getDate()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-[4px] border ${session.type === 'Private' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider font-inter">{session.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#999999] text-xs font-medium font-inter">
                        <Clock size={14} className="text-[#CCFF00]" />
                        {session.time}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white group-hover:text-[#CCFF00] transition-colors font-inter tracking-tight">{session.name}</h3>
                    
                    <div className="flex flex-wrap gap-6 text-[13px] text-[#878C9F] font-inter">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-[#CCFF00]" />
                        {session.students?.length || 0} Registered Students
                      </div>
                      <div className="flex items-center gap-2">
                        <Video size={14} className="text-[#CCFF00]" />
                        Interactive Coaching
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-stretch gap-3">
                  <button className="px-6 py-2.5 bg-transparent hover:bg-[#CCFF00]/10 text-[#999999] hover:text-[#CCFF00] text-xs font-bold uppercase tracking-widest rounded-[6px] border border-[#2D2D2D] hover:border-[#CCFF00]/30 transition-all flex items-center justify-center gap-2 font-inter">
                    Manage Session <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
