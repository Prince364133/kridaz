import React from "react";
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import useStreamerDashboard from "@hooks/owner/useStreamerDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function StreamerSchedule() {
  const { dashboardData, loading, error } = useStreamerDashboard();

  if (loading) return <DashboardSkeleton />;

  const upcomingMatches = dashboardData?.matches?.filter(m => m.status === 'upcoming') || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white">
            Streaming <span className="text-violet-500">Schedule</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Upcoming stream assignments and availability</p>
        </div>
      </div>

      {upcomingMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Calendar size={32} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Schedule Clear</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">No upcoming matches found in your roster. Please check back later for new streaming assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {upcomingMatches.map((match) => (
            <div key={match._id} className="group relative bg-[#0D0D0D] border border-white/5 rounded-[24px] p-8 hover:border-violet-500/30 transition-all duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex gap-6 flex-1">
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <span className="text-violet-500 text-[10px] font-black uppercase tracking-widest mb-1">
                      {new Date(match.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-3xl font-black text-white leading-none">
                      {new Date(match.date).getDate()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Upcoming</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <Clock size={14} className="text-violet-500" />
                        {match.time}
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white group-hover:text-violet-500 transition-colors">{match.name}</h3>
                    
                    <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-violet-500" />
                        {match.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-violet-500" />
                        {match.teams?.join(" vs ") || "Teams TBD"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-stretch gap-3">
                  <button className="px-8 py-3 bg-violet-500 hover:bg-violet-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-500/20">
                    Confirm Availability
                  </button>
                  <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all">
                    Match Details
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
