import React from "react";
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";

import { useSelector } from "react-redux";

export default function UmpireSchedule() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";
  const portalName = isScorer ? "SCORER" : "OFFICIAL";

  const { dashboardData, loading, error } = useUmpireDashboard();

  if (loading) return <DashboardSkeleton />;

  const upcomingMatches = dashboardData?.matches?.filter(m => m.status === 'upcoming') || [];

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white font-inter">
            {portalName} <span style={{ color: themeColor }}>Schedule</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] font-inter">Upcoming assignments and availability</p>
        </div>
      </div>

      {upcomingMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Calendar size={32} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Schedule Clear</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">No upcoming matches found in your roster. Please check back later for new assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {upcomingMatches.map((match) => (
            <div key={match._id} className="group relative bg-[#000000] border border-white/5 rounded-[24px] p-8 transition-all duration-500"
                 style={{ borderColor: "rgba(255,255,255,0.05)" }}
                 onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColor}40`}
                 onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex gap-6 flex-1">
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <span className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">
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
                        <Clock size={14} style={{ color: themeColor }} />
                        {match.time}
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white transition-colors font-inter group-hover:text-white" style={{ color: "white" }}>{match.name}</h3>
                    
                    <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} style={{ color: themeColor }} />
                        {match.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} style={{ color: themeColor }} />
                        {match.teams?.join(" vs ") || "Teams TBD"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-stretch gap-3 font-inter">
                  <button className="px-8 py-3 text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                          style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px ${themeColor}20` }}>
                    Confirm Availability
                  </button>
                  <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all">
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
