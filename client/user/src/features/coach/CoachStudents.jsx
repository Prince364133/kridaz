import React, { useState, useEffect } from "react";
import { Users, Mail, Phone, ExternalLink, ShieldCheck } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";

export default function CoachStudents() {
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

  const trainees = dashboardData?.trainees || [];

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative font-['Open_Sans']">
        
        {/* Header Section GÇö Exact Copy of Dashboard Design */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 pb-2 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#55DEE8] rounded-full" />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                Student <span className="text-[#55DEE8]">Roster</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
              {getTimeGreeting()} | Talent Pipeline Console
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-4 rounded-2xl backdrop-blur-xl">
              <div className="w-12 h-12 bg-[#55DEE8]/10 rounded-xl flex items-center justify-center text-[#55DEE8]">
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <p className="text-[#55DEE8] text-[10px] font-semibold uppercase tracking-widest opacity-80">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })} GÇó{" "}
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10">

      {trainees.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center shadow-[var(--shadow-2)]">
          <div className="w-20 h-20 bg-[#2D2D2D]/30 rounded-[6px] flex items-center justify-center mb-6">
            <Users size={32} className="text-[#2D2D2D]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter mb-2">Roster Empty</h3>
          <p className="text-[11px] text-[#444] font-inter max-w-xs mx-auto">You haven't added any students yet. Once athletes subscribe to your coaching, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainees.map((student) => (
            <div key={student._id} className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 hover:border-[#55DEE8]/30 transition-all duration-500 shadow-[var(--shadow-2)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[6px] bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center overflow-hidden">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#55DEE8] font-inter">{student.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#55DEE8] transition-colors font-inter tracking-tight">{student.name}</h3>
                  <div className="flex items-center gap-1 text-[#878C9F] text-[10px] uppercase tracking-wider font-medium font-inter">
                    <ShieldCheck size={12} className="text-[#55DEE8]" />
                    Verified Athlete
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[13px] text-[#878C9F] font-inter">
                  <div className="w-8 h-8 rounded-[6px] bg-[#2D2D2D]/30 flex items-center justify-center border border-[#2D2D2D]">
                    <Mail size={14} className="text-[#55DEE8]" />
                  </div>
                  {student.email}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#878C9F] font-inter">
                  <div className="w-8 h-8 rounded-[6px] bg-[#2D2D2D]/30 flex items-center justify-center border border-[#2D2D2D]">
                    <Phone size={14} className="text-[#55DEE8]" />
                  </div>
                  {student.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-2.5 bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 text-[#55DEE8] text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all font-inter border border-[#55DEE8]/20">
                  View Profile
                </button>
                <button className="py-2.5 bg-transparent hover:bg-white/5 text-[#999999] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all border border-[#2D2D2D] font-inter">
                  Message
                </button>
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
