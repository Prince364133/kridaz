import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  MapPin, Star, Shield, Award, ChevronLeft, Loader2, User, Camera,
  Building, Globe, Clock, CheckCircle2, Layout, BookOpen, Play, X, Eye,
  Trophy, Tv, Layers, ShieldCheck, MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };
const SECTION_HEADING_STYLE = { fontFamily: "\"Open Sans\", sans-serif" };

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
      
      // HARDCODED DATA FOR DESIGNING WITHOUT BACKEND
      const dummyPro = {
        name: "Abhiram Sharma",
        profilePicture: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=2070&auto=format&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop",
        city: "Mumbai",
        state: "Maharashtra",
        rating: 4.8,
        numReviews: 124,
        experience: "8+ Years",
        bookingCount: 345,
        user: { role: "coach", profilePicture: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=2070&auto=format&fit=crop" },
        specialization: "Advanced Batting Techniques & Biomechanics",
        bio: "Former state-level player turned professional coach. Specializing in correcting batting techniques and mental conditioning for high-pressure matches. Certified by NCA.",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com",
        youtube: "https://youtube.com",
        gameTypes: ["Cricket", "Football"],
        availabilityMode: "Both",
        availabilityTimings: "Mon - Sat: 6 AM to 8 PM",
        languages: "English, Hindi, Marathi",
        matchesCovered: "150+",
        matchFormats: ["T20", "ODI", "Test"],
        streamQuality: "4K Ultra HD",
        camerasSupported: "3",
        streamPlatforms: ["YouTube", "Facebook"],
        liveCommentarySupported: true,
        panelDiscussionEnabled: true,
        liveScoringSupport: true,
        price: 800,
        isOnline: true,
        preferredLocations: {
          grounds: ["1"],
          customLocations: [{ state: "Maharashtra", cities: ["Mumbai", "Navi Mumbai", "Thane"] }]
        },
        portfolio: [
          { mediaType: "image", mediaUrl: "https://images.unsplash.com/photo-1518605368461-1ee12523dc10?q=80&w=1000&auto=format&fit=crop", title: "Training Camp 2023", description: "Annual summer coaching camp at MCA ground." },
          { mediaType: "video", mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Batting Masterclass", description: "A short guide on perfecting the cover drive." }
        ],
        certifications: [
          { title: "NCA Level 2 Coach", description: "Certified by National Cricket Academy", image: null },
          { title: "Sports Biomechanics Specialist", description: "Diploma in sports science and biomechanics.", image: null }
        ],
        structuredAchievements: [
          { title: "Best Coach Award 2022", description: "Awarded by Mumbai Cricket Association for outstanding contribution to youth development." },
          { title: "Mentored U-19 Captain", description: "Personal coach for the current state U-19 team captain." }
        ]
      };

      const dummyReviews = [
        { user: { name: "Rahul Deshmukh", profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop" }, rating: 5, comment: "Exceptional coaching! Improved my footwork drastically in just 3 sessions." },
        { user: { name: "Sneha Patil" }, rating: 4.5, comment: "Very professional and punctual. The video analysis sessions were incredibly helpful." }
      ];

      setPro(dummyPro);
      setReviews(dummyReviews);
    } catch (error) {
      console.error("Error setting hardcoded details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrounds = async () => {
    try {
      setGrounds([
        { id: "1", name: "MCA Stadium", city: "Mumbai" },
        { id: "2", name: "Oval Maidan", city: "Mumbai" }
      ]);
    } catch (err) {
      console.error("Error setting hardcoded grounds:", err);
    }
  };

  const renderConsistencyBadge = (count) => {
    let badge = null;
    if (count >= 500) badge = { label: "Supreme Master", desc: "Completed 500+ Bookings", color: "#FF007F", icon: "💎" };
    else if (count >= 200) badge = { label: "Elite Professional", desc: "Completed 200+ Bookings", color: "#BFF367", icon: "⚡" };
    else if (count >= 100) badge = { label: "Master Scorer/Umpire", desc: "Completed 100+ Bookings", color: "#BFF367", icon: "🏆" };
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
      <Loader2 className="animate-spin text-[#BFF367]" size={40} />
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
    <div className="min-h-screen bg-black text-white pt-12 pb-20 px-6 md:px-10 font-sans selection:bg-[#BFF367] selection:text-black">
      <div className="max-w-7xl mx-auto">
        {/* MERGED BANNER & PROFILE HEADER */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-white/5 bg-[#0a0a0c] shadow-2xl mt-4">


          {/* Background Image (Top Half) */}
          <div className="absolute top-0 left-0 right-0 h-[280px] md:h-[340px]">
            {pro.bannerUrl ? (
              <img src={pro.bannerUrl} alt="Cover Banner" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full bg-white/[0.01] flex items-center justify-center opacity-30">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">BOOKMYSPORTZ PROFESSIONAL PARTNER</span>
              </div>
            )}
            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/80 via-[#0a0a0c]/20 to-transparent" />
          </div>

          {/* Profile Content Overlay */}
          <div className="relative z-10 p-6 md:p-8 pt-[200px] md:pt-[240px]">
            
            {/* Top Row: Picture + Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Profile Image */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-[3px] border-[#BFF367] shadow-[0_0_20px_rgba(191,243,103,0.15)]">
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {pro.profilePicture ? (
                      <img src={pro.profilePicture} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] font-black text-4xl tracking-tighter">
                        {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                      </span>
                    )}
                  </div>
                </div>
                {/* Green dot status */}
                <div className="absolute bottom-1 right-2 w-7 h-7 bg-[#0a0a0c] rounded-full p-1.5 border border-black/50">
                  <div className="w-full h-full bg-[#22c55e] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full flex flex-col justify-end pt-2 md:pt-4">
                <div className="flex flex-col mb-3">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 style={{ fontFamily: "\"Open Sans\", sans-serif" }} className="text-2xl md:text-[34px] leading-tight font-black text-white tracking-tight">{pro.name}</h1>
                    <div className="w-5 h-5 bg-[#0066FF] rounded-full flex items-center justify-center text-white shadow-lg">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs md:text-sm font-sans font-medium">
                    Professional {pro.user?.role?.charAt(0).toUpperCase() + pro.user?.role?.slice(1)} • Elite Professional
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#BFF367]/30 bg-black/50 text-[#BFF367] text-[9px] font-black tracking-widest uppercase backdrop-blur-md">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 14a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13V5a2 2 0 012-2h4a2 2 0 012 2v8" /></svg>
                    PRO {pro.user?.role}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/40 bg-black/50 text-orange-400 text-[9px] font-black tracking-widest uppercase backdrop-blur-md">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    ELITE PROFESSIONAL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-xs text-white/80 font-sans font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-white" /> {pro.city || "Unspecified"}, {pro.state || ""}</span>
                  <span className="flex items-center gap-1.5"><Star size={14} className="fill-white text-white" /> {pro.rating?.toFixed(1) || "5.0"} ({pro.numReviews || 0} reviews)</span>
                  <span className="flex items-center gap-1.5"><Award size={14} className="text-white" /> {pro.experience || "5+ Years"} Experience</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Specialization + Bio */}
            <div className="mt-8 flex flex-col">
              {pro.specialization && (
                <div className="mb-4">
                  <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.15em] block mb-2">Specialization</span>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-full backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-1-1m1 1v4m-4 0h8" /></svg>
                    <span className="text-xs font-semibold text-white/90 tracking-wide">{pro.specialization}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mt-1">
                <p className="text-white/60 leading-relaxed text-xs font-sans max-w-2xl" style={SUBHEADING_STYLE}>
                  {pro.bio || "Providing high-quality professional services to elevate your sports experience. Certified and experienced in handling complex match scenarios."}
                </p>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Sport Tags */}
                  {pro.gameTypes?.map(sport => (
                    <div key={sport} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-sm ml-1">
                      {sport.toLowerCase() === 'cricket' ? (
                        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                      ) : (
                        <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path stroke="currentColor" strokeWidth="2" d="M12 2a10 10 0 000 20m0-20a10 10 0 010 20"/></svg>
                      )}
                      <span className="text-[10px] font-bold text-white/80">{sport}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Full Dossier Details */}
          <div className={activeTab === "overview" ? "lg:col-span-8 space-y-8" : "lg:col-span-12 space-y-8"}>

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
                      isSelected ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg" : "text-neutral-500 hover:text-white"
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
                    <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Clock size={14} className="text-white" /> Schedule & Timings
                    </h3>
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Engagement Mode</span>
                        <span className="font-bold uppercase text-white" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>
                          {pro.availabilityMode === 'Both' ? 'Hybrid (Online & Physical)' : pro.availabilityMode === 'Offline' ? 'Physical Only' : 'Remote Only'}
                        </span>
                      </div>
                      {pro.availabilityTimings && (
                        <div className="flex justify-between">
                          <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold">Operation Timings</span>
                          <span className="font-bold text-white uppercase" style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}>{pro.availabilityTimings}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Globe size={14} className="text-white" /> Languages & Communication
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
                    <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2 border-b border-white/5 pb-3">
                      <Layers size={14} className="text-white" /> Operational Specifications
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
                                  <span key={fmt} className="px-2 py-0.5 bg-[#BFF367]/10 text-[#BFF367] text-[8px] font-black uppercase tracking-wider rounded border border-[#BFF367]/20">{fmt}</span>
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
                              <span className="font-bold text-[#BFF367] uppercase">{pro.liveScoringSupport ? "🟢 Supported" : "🔴 Independent"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SERVICE AREAS & LOCATIONS */}
                <div className="bg-[#0a0a0c] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                  <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2">
                    <MapPin size={14} className="text-white" /> Service Area Coverage
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
                            <span className="font-bold text-[#BFF367] uppercase tracking-wider block text-[9px]">{item.state}:</span>
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
                    <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2">
                      <Layout size={14} className="text-white" /> Portfolio Exhibition Gallery
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
                                        <div className="w-12 h-12 rounded-full bg-[#BFF367]/10 border border-[#BFF367]/20 flex items-center justify-center text-[#BFF367] shadow-lg group-hover:scale-110 transition-transform duration-300">
                                          <Play size={20} className="fill-white ml-0.5" />
                                        </div>
                                        <span className="text-[8px] font-black text-[#BFF367] uppercase tracking-[0.25em]">Watch Showcase</span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#151515] transition-colors" onClick={() => setActiveMedia({ title: item.title, url: item.mediaUrl, type: 'video' })}>
                                      <Play size={24} className="text-white" />
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
                  <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] mb-6 flex items-center gap-2">
                    <Shield size={14} className="text-white" /> Verified Certifications Stack
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
                  <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-2 border-b border-white/5 pb-3">
                    <Trophy size={14} className="text-white" /> Career Milestones & Achievements
                  </h3>
                  
                  {/* Rich Structured Achievements */}
                  {pro.structuredAchievements?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pro.structuredAchievements.map((ach, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-all group">
                          <div className="w-10 h-10 rounded bg-[#BFF367]/10 border border-[#BFF367]/20 flex items-center justify-center shrink-0">
                            <Trophy size={18} className="text-white" />
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
                            <CheckCircle2 size={14} className="text-white mt-0.5 shrink-0" />
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
                  <h3 style={SECTION_HEADING_STYLE} className="font-heading text-xs font-black uppercase tracking-widest text-[#BFF367] mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                    <Star size={14} className="text-white fill-white" /> Customer Ratings & Reviews
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
                                  <Star size={10} className="fill-white mr-1 text-white" />
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
          {activeTab === "overview" && (
            <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Matchmaking Action Card */}
              <div className="bg-[#0a0a0c] rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 justify-between">
                  <h2 style={{ fontFamily: "\"Open Sans\", sans-serif" }} className="font-heading text-lg font-black uppercase text-white">Hire Professional</h2>
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

              
              {/* Connect & Socials Card */}
              <div className="bg-[#0a0a0c] rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
                <h3 style={SECTION_HEADING_STYLE} className="font-heading text-sm font-bold text-white uppercase tracking-wider">Connect & Socials</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Social Buttons */}
                  {pro.linkedin && (
                    <a href={pro.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#0077B5]/10 border border-[#0077B5]/30 flex items-center justify-center text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors backdrop-blur-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                  )}
                  {pro.instagram && (
                    <a href={pro.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/30 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors backdrop-blur-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {pro.youtube && (
                    <a href={pro.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors backdrop-blur-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </a>
                  )}
                  <button className="ml-auto px-4 py-1.5 rounded-lg border border-[#BFF367]/40 bg-[#BFF367]/10 text-[#BFF367] text-[10px] font-black uppercase tracking-wider hover:bg-[#BFF367]/20 transition-all flex items-center gap-2">
                    <MessageSquare size={14} /> Chat Now
                  </button>
                  {(!pro.linkedin && !pro.instagram && !pro.youtube) && (
                    <p className="text-xs text-white/50 font-sans italic w-full mt-2">No social profiles linked.</p>
                  )}
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-[#0a0a0c] rounded-xl p-6 border border-white/5 shadow-lg">
                <h3 style={SECTION_HEADING_STYLE} className="font-heading text-sm font-bold text-white mb-6 uppercase tracking-wider">Recent Reviews</h3>
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
                              <Star size={8} className="fill-white mr-0.5 text-white" />
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
          )}
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
