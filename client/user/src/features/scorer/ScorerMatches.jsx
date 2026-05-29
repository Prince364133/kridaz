import React from "react";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Zap, 
  Search, 
  Loader2, 
  Hand, 
  Clock, 
  Shield, 
  Activity,
  ArrowRight,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useScorerDashboard from "@hooks/owner/useScorerDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";

const ACCENT = "#BFF367";

export default function ScorerMatches() {
  const { dashboardData, loading, error } = useScorerDashboard();
  const { role, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isLimitedScorer = role?.toLowerCase() === "limited_scorer";
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

  // Global search effect
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

  const handleRequestScorer = async (gameId) => {
    try {
      const res = await axiosInstance.post(`/api/hosted-game/request-scorer`, { gameId });
      if (res.data.success) {
        toast.success("Scorer request sent to host!");
        setSearchId("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  if (loading) return <DashboardSkeleton />;

  const matches = dashboardData?.matches || [];
  const upgradeRequested = dashboardData?.upgradeRequested || false;

  const activeMatches = matches.filter(m => m.status !== 'completed');
  const filteredMatches = searchId 
    ? activeMatches.filter(m => m.shortId?.toUpperCase().includes(searchId) || m.name?.toUpperCase().includes(searchId))
    : activeMatches;

  const completedMatches = matches.filter(m => m.status === 'completed');

  const handleRequestUpgrade = async (e) => {
    if (e) e.preventDefault();
    setRequestingUpgrade(true);
    try {
      await axiosInstance.post("/api/user/auth/request-upgrade", { ...formData, role: "scorer" });
      toast.success("Application submitted! Admin will review your profile.");
      setShowUpgradeModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setRequestingUpgrade(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-24 font-inter max-w-[1600px] mx-auto">
      
      {/* PROFESSIONAL STATUS BANNER */}
      {isLimitedScorer && (
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-[#BFF367]/20 transition-all duration-500 shadow-[var(--shadow-2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-[60px]"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-[8px] bg-[#BFF367]/10 flex items-center justify-center shrink-0 border border-[#BFF367]/20 shadow-sm">
              <Shield className={`text-[#BFF367] ${!upgradeRequested ? "animate-pulse" : ""}`} size={32} />
            </div>
            <div className="space-y-1.5">
              {upgradeRequested ? (
                <>
                  <h3 className="text-xl font-bold text-white tracking-tight font-inter">PRO APPLICATION PENDING</h3>
                  <p className="text-[#999999] text-xs font-medium uppercase tracking-wider font-inter">
                    Your professional scorer application is <span className="text-[#BFF367]">under review</span>.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white tracking-tight font-inter">QUICK-SCORING MODE</h3>
                  <p className="text-[#999999] text-xs font-medium uppercase tracking-wider font-inter">
                    Complete your professional registration to <span className="text-[#BFF367]">earn from matches</span>.
                  </p>
                </>
              )}
            </div>
          </div>
          {!upgradeRequested && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              disabled={requestingUpgrade}
              className="w-full md:w-auto px-8 py-3.5 bg-[#BFF367] text-black font-bold uppercase text-[11px] tracking-widest rounded-[6px] hover:scale-[0.98] transition-all shadow-[var(--shadow-2)] relative z-10 font-inter"
            >
              Unlock Professional Access
            </button>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#000000] border border-[#2D2D2D] rounded-[8px] shadow-[var(--shadow-4)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight font-inter">Scorer <span className="text-[#BFF367]">Registration</span></h2>
                <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter">Upgrade to a professional digital scorer</p>
              </div>

              <form onSubmit={handleRequestUpgrade} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#878C9F] ml-1 font-inter">Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Contact Number"
                      className="w-full h-12 bg-transparent border border-[#2D2D2D] rounded-[6px] px-4 text-sm text-white focus:border-[#BFF367]/50 outline-none transition-all font-inter"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#878C9F] ml-1 font-inter">City / Region</label>
                    <input 
                      type="text" 
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Current Location"
                      className="w-full h-12 bg-transparent border border-[#2D2D2D] rounded-[6px] px-4 text-sm text-white focus:border-[#BFF367]/50 outline-none transition-all font-inter"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#878C9F] ml-1 font-inter">Professional Bio</label>
                  <textarea 
                    rows="4"
                    required
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about your scoring experience..."
                    className="w-full bg-transparent border border-[#2D2D2D] rounded-[6px] p-4 text-sm text-white focus:border-[#BFF367]/50 outline-none transition-all resize-none font-inter"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 h-12 bg-transparent border border-[#2D2D2D] text-[#999999] font-bold uppercase text-[11px] tracking-widest rounded-[6px] hover:bg-white/5 transition-all font-inter"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={requestingUpgrade}
                    className="flex-[2] h-12 bg-[#BFF367] text-black font-bold uppercase text-[11px] tracking-widest rounded-[6px] shadow-[var(--shadow-2)] hover:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 font-inter"
                  >
                    {requestingUpgrade ? <Loader2 size={16} className="animate-spin" /> : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
            Scoring <span className="text-[#BFF367]">Center</span>
          </h1>
          <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Live Match Management & Digital Analytics</p>
        </div>
        
        <div className="w-full md:w-80 relative group">
          <input 
            type="text" 
            placeholder="Search Match ID (KRZ-XXXX)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            className="w-full h-12 bg-transparent border border-[#2D2D2D] rounded-[6px] px-4 text-sm text-white focus:border-[#BFF367]/50 outline-none transition-all pr-12 font-inter"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#878C9F] group-focus-within:text-[#BFF367] transition-colors">
            <Search size={18} />
          </div>
        </div>
      </div>

      {/* MATCH ASSIGNMENTS */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#BFF367] animate-pulse" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#878C9F] font-inter">
            {searchId ? "Search Results" : "Current Assignments"}
          </h2>
        </div>
        
        {searching && (
          <div className="p-20 bg-[#000000] border border-[#2D2D2D] border-dashed rounded-[8px] text-center flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-[#BFF367]" size={32} />
             <p className="text-[11px] font-bold uppercase tracking-widest text-[#555] font-inter">Synchronizing Network Data...</p>
          </div>
        )}

        {/* Global Search Result */}
        {!searching && globalMatch && !activeMatches.some(m => m._id === globalMatch._id) && (
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 lg:p-8 group hover:border-[#BFF367]/30 transition-all duration-500 shadow-[var(--shadow-2)] relative overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-[60px]"></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-bold uppercase tracking-widest rounded-[4px] border border-[#BFF367]/20">
                    NETWORK MATCH: {globalMatch.shortId}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight font-inter">
                  {globalMatch.name || "Match Found"}
                </h3>
              </div>
              <button 
                onClick={() => handleRequestScorer(globalMatch._id)}
                className="w-full md:w-auto px-8 py-3 bg-[#BFF367] text-black font-bold uppercase text-[11px] tracking-widest rounded-[6px] hover:scale-[0.98] transition-all flex items-center justify-center gap-2 font-inter"
              >
                Request Access <Zap size={14} fill="currentColor" />
              </button>
            </div>
          </div>
        )}

        {/* Assignments List */}
        {(filteredMatches.length === 0 && !globalMatch && !searching) ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center">
            <Trophy size={32} className="text-[#2D2D2D] mb-4" />
            <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter">No Match Assignments</h3>
            <p className="text-[11px] text-[#444] font-inter max-w-xs mx-auto mt-2">
              {searchId.length >= 4 ? `No match found for "${searchId}"` : "You don't have any live matches assigned at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredMatches.map((match) => (
              <div 
                key={match._id} 
                className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 hover:border-[#BFF367]/30 transition-all duration-500 shadow-[var(--shadow-2)]"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex gap-6 flex-1">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#2D2D2D]/30 rounded-[6px] border border-[#2D2D2D] text-center shrink-0">
                      <span className="text-[#BFF367] text-[9px] font-bold uppercase tracking-wider mb-1 font-inter">
                        {new Date(match.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-white leading-none font-inter">
                        {new Date(match.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-bold uppercase tracking-widest rounded-[4px] border border-[#BFF367]/20 font-inter">
                          {match.shortId || 'KRZ-XXXX'}
                        </div>
                        <div className="flex items-center gap-2 text-[#878C9F] text-xs font-medium font-inter">
                          <Clock size={14} className="text-[#BFF367]" />
                          {match.time}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white group-hover:text-[#BFF367] transition-colors font-inter tracking-tight leading-tight">
                        {match.name || "Untitled Match"}
                      </h3>
                      
                      <div className="flex flex-wrap gap-6 text-[13px] text-[#878C9F] font-inter">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#BFF367]" />
                          {match.venue || "Global Arena"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-[#BFF367]" />
                          Live Status Ready
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col items-stretch gap-3">
                    <button 
                      onClick={() => window.open(`/scoring/${match._id}`, '_blank', 'noopener,noreferrer')}
                      className="px-6 py-2.5 bg-[#BFF367] text-black text-xs font-bold uppercase tracking-widest rounded-[6px] shadow-[var(--shadow-2)] hover:scale-[0.98] transition-all flex items-center justify-center gap-2 font-inter"
                    >
                      Open Console <Zap size={14} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => navigate(`/match/${match._id}`)}
                      className="px-6 py-2.5 bg-transparent hover:bg-[#BFF367]/10 text-[#999999] hover:text-[#BFF367] text-xs font-bold uppercase tracking-widest rounded-[6px] border border-[#2D2D2D] hover:border-[#BFF367]/30 transition-all flex items-center justify-center gap-2 font-inter"
                    >
                      Match Details <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COMPLETED RECORDS */}
      {completedMatches.length > 0 && (
        <section className="space-y-6 pt-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#555] font-inter">Scoring History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            {completedMatches.map((match) => (
              <div 
                key={match._id} 
                className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex justify-between items-center group hover:border-[#BFF367]/20 transition-all shadow-sm"
              >
                 <div className="space-y-1">
                   <h4 className="text-sm font-bold text-white uppercase font-inter tracking-tight group-hover:text-[#BFF367] transition-colors">{match.name}</h4>
                   <p className="text-[10px] text-[#878C9F] font-semibold uppercase tracking-widest font-inter">{new Date(match.date).toLocaleDateString()}</p>
                 </div>
                 <div className="flex items-center gap-2 text-[#BFF367]">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest font-inter">Verified</span>
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
