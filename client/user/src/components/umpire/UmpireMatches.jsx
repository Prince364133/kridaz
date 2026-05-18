import React from "react";
import { Trophy, Calendar, MapPin, Users, CheckCircle2, Zap, Search, Loader2, Hand, Clock, Shield, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";

export default function UmpireMatches() {
  const { dashboardData, loading, error, refreshData } = useUmpireDashboard();
  const { role, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isLimitedUmpire = role?.toLowerCase() === "limited_umpire";
  const [searchId, setSearchId] = React.useState("");
  const [globalMatch, setGlobalMatch] = React.useState(null);
  const [searching, setSearching] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [requestingUpgrade, setRequestingUpgrade] = React.useState(false);
  const [formData, setFormData] = React.useState({
    phone: user?.phone || "",
    city: "",
    experience: "",
    bio: "",
    specialization: "Cricket"
  });

  // Global search effect — fires after typing KRZ- prefix (4+ chars)
  React.useEffect(() => {
    if (searchId.length >= 4) {
      const fetchGlobal = async () => {
        setSearching(true);
        try {
          const res = await axiosInstance.get(`/api/hosted-game/find-by-id?shortId=${searchId}`);
          setGlobalMatch(res.data.game);
        } catch (e) {
          setGlobalMatch(null);
        } finally {
          setSearching(false);
        }
      };
      const timer = setTimeout(fetchGlobal, 600);
      return () => clearTimeout(timer);
    } else {
      setGlobalMatch(null);
    }
  }, [searchId]);

  const handleRequestUmpire = async (gameId) => {
    try {
      const res = await axiosInstance.post(`/api/hosted-game/request-umpire`, { gameId });
      if (res.data.success) {
        toast.success("Umpire request sent to host!");
        setSearchId("");
        if (refreshData) refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };


  if (loading) return <DashboardSkeleton />;

  const matches = dashboardData?.matches || [];
  const upgradeRequested = dashboardData?.upgradeRequested || false;

  // Local matches filtering
  const activeMatches = matches.filter(m => m.status !== 'completed');
  const filteredMatches = searchId 
    ? activeMatches.filter(m => m.shortId?.toUpperCase().includes(searchId) || m.name?.toUpperCase().includes(searchId))
    : activeMatches;

  const completedMatches = matches.filter(m => m.status === 'completed');

  const handleRequestUpgrade = async (e) => {
    if (e) e.preventDefault();
    setRequestingUpgrade(true);
    try {
      await axiosInstance.post("/api/user/auth/request-upgrade", formData);
      toast.success("Application submitted! Admin will review and approve your full umpire access.");
      setShowUpgradeModal(false);
      if (refreshData) refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setRequestingUpgrade(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {isLimitedUmpire && (
        <div className="bg-gradient-to-r from-red-500/20 via-red-500/5 to-transparent border border-red-500/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
              <Shield className={`text-red-500 ${!upgradeRequested ? "animate-pulse" : ""}`} size={32} />
            </div>
            <div className="space-y-1">
              {upgradeRequested ? (
                <>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Application Pending Review</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Your umpire application is <span className="text-yellow-400">under admin review</span>.<br />
                    You'll be notified once your full access is approved.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Restricted Access</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    You are currently in <span className="text-red-500">Match-Only Mode</span>. <br />
                    Complete the professional umpire form to unlock earnings, banking, and full profile tools.
                  </p>
                </>
              )}
            </div>
          </div>
          {upgradeRequested ? (
            <div className="w-full md:w-auto h-14 px-10 bg-yellow-500/10 text-yellow-400 font-black uppercase text-xs tracking-widest rounded-2xl border border-yellow-500/20 flex items-center justify-center gap-3">
              <Clock size={16} /> Awaiting Approval
            </div>
          ) : (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              disabled={requestingUpgrade}
              className="w-full md:w-auto h-14 px-10 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {requestingUpgrade ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Apply for Full Access"}
            </button>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Professional <span className="text-primary">Registration</span></h2>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Submit your details for full umpire certification</p>
              </div>

              <form onSubmit={handleRequestUpgrade} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="CONTACT NUMBER"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">City / Region</label>
                    <input 
                      type="text" 
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="PRIMARY LOCATION"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Experience (Years)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      placeholder="E.G. 5 YEARS"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Main Sport</label>
                    <select 
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all appearance-none"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Professional Bio / About</label>
                  <textarea 
                    rows="4"
                    required
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="TELL US ABOUT YOUR UMPIRING BACKGROUND..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-xs font-bold uppercase tracking-widest text-white focus:border-primary/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 h-14 bg-white/5 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={requestingUpgrade}
                    className="flex-[2] h-14 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(85,222,232,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60"
                  >
                    {requestingUpgrade ? <Loader2 size={16} className="animate-spin" /> : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> {searchId ? "Search Results" : "Active Assignments"}
        </h2>
        
        {/* Global Search Result */}
        {searching && (
          <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-primary" size={24} />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Searching global network...</p>
          </div>
        )}

        {!searching && globalMatch && !activeMatches.some(m => m._id === globalMatch._id) && (
          <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[2rem] p-8 group shadow-[0_0_50px_rgba(85,222,232,0.05)] animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div 
                className="space-y-4 cursor-pointer"
                onClick={() => navigate(`/match/${globalMatch._id}`)}
              >
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                    FOUND MATCH: {globalMatch.shortId}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {new Date(globalMatch.date).toLocaleDateString()} • {globalMatch.time}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {globalMatch.teams?.teamA?.name || 'Team A'} VS {globalMatch.teams?.teamB?.name || 'Team B'}
                </h3>
                <div className="flex flex-wrap gap-6">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <MapPin size={14} className="text-primary" /> {globalMatch.ground?.name || "Self-Arranged Venue"}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Users size={14} className="text-primary" /> {globalMatch.city}
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {globalMatch.umpire ? (
                   <div className="flex flex-col md:flex-row items-center gap-3">
                     <div className="flex items-center gap-2 px-6 py-4 bg-primary/10 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20 shadow-[0_0_20px_rgba(85,222,232,0.1)]">
                       <Shield size={16} className="fill-primary/20" /> Umpire Hired
                     </div>
                     <button 
                       onClick={() => navigate(`/analytics/${globalMatch._id}`)}
                       className="h-14 px-6 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                     >
                       Analytics <Activity size={14} />
                     </button>
                     <button 
                       onClick={() => window.open(`/scoring/${globalMatch._id}`, '_blank', 'noopener,noreferrer')}
                       className="h-14 px-8 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(85,222,232,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center gap-3"
                     >
                       Score Now <Zap size={16} fill="currentColor" />
                     </button>
                   </div>
                ) : globalMatch.umpireRequest?.status === "PENDING" ? (
                   <div className="flex items-center gap-2 px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/5">
                      <Clock size={16} /> Request Pending Approval
                   </div>
                ) : (
                  <button 
                    onClick={() => handleRequestUmpire(globalMatch._id)}
                    className="w-full md:w-auto h-14 px-10 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(85,222,232,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center gap-3"
                  >
                    Request to Umpire <Hand size={16} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(filteredMatches.length === 0 && !globalMatch && !searching) ? (
          <div className="p-12 bg-white/[0.02] border border-white/5 border-dashed rounded-[2.5rem] text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              {searchId.length >= 4 ? `No match found for "${searchId}"` : "No active matches found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredMatches.map((match) => (
              <div 
                key={match._id} 
                onClick={() => navigate(`/match/${match._id}`)}
                className="cursor-pointer bg-gradient-to-r from-white/[0.03] to-transparent border border-white/10 rounded-[2rem] p-8 hover:border-primary/20 transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                        Match ID: {match.shortId || 'N/A'}
                      </span>
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Umpire Hired
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
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analytics/${match._id}`);
                      }}
                      className="w-full sm:w-auto h-14 px-8 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      Analytics <Activity size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/scoring/${match._id}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full sm:w-auto h-14 px-10 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(85,222,232,0.2)] hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 group-hover:scale-[1.02]"
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
        <div className="grid grid-cols-1 gap-4 opacity-60 hover:opacity-100 transition-opacity text-left">
          {completedMatches.map((match) => (
            <div 
              key={match._id} 
              onClick={() => navigate(`/match/${match._id}`)}
              className="cursor-pointer bg-[#0D0D0D] border border-white/5 rounded-[1.5rem] p-6 flex justify-between items-center hover:border-white/10 transition-all"
            >
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
