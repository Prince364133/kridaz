import React from "react";
import { Trophy, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function UmpireMatches() {
  const { dashboardData, loading, error } = useUmpireDashboard();

  if (loading) return <DashboardSkeleton />;

  const matches = dashboardData?.matches || [];
  const completedMatches = matches.filter(m => m.status === 'completed');
  const activeMatches = matches.filter(m => m.status !== 'completed');

  const [searchId, setSearchId] = React.useState("");

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
            Officiating <span className="text-primary">Center</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Direct Match Scoring & Record Management</p>
        </div>
        
        <div className="w-full md:w-80 relative group">
          <input 
            type="text" 
            placeholder="ENTER MATCH SHORT ID (KRZ-XXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
            <Trophy size={18} />
          </div>
        </div>
      </div>

      {/* Active Assignments */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-500 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Active Assignments
        </h2>
        
        {activeMatches.length === 0 && !searchId ? (
          <div className="p-12 bg-white/[0.02] border border-white/5 border-dashed rounded-[2.5rem] text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No active matches found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeMatches.map((match) => (
              <div key={match._id} className="bg-gradient-to-r from-white/[0.03] to-transparent border border-white/10 rounded-[2rem] p-8 hover:border-primary/20 transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                        Match ID: {match.shortId || 'N/A'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {new Date(match.date).toLocaleDateString()} • {match.time}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{match.name || "Untitled Match"}</h3>
                    <div className="flex flex-wrap gap-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <MapPin size={14} className="text-primary" /> {match.venue}
                       </div>
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <Users size={14} className="text-primary" /> {match.teams?.join(" vs ") || "Teams TBD"}
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={() => window.location.href = `/scoring/${match._id}`}
                      className="w-full md:w-auto h-14 px-10 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(132,204,22,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 group-hover:scale-[1.02]"
                    >
                      Score Game <Zap size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Verified History</h2>
        <div className="grid grid-cols-1 gap-4 opacity-60 hover:opacity-100 transition-opacity">
          {completedMatches.map((match) => (
            <div key={match._id} className="bg-[#0D0D0D] border border-white/5 rounded-[1.5rem] p-6 flex justify-between items-center">
               <div className="space-y-1">
                 <h4 className="text-sm font-bold text-white uppercase">{match.name}</h4>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{match.venue} • {new Date(match.date).toLocaleDateString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Completed</p>
                  <p className="text-xs font-bold text-gray-400">{match.result || "Verified"}</p>
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
