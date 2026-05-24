import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Video, MapPin, Users, CheckCircle2, AlertCircle, 
  ArrowLeft, Loader2, Palette, Shield, Info, ExternalLink,
  ChevronRight, Star
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";

export default function ManageStream() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/hosted-game/${matchId}`);
      setMatch(res.data.game);
      setStatus(res.data.officialSetupStatus);
    } catch (err) {
      toast.error("Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) fetchMatchDetails();
  }, [matchId]);

  const officials = [
    { label: "Scorer", icon: Users, status: status?.isScorerApproved ? "CONNECTED" : "MISSING", color: "text-emerald-500", name: match?.scorer?.name },
    { label: "Umpire", icon: Shield, status: status?.isUmpireApproved ? "CONNECTED" : "MISSING", color: "text-blue-500", name: match?.umpire?.name },
    { label: "Venue", icon: MapPin, status: match?.ground ? "CONNECTED" : "MISSING", color: "text-orange-500", name: match?.ground?.name || "Self-Arranged" }
  ];

  const allConnected = status?.streamingEnabled && match?.ground;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-violet-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in custom-scrollbar pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate('/streamer/matches')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                <ArrowLeft size={18} />
              </button>
              <span className="px-3 py-1 bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                Stream Management
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
              Match <span className="text-violet-500">Coordination</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Verify officials and setup broadcast parameters</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
             <div className="text-right">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Match Status</p>
                <p className="text-xs font-black text-white uppercase">{match?.status}</p>
             </div>
             <div className={`w-3 h-3 rounded-full ${match?.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Match Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Video size={120} />
               </div>
               
               <div className="relative space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_5px_15px_rgba(139,92,246,0.3)]">
                       {match?.shortId || 'KRZ-MATCH'}
                    </span>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                       {new Date(match?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>

                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">
                    {match?.teams?.teamA?.name || 'TBD'} <br />
                    <span className="text-violet-500">VS</span> {match?.teams?.teamB?.name || 'TBD'}
                  </h2>

                  <div className="flex flex-wrap gap-8 pt-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tournament</p>
                       <p className="text-sm font-bold text-white">{match?.tournament || 'Local Friendly'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Overs</p>
                       <p className="text-sm font-bold text-white">{match?.overs} Over Match</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Game Type</p>
                       <p className="text-sm font-bold text-white uppercase">{match?.gameType}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Ticker Selection Gateway */}
            <div className="bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer hover:border-violet-500/40 transition-all shadow-[0_0_50px_rgba(139,92,246,0.05)]"
                 onClick={() => navigate(`/streamer/ticker-gallery/${matchId}`)}>
               <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-violet-500 flex items-center justify-center shadow-[0_10px_30px_rgba(139,92,246,0.3)] group-hover:scale-110 transition-transform">
                     <Palette size={40} className="text-white" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">Ticker <span className="text-violet-500">Studio</span></h3>
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                        Current Theme: <span className="text-white">{match?.tickerTheme || 'Classic Default'}</span> <br />
                        Change the visual identity of your live broadcast
                     </p>
                  </div>
               </div>
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-violet-500 transition-all">
                  <ChevronRight size={24} />
               </div>
            </div>
          </div>

          {/* Officials Checklist Card */}
          <div className="space-y-6">
             <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 space-y-8">
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Officials <span className="text-emerald-500">Status</span></h3>
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Ecosystem verification required</p>
                </div>

                <div className="space-y-4">
                   {officials.map((off, i) => (
                     <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${off.color}`}>
                              <off.icon size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{off.label}</p>
                              <p className="text-sm font-bold text-white uppercase truncate max-w-[120px]">{off.name || 'Not Assigned'}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           {off.status === 'CONNECTED' ? (
                             <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                <CheckCircle2 size={12} /> Verified
                             </div>
                           ) : (
                             <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                <AlertCircle size={12} /> Missing
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>

                {!allConnected && (
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                     <div className="flex items-center gap-2 text-amber-500">
                        <Info size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Action Required</p>
                     </div>
                     <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase">
                        Streaming setup is restricted until all official positions (Scorer, Umpire, and Venue) are confirmed by the host.
                     </p>
                  </div>
                )}

                <div className="pt-4">
                   <button 
                     disabled={!allConnected}
                     onClick={() => navigate(`/matches/${matchId}/stream-setup`)}
                     className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl ${
                       allConnected 
                       ? 'bg-white text-black hover:bg-gray-100 hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
                       : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                     }`}
                   >
                     {allConnected ? (
                       <>Start Stream Setup <Video size={18} fill="currentColor" /></>
                     ) : (
                       <>Gated: Complete Setup</>
                     )}
                   </button>
                </div>
             </div>

             <div className="p-8 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3 text-blue-500">
                   <Star size={20} className="fill-blue-500" />
                   <h4 className="text-xs font-black uppercase tracking-widest">Pro Streamer Tip</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Syncing with the scorer ensures your live ticker displays real-time ball-by-ball data without manual input.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
