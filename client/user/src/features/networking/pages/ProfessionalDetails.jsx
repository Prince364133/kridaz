import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  MapPin, Star, Shield, Award, ChevronLeft, Loader2, User, Camera,
  Building, Globe, Clock, CheckCircle2, Layout, BookOpen, Play, X, Eye,
  Trophy, Tv, Layers, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

export default function ProfessionalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, exhibition, credentials, reviews
  
  // Supporting data for locations
  const [grounds, setGrounds] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null); // Lightbox state

  useEffect(() => {
    fetchProDetails();
    fetchGrounds();
  }, [id]);

  const fetchProDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/professional/details/${id}`);
      const prof = res.data.professional;

      // Safe details mapping including all new columns
      const mappedPro = {
        ...prof,
        name: prof.user?.name || prof.name || "Professional",
        profilePicture: prof.user?.profilePicture || null,
        city: prof.user?.city || prof.city || "",
        state: prof.user?.state || prof.state || "",
        gameTypes: prof.user?.sportTypes || prof.gameTypes || [],
        preferredLocations: prof.preferredLocations || prof.businessDetails?.preferredLocations || { grounds: [], customLocations: [] },
        availabilityMode: prof.availabilityMode || prof.businessDetails?.availabilityMode || "Both",
        availabilityTimings: prof.availabilityTimings || prof.businessDetails?.availabilityTimings || "",
        bannerUrl: prof.bannerUrl || null,
        instagram: prof.instagram || "",
        linkedin: prof.linkedin || "",
        youtube: prof.youtube || "",
        streamPlatforms: prof.streamPlatforms || [],
        matchesCovered: prof.matchesCovered || "",
        camerasSupported: prof.camerasSupported,
        streamQuality: prof.streamQuality || "",
        liveScoringSupport: prof.liveScoringSupport || false,
        matchFormats: prof.matchFormats || [],
        liveCommentarySupported: prof.liveCommentarySupported || false,
        panelDiscussionEnabled: prof.panelDiscussionEnabled || false,
        structuredAchievements: prof.structuredAchievements || [],
        portfolio: prof.portfolio || [],
        bookingCount: prof.user?.bookingCount || 0
      };

      setPro(mappedPro);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Error fetching professional details:", error);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get("/api/turf/all");
      setGrounds(res.data.turfs || res.data || []);
    } catch (err) {
      console.error("Error fetching grounds:", err);
    }
  };

  const renderConsistencyBadge = (count) => {
    let badge = null;
    if (count >= 500) badge = { label: "Supreme Master", desc: "Completed 500+ Bookings", color: "#FF007F", icon: "💎" };
    else if (count >= 200) badge = { label: "Elite Professional", desc: "Completed 200+ Bookings", color: "#BFF367", icon: "⚡" };
    else if (count >= 100) badge = { label: "Master Scorer/Umpire", desc: "Completed 100+ Bookings", color: "#55DEE8", icon: "🏆" };
    else if (count >= 50) badge = { label: "Master Pro", desc: "Completed 50+ Bookings", color: "#00C187", icon: "🛡️" };
    else if (count >= 10) badge = { label: "Consistent Associate", desc: "Completed 10+ Bookings", color: "#F59E0B", icon: "🟢" };

    if (!badge) return null;

    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xl transition-all duration-300 hover:scale-105"
        style={{ borderColor: `${badge.color}33`, backgroundColor: `${badge.color}11` }}
        title={badge.desc}
      >
        <span className="text-xs">{badge.icon}</span>
        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: badge.color }}>{badge.label}</span>
      </div>
    );
  };

  if (loading && !pro) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <Loader2 className="animate-spin text-[#55DEE8]" size={40} />
    </div>
  );

  if (!pro) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
      <h2 className="text-white text-2xl font-bold mb-4">Professional Not Found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
        Go Back
      </button>
    </div>
  );

  const achievementsList = pro.achievements ? pro.achievements.split("\n").filter(a => a) : [];
  const languagesList = pro.languages ? pro.languages.split(", ").filter(l => l) : [];

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-12 pb-20 px-6 md:px-10 font-sans selection:bg-[#55DEE8] selection:text-black">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white uppercase tracking-wider mb-8 transition-colors">
          <ChevronLeft size={16} /> Back to Directory
        </button>

        {/* Premium Widescreen Profile Cover Banner */}
        <div className="relative w-full h-48 md:h-80 rounded-2xl overflow-hidden mb-8 border border-white/5 bg-gradient-to-r from-neutral-950 to-neutral-900 shadow-2xl">
          {pro.bannerUrl ? (
            <img src={pro.bannerUrl} alt="Cover Banner" className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full bg-white/[0.01] flex items-center justify-center opacity-30">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">BOOKMYSPORTZ PROFESSIONAL PARTNER</span>
            </div>
          )}
          {/* Bottom shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Full Dossier Details */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Main Profile Info Card */}
            <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-6 md:p-10 relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="relative">
                  <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden p-0.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] shadow-xl">
                    <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
                      {pro.profilePicture ? (
                        <img 
                          src={pro.profilePicture} 
                          alt={pro.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-black text-4xl tracking-tighter">
                            {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-heading text-3xl md:text-4xl uppercase leading-none font-black text-white">{pro.name}</h1>
                    <span className="px-3 py-1 rounded-[8px] bg-[#55DEE8]/10 text-[#55DEE8] text-[9px] font-bold tracking-widest border border-[#55DEE8]/20 uppercase">
                      PRO {pro.user?.role}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 mb-2 font-sans">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#55DEE8]" /> {pro.city || "Unspecified"}, {pro.state || ""}</span>
                    <span className="flex items-center gap-1.5"><Star size={14} className="fill-[#BFF367] text-[#BFF367]" /> {pro.rating?.toFixed(1) || "5.0"} ({pro.numReviews || 0} reviews)</span>
                    <span className="flex items-center gap-1.5"><Award size={14} className="text-[#55DEE8]" /> {pro.experience || "5+ Years"} exp</span>
                  </div>

                  {/* Consistency Badges Showcase */}
                  {pro.bookingCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {renderConsistencyBadge(pro.bookingCount)}
                    </div>
                  )}

                  {pro.specialization && (
                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg inline-block">
                      <span className="text-[8px] font-black text-[#55DEE8] uppercase tracking-[0.2em] block mb-0.5">Headline Specialization</span>
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">{pro.specialization}</p>
                    </div>
                  )}

                  <p className="text-white/75 leading-relaxed text-xs font-sans" style={SUBHEADING_STYLE}>
                    {pro.bio || "Providing high-quality professional services to elevate your sports experience. Certified and experienced in handling complex match scenarios."}
                  </p>

                  {/* Social Buttons */}
                  {(pro.instagram || pro.linkedin || pro.youtube) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {pro.linkedin && (
                        <a 
                          href={pro.linkedin} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077B5]/10 border border-[#0077B5]/20 hover:border-[#0077B5]/50 rounded-[6px] text-[8px] font-black uppercase tracking-wider text-[#0077B5] transition-all hover:scale-105"
                        >
                          LinkedIn
                        </a>
                      )}
                      {pro.instagram && (
                        <a 
                          href={pro.instagram} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E1306C]/10 border border-[#E1306C]/20 hover:border-[#E1306C]/50 rounded-[6px] text-[8px] font-black uppercase tracking-wider text-[#E1306C] transition-all hover:scale-105"
                        >
                          Instagram
                        </a>
                      )}
                      {pro.youtube && (
                        <a 
                          href={pro.youtube} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000]/10 border border-[#FF0000]/20 hover:border-[#FF0000]/50 rounded-[6px] text-[8px] font-black uppercase tracking-wider text-[#FF0000] transition-all hover:scale-105"
                        >
                          YouTube
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {pro.gameTypes?.map(sport => (
                      <span key={sport} className="px-2.5 py-1 bg-neutral-900 border border-white/5 rounded-lg text-[8px] font-black tracking-widest text-white/80 uppercase">
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-FIDELITY GLASSMORPHIC TAB MENU */}
            <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-white/5 shadow-xl">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "exhibition", label: "Showcase Gallery", icon: Layout },
                { id: "credentials", label: "Credentials & Milestones", icon: ShieldCheck },
                { id: "reviews", label: "Customer Reviews", icon: Star }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${
                      isSelected ? "bg-[#55DEE8] text-black shadow-lg" : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    <Icon size={12} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANELS */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Availability, Timeline & General Info */}
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl">
                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Clock size={14} /> Schedule & Timings
                    </h3>
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Engagement Mode</span>
                        <span className="font-bold uppercase text-white">
                          {pro.availabilityMode === 'Both' ? 'Hybrid (Online & Physical)' : pro.availabilityMode === 'Offline' ? 'Physical Only' : 'Remote Only'}
                        </span>
                      </div>
                      {pro.availabilityTimings && (
                        <div className="flex justify-between">
                          <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Operation Timings</span>
                          <span className="font-bold text-white uppercase">{pro.availabilityTimings}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Globe size={14} /> Languages & Communication
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {languagesList.map(lang => (
                        <span key={lang} className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/5 text-[9px] font-black uppercase tracking-wider">
                          {lang}
                        </span>
                      ))}
                      {languagesList.length === 0 && (
                        <p className="text-xs text-white/40 italic">No specific languages logged.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role-conditioned specific specs */}
                {((pro.user?.role?.toLowerCase().includes("streamer")) || 
                  (pro.user?.role?.toLowerCase().includes("commentator")) || 
                  (pro.user?.role?.toLowerCase().includes("scorer")) || 
                  (pro.user?.role?.toLowerCase().includes("umpire")) || 
                  (pro.matchesCovered || pro.matchFormats?.length > 0)) && (
                  <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                    <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Layers size={14} /> Operational Specifications
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Metric Badges */}
                      {(pro.matchesCovered || pro.matchFormats?.length > 0) && (
                        <div className="space-y-4 bg-black/40 border border-white/5 rounded-lg p-5">
                          {pro.matchesCovered && (
                            <div>
                              <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Total Matches Covered</span>
                              <span className="text-base font-black text-white uppercase tracking-tight">{pro.matchesCovered}</span>
                            </div>
                          )}
                          {pro.matchFormats?.length > 0 && (
                            <div>
                              <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">Match Formats Supported</span>
                              <div className="flex flex-wrap gap-1">
                                {pro.matchFormats.map(fmt => (
                                  <span key={fmt} className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] text-[8px] font-black uppercase tracking-wider rounded border border-[#55DEE8]/20">{fmt}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Streamers Specification details */}
                      {pro.user?.role?.toLowerCase().includes("streamer") && (
                        <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5"><Tv size={12} /> Live Broadcasting specs</p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Max Quality:</span>
                              <span className="font-bold text-white uppercase">{pro.streamQuality || "1080p Full HD"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Cameras Supported:</span>
                              <span className="font-bold text-white">{pro.camerasSupported || "1"} Camera(s)</span>
                            </div>
                          </div>
                          {pro.streamPlatforms?.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                              <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">Stream Platforms</span>
                              <div className="flex flex-wrap gap-1">
                                {pro.streamPlatforms.map(sp => (
                                  <span key={sp} className="px-2 py-0.5 bg-neutral-900 border border-white/5 text-[8px] font-bold uppercase rounded">{sp}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Commentator Specification details */}
                      {pro.user?.role?.toLowerCase().includes("commentator") && (
                        <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">Broadcast Features</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Live Commentary Support:</span>
                              <span className="font-bold text-white uppercase">{pro.liveCommentarySupported ? "🟢 Enabled" : "🔴 Disabled"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Panel Discussion Support:</span>
                              <span className="font-bold text-white uppercase">{pro.panelDiscussionEnabled ? "🟢 Enabled" : "🔴 Disabled"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scorer / Umpire Specification details */}
                      {(pro.user?.role?.toLowerCase().includes("scorer") || pro.user?.role?.toLowerCase().includes("umpire")) && (
                        <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">Digital Scoring</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Live Kridaz App Scoring:</span>
                              <span className="font-bold text-[#55DEE8] uppercase">{pro.liveScoringSupport ? "🟢 Supported" : "🔴 Independent"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SERVICE AREAS & LOCATIONS */}
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                  <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2">
                    <MapPin size={14} /> Service Area Coverage
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Platform Venues */}
                    <div className="bg-black/30 border border-white/5 rounded-lg p-5 space-y-3">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Building size={12} /> Active Platform Grounds
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {pro.preferredLocations?.grounds?.map(groundId => {
                          const gObj = grounds.find(g => g.id === groundId);
                          if (!gObj) return null;
                          return (
                            <span key={groundId} className="px-2.5 py-1 bg-[#111] border border-white/5 rounded text-[8px] font-black uppercase tracking-wider text-white">
                              {gObj.name} ({gObj.city})
                            </span>
                          );
                        })}
                        {(!pro.preferredLocations?.grounds || pro.preferredLocations.grounds.length === 0) && (
                          <p className="text-xs text-white/30 italic">No specific active turf linked.</p>
                        )}
                      </div>
                    </div>

                    {/* Custom Cities */}
                    <div className="bg-black/30 border border-white/5 rounded-lg p-5 space-y-3">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Globe size={12} /> Covered Cities & States
                      </p>
                      <div className="space-y-3">
                        {pro.preferredLocations?.customLocations?.map((item, idx) => (
                          <div key={idx} className="text-xs font-sans">
                            <span className="font-bold text-[#55DEE8] uppercase tracking-wider block text-[9px]">{item.state}:</span>
                            <span className="text-white/60 leading-normal">{item.cities.join(", ")}</span>
                          </div>
                        ))}
                        {(!pro.preferredLocations?.customLocations || pro.preferredLocations.customLocations.length === 0) && (
                          <p className="text-xs text-white/30 italic">No custom city boundaries configured.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXHIBITION & GALLERY TAB */}
            {activeTab === "exhibition" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl min-h-[400px]">
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2">
                      <Layout size={14} /> Portfolio Exhibition Gallery
                    </h3>
                  </div>

                  {pro.portfolio?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {pro.portfolio.map((item, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden group hover:border-white/10 transition-all">
                          <div className="aspect-video relative overflow-hidden bg-neutral-900 border-b border-white/5 flex items-center justify-center">
                            {item.mediaType === 'image' ? (
                              <>
                                <img src={item.mediaUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <button 
                                  onClick={() => setActiveMedia({ title: item.title, url: item.mediaUrl })}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                  <Eye size={18} />
                                </button>
                              </>
                            ) : (
                              (() => {
                                const ytId = getYouTubeId(item.mediaUrl);
                                if (ytId) {
                                  return (
                                    <div className="w-full h-full relative group cursor-pointer" onClick={() => setActiveMedia({ title: item.title, url: item.mediaUrl, type: 'video' })}>
                                      <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105" />
                                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 group-hover:bg-black/60 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center text-[#55DEE8] shadow-lg group-hover:scale-110 transition-transform duration-300">
                                          <Play size={20} className="fill-[#55DEE8] ml-0.5" />
                                        </div>
                                        <span className="text-[8px] font-black text-[#55DEE8] uppercase tracking-[0.25em]">Watch Showcase</span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#151515] transition-colors" onClick={() => setActiveMedia({ title: item.title, url: item.mediaUrl, type: 'video' })}>
                                      <Play size={24} className="text-[#55DEE8]" />
                                      <span className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.3em]">Motion Media</span>
                                    </div>
                                  );
                                }
                              })()
                            )}
                          </div>
                          <div className="p-3.5 space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{item.title}</h4>
                            <p className="text-[9px] text-neutral-500 font-medium leading-relaxed line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-600">
                      <Layout size={36} />
                      <span className="text-[8px] font-black uppercase tracking-[0.4em]">No media portfolio showcases uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CREDENTIALS & ACHIEVEMENTS TAB */}
            {activeTab === "credentials" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Verified Certifications Stack */}
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 shadow-xl">
                  <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] mb-6 flex items-center gap-2">
                    <Shield size={14} /> Verified Certifications Stack
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pro.certifications?.length > 0 ? pro.certifications.map((cert, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-all group relative">
                        <div className="w-16 h-16 rounded overflow-hidden bg-neutral-900 border border-white/5 shrink-0 relative flex items-center justify-center">
                          {cert.image ? (
                            <>
                              <img src={cert.image} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setActiveMedia({ title: cert.title, url: cert.image })}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                              >
                                <Eye size={16} />
                              </button>
                            </>
                          ) : (
                            <Shield className="text-neutral-800" size={24} />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{cert.title}</h4>
                          <p className="text-[10px] text-white/50 leading-relaxed font-sans line-clamp-3">{cert.description}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-10 bg-black/20 rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-2">
                        <Shield size={24} className="text-neutral-800" />
                        <p className="text-xs text-white/40 italic font-sans">No verified certifications loaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Structured Career Achievements & Milestones */}
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                  <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] flex items-center gap-2 border-b border-white/5 pb-3">
                    <Trophy size={14} /> Career Milestones & Achievements
                  </h3>
                  
                  {/* Rich Structured Achievements */}
                  {pro.structuredAchievements?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pro.structuredAchievements.map((ach, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-all group">
                          <div className="w-10 h-10 rounded bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center shrink-0">
                            <Trophy size={18} className="text-[#55DEE8]" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{ach.title}</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed font-sans">{ach.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Standard text achievements for backwards-compatibility */}
                  {achievementsList.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Registered Milestones</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {achievementsList.map((ach, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-white/[0.02] border border-white/5 rounded-lg">
                            <CheckCircle2 size={14} className="text-[#55DEE8] mt-0.5 shrink-0" />
                            <span className="text-[10px] text-white/80 font-black uppercase tracking-tight leading-snug">{ach}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!pro.structuredAchievements || pro.structuredAchievements.length === 0) && achievementsList.length === 0 && (
                    <div className="py-10 bg-black/20 rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-2">
                      <Trophy size={24} className="text-neutral-800" />
                      <p className="text-xs text-white/40 italic font-sans">No achievements registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 shadow-xl min-h-[400px]">
                  <h3 className="font-heading text-xs font-black uppercase tracking-widest text-[#55DEE8] mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                    <Star size={14} /> Customer Ratings & Reviews
                  </h3>

                  {reviews.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-650">
                      <Star size={36} />
                      <span className="text-[8px] font-black uppercase tracking-[0.4em]">No customer ratings recorded yet</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      {reviews.map((review, i) => (
                        <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-900 overflow-hidden shrink-0 border border-white/5">
                                {review.user?.profilePicture ? (
                                  <img src={review.user.profilePicture} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/30 text-[11px] font-black uppercase">
                                    {review.user?.name?.slice(0, 2) || "?"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="text-[10px] text-white/70 font-bold capitalize block">{review.user?.name?.toLowerCase()}</span>
                                <div className="flex items-center text-[#BFF367] text-[8px] font-black mt-0.5">
                                  <Star size={10} className="fill-[#BFF367] mr-1 text-[#BFF367]" />
                                  {review.rating?.toFixed(1) || "5.0"}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed font-sans pt-1">
                              {review.comment || "Loved the experience!"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Matchmaking CTA Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Matchmaking Action Card */}
              <div className="bg-[#0a0a0c] rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 justify-between">
                  <h2 className="font-heading text-lg font-black uppercase text-white">Hire Professional</h2>
                  <span className={`px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider ${
                    pro.isOnline 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {pro.isOnline ? "🟢 Online" : "🔴 Offline"}
                  </span>
                </div>

                <p className="text-xs text-white/50 leading-relaxed font-sans">
                  BookMySportz professionals are hired through our live, on-demand matchmaking search. This matches you with the nearest active verified professional in real-time.
                </p>

                <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-sans text-xs space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/40">Hourly/Match Rate:</span>
                    <span className="text-[#BFF367] font-black">₹{pro.price || "500"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Professional Role:</span>
                    <span className="text-white font-bold capitalize">{pro.user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Service Radius:</span>
                    <span className="text-white font-bold">15 km</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/professionals?role=${pro.user?.role}`)}
                  className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  ⚡ Request Matching Now
                </button>
              </div>

              {/* Reviews Card */}
              <div className="bg-[#0a0a0c] rounded-xl p-6 border border-white/5 shadow-lg">
                <h3 className="font-heading text-sm font-bold text-white mb-6 uppercase tracking-wider">Recent Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-xs text-white/40 pb-2 font-sans italic">No reviews yet.</p>
                ) : (
                  <div className="space-y-6 font-sans">
                    {reviews.slice(0, 4).map((review, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 overflow-hidden shrink-0 border border-white/5">
                          {review.user?.profilePicture ? (
                            <img src={review.user.profilePicture} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/30 text-[10px] font-bold uppercase">
                              {review.user?.name?.slice(0,2) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1 justify-between">
                            <span className="text-[10px] text-white/70 font-bold capitalize">{review.user?.name?.toLowerCase()}</span>
                            <div className="flex items-center text-[#BFF367] text-[8px] font-bold">
                              <Star size={8} className="fill-[#BFF367] mr-0.5" />
                              {review.rating || "5.0"}
                            </div>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                            {review.comment || "Loved the experience!"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Premium Lightbox Media Modal */}
      {activeMedia && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveMedia(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors outline-none"
          >
            <X size={20} />
          </button>
          
          <div className="max-w-4xl w-full max-h-[80vh] flex items-center justify-center p-2">
            {activeMedia.type === 'video' ? (
              (() => {
                const ytId = getYouTubeId(activeMedia.url);
                if (ytId) {
                  return (
                    <div className="w-full aspect-video max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-black">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} 
                        title={activeMedia.title} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      />
                    </div>
                  );
                } else {
                  return (
                    <video 
                      src={activeMedia.url} 
                      controls 
                      autoPlay
                      className="max-w-full max-h-[75vh] rounded-lg shadow-2xl border border-white/5 outline-none" 
                    />
                  );
                }
              })()
            ) : (
              <img 
                src={activeMedia.url} 
                alt={activeMedia.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/5" 
              />
            )}
          </div>
          <p className="text-white text-sm font-bold uppercase tracking-widest mt-4 text-center max-w-xl">{activeMedia.title}</p>
        </div>
      )}

    </div>
  );
}
