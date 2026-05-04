import React from "react";
import { Trophy, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function UmpireMatches() {
  const { dashboardData, loading, error } = useUmpireDashboard();

  if (loading) return <DashboardSkeleton />;

  const completedMatches = dashboardData?.matches?.filter(m => m.status === 'completed') || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white">
            Match <span className="text-primary">History</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Verified officiating record</p>
        </div>
      </div>

      {completedMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Trophy size={32} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">No Matches Recorded</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Your officiating history is currently empty. Once you complete assigned matches, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {completedMatches.map((match) => (
            <div key={match._id} className="group relative bg-[#0D0D0D] border border-white/5 rounded-[24px] p-6 hover:border-primary/30 transition-all duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Completed</span>
                    </div>
                    <span className="text-gray-500 text-xs font-medium">{new Date(match.date).toLocaleDateString()} • {match.time}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{match.name}</h3>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      {match.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      {match.teams?.join(" vs ") || "Teams TBD"}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Final Result</p>
                    <p className="text-white font-bold">{match.result || "Scorecard Pending"}</p>
                  </div>
                  <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all">
                    View Details
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
