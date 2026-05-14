import React from "react";
import { Calendar, Plus, Clock, Users, ArrowRight, Video } from "lucide-react";
import useCoachDashboard from "@hooks/owner/useCoachDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function CoachSessions() {
  const { dashboardData, loading } = useCoachDashboard();

  if (loading) return <DashboardSkeleton />;

  const sessions = dashboardData?.sessions || [];

  return (
    <div className="space-y-8 animate-fade-in font-open-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
            Training <span className="text-[#CCFF00]">Sessions</span>
          </h1>
          <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Scheduled classes and private training</p>
        </div>
        <button className="px-6 py-3 bg-[#CCFF00] text-black rounded-[6px] font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all font-inter shadow-[var(--shadow-2)]">
          <Plus size={16} /> New Session
        </button>
      </div>

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
  );
}
