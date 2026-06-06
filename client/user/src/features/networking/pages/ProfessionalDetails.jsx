import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import cricketLoading from "../../../assets/cricket-loading.gif";
import { 
  MapPin, Star, Shield, Award, Loader2, Pencil,
  Building, Globe, Clock, Layout, BookOpen, Play, X, Eye, Tv, Layers, ShieldCheck, MessageSquare, Users, UserPlus, Heart, MessageCircle, Share2, ChevronLeft
} from "lucide-react";
import toast from "react-hot-toast";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };
const SECTION_HEADING_STYLE = { fontFamily: "\"Open Sans\", sans-serif" };

export default function ProfessionalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, role } = useSelector((/** @type {any} */ state) => state.auth);
  const [pro, setPro] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, exhibition, certificates, reviews

  // Follower states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Supporting data for locations
  const [grounds, setGrounds] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null); // Lightbox state
  const [activeCertificate, setActiveCertificate] = useState(null); // Certificate popup state
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  useEffect(() => {
    fetchProDetails();
    fetchGrounds();
  }, [id]);

  const fetchProDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/professional/details/${id}`);
      const { professional, reviews, followersCount, followingCount, isFollowing, posts } = res.data;

      // Safely parse JSON properties from DB if they are stored as strings or JSON arrays
      const parseField = (fieldVal) => {
        if (!fieldVal) return [];
        if (typeof fieldVal === "string") {
          try {
            return JSON.parse(fieldVal);
          } catch {
            return [fieldVal];
          }
        }
        return fieldVal;
      };

      const parsedCertifications = parseField(professional.certifications).map(cert => {
        if (typeof cert === "string") {
          try {
            return JSON.parse(cert);
          } catch {
            return { title: cert, description: "", image: null };
          }
        }
        return cert;
      });

      const parsedPortfolio = parseField(professional.portfolio).map(item => {
        if (typeof item === "string") {
          try {
            return JSON.parse(item);
          } catch {
            return { mediaType: "image", mediaUrl: item, title: "", description: "" };
          }
        }
        return item;
      });

      const parsedStructuredAchievements = parseField(professional.structuredAchievements).map(ach => {
        if (typeof ach === "string") {
          try {
            return JSON.parse(ach);
          } catch {
            return { title: ach, description: "" };
          }
        }
        return ach;
      });

      // Flatten nested user details to maintain maximum compatibility with JSX
      const mergedPro = {
        ...professional,
        name: professional.user?.name || professional.businessName || "",
        profilePicture: professional.user?.profilePicture,
        city: professional.user?.city,
        state: professional.user?.state,
        username: professional.user?.username,
        role: professional.user?.role,
        sportTypes: professional.user?.sportTypes,
        gameTypes: professional.user?.sportTypes || [],
        gender: professional.user?.gender,
        dob: professional.user?.dob,
        email: professional.user?.email,
        phone: professional.user?.phone,
        lastSeen: professional.user?.lastSeen,
        // Fields stored inside businessDetails JSON
        availabilityMode: professional.businessDetails?.availabilityMode || professional.availabilityMode,
        availabilityTimings: professional.businessDetails?.availabilityTimings || professional.availabilityTimings,
        preferredLocations: professional.businessDetails?.preferredLocations || { grounds: [], customLocations: [] },
        certifications: parsedCertifications,
        portfolio: parsedPortfolio,
        structuredAchievements: parsedStructuredAchievements,
        posts: posts || []
      };

      setPro(mergedPro);
      setReviews(reviews || []);
      setFollowersCount(followersCount || 0);
      setFollowingCount(followingCount || 0);
      setIsFollowing(isFollowing || false);
    } catch (error) {
      console.error("Error fetching professional details:", error);
      toast.error("Failed to load professional profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get("/api/user/turf/all");
      if (res.data && res.data.turfs) {
        setGrounds(res.data.turfs.map(t => ({
          id: t.id,
          name: t.name,
          city: t.city
        })));
      }
    } catch (err) {
      console.error("Error fetching grounds:", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please login to follow professionals.");
      return;
    }
    if (currentUser.id === pro.userId) {
      toast.error("You cannot follow yourself.");
      return;
    }

    // Optimistic Update
    const previousState = isFollowing;
    const previousCount = followersCount;

    setIsFollowing(!previousState);
    setFollowersCount(prev => previousState ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (previousState) {
        await axiosInstance.post(`/api/user/players/${pro.userId}/unfollow`);
      } else {
        await axiosInstance.post(`/api/user/players/${pro.userId}/follow`);
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(previousState);
      setFollowersCount(previousCount);
      console.error("Error toggling follow:", err);
      toast.error(err.response?.data?.message || "Failed to update follow status.");
    }
  };

  const renderConsistencyBadge = (count) => {
    let badge = null;
    if (count >= 500) badge = { label: "Supreme Master", desc: "Completed 500+ Bookings", color: "#FF007F", icon: "💎" };
    else if (count >= 200) badge = { label: "Elite Professional", desc: "Completed 200+ Bookings", color: "#B3DC26", icon: "⚡" };
    else if (count >= 100) badge = { label: "Master Scorer/Umpire", desc: "Completed 100+ Bookings", color: "#B3DC26", icon: "🏆" };
    else if (count >= 50) badge = { label: "Master Pro", desc: "Completed 50+ Bookings", color: "#B3DC26", icon: "🛡️" };
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
      <img src={cricketLoading} alt="Loading..." className="w-16 h-16 object-contain" />
    </div>
  );

  if (!pro) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
      <h2 className="text-white text-2xl font-bold mb-4">Professional Not Found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gradient-to-r from-[#B3DC26] to-[#B3DC26] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
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
    <div className="min-h-screen bg-black text-white pt-2 pb-20 px-0 font-sans selection:bg-[#B3DC26] selection:text-black">
      <div className="max-w-7xl mx-auto">
        {/* MERGED BANNER & PROFILE HEADER */}
        <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-white/5 bg-[#1A1A1A] shadow-2xl">

          {/* Back Navigation Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-30 p-2 md:p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-[8px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          {/* Background Image (Top Half) */}
          <div className="absolute top-0 left-0 right-0 h-[200px] md:h-[312px]">
            {pro.bannerUrl ? (
              <img src={pro.bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/[0.01] flex items-center justify-center opacity-30">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">BOOKMYSPORTZ PROFESSIONAL PARTNER</span>
              </div>
            )}
          </div>

          {/* Profile Content Overlay */}
          <div className="relative z-10 p-6 md:p-8 pt-[144px] md:pt-[240px]">
            
            {/* Top Row: Picture + Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Profile Image & Actions */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-[3px] border-[#B3DC26] shadow-[0_0_20px_rgba(191,243,103,0.15)]">
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {pro.profilePicture ? (
                        <img src={pro.profilePicture} alt={pro.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B3DC26] to-[#B3DC26] font-black text-4xl tracking-tighter">
                          {pro.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Green dot status */}
                  <div className="absolute bottom-1 right-2 w-7 h-7 bg-[#1A1A1A] rounded-full p-1.5 border border-black/50" title={pro.isOnline ? "Online" : "Offline"}>
                    <div className={`w-full h-full rounded-full ${pro.isOnline ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-neutral-600 shadow-none"}`}></div>
                  </div>
                  {/* Edit button — only on own profile */}
                  {currentUser?.ownerProfile?.id === id && (
                    <button
                      onClick={() => navigate(`/professional/${role?.toLowerCase()}/profile`)}
                      className="absolute top-0 right-0 w-8 h-8 bg-[#B3DC26] rounded-full flex items-center justify-center text-black shadow-lg border-2 border-[#1A1A1A] hover:scale-110 transition-transform cursor-pointer"
                      title="Edit Profile"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                    </button>
                  )}
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
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-[#B3DC26] text-xs md:text-sm font-sans font-bold">
                      @{pro.username || "not_specified"}
                    </p>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#B3DC26]/30 bg-black/50 text-[#B3DC26] text-[9px] font-black tracking-widest uppercase backdrop-blur-md">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 14a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13V5a2 2 0 012-2h4a2 2 0 012 2v8" /></svg>
                      {pro.role}
                    </span>
                  </div>
                  
                  {/* Followers and Following */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/90 font-sans font-bold mb-5">
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#B3DC26] transition-colors"><Users size={14} className="text-[#B3DC26]" /> {followersCount.toLocaleString()} Followers</span>
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#B3DC26] transition-colors"><UserPlus size={14} className="text-[#B3DC26]" /> {followingCount.toLocaleString()} Following</span>
                    
                    {/* Follow Button */}
                    <button 
                      onClick={handleFollowToggle}
                      disabled={currentUser?.id === pro.userId}
                      className={`ml-2 px-6 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-[14px] transition-all flex items-center justify-center gap-2 ${
                        isFollowing 
                          ? "bg-neutral-800 text-white border border-white/10 hover:bg-neutral-700" 
                          : currentUser?.id === pro.userId 
                            ? "bg-neutral-800 text-white/50 border border-white/10 cursor-not-allowed"
                            : "bg-white text-black hover:bg-neutral-200 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                      }`}
                    >
                      <UserPlus size={14} strokeWidth={2.5} /> {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-xs text-white/80 font-sans font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-white" /> {pro.city || "Not Specified"}{pro.state ? `, ${pro.state}` : ""}</span>
                  <span className="flex items-center gap-1.5"><Star size={14} className="fill-white text-white" /> {pro.rating > 0 ? pro.rating.toFixed(1) : "Not Specified"} ({pro.numReviews || 0} reviews)</span>
                  <span className="flex items-center gap-1.5"><Award size={14} className="text-white" /> {pro.experience ? (/^\d+$/.test(pro.experience.trim()) ? `${pro.experience.trim()} Years of Experience` : pro.experience) : "Not Specified"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Specialization + Bio */}
            <div className="mt-8 flex flex-col">
              {pro.specialization && (
                <div className="mb-4">
                  <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.15em] block mb-2">Specialization</span>
                  <div className="inline-flex max-w-full items-start gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm">
                    <svg className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-1-1m1 1v4m-4 0h8" /></svg>
                    <span className="text-xs font-semibold text-white/90 tracking-wide break-words whitespace-pre-wrap">{pro.specialization}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mt-1 w-full overflow-hidden">
                <div className="max-w-2xl">
                  <p className={`text-white/60 leading-relaxed text-xs font-sans break-words whitespace-pre-wrap ${!isBioExpanded ? 'line-clamp-4' : ''}`} style={SUBHEADING_STYLE}>
                    {pro.bio || "Not Specified"}
                  </p>
                  {pro.bio && pro.bio.length > 150 && (
                    <button 
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="mt-2 text-[#B3DC26] text-xs font-bold hover:underline transition-colors"
                    >
                      {isBioExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>

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
            <div className="flex overflow-x-auto bg-[#1A1A1A] p-1 rounded-xl border border-white/5 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "posts", label: "Posts", icon: MessageSquare },
                { id: "exhibition", label: "Gallery", icon: Layout },
                { id: "certificates", label: "Certificates", icon: ShieldCheck },
                { id: "reviews", label: "Reviews", icon: Star }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex-1 py-3 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      isSelected ? "bg-gradient-to-r from-[#B3DC26] to-[#B3DC26] text-black shadow-lg" : "text-neutral-500 hover:text-white"
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
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl">
                  <div className="space-y-5">
                    <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <Clock size={14} className="text-white" /> Schedule & Timings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 transition-all hover:bg-white/[0.04]">
                        <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold block mb-1.5">Engagement Mode</span>
                        <span className="font-bold text-sm text-white capitalize block tracking-tight">
                          {pro.availabilityMode ? (pro.availabilityMode === 'Both' ? 'Hybrid (Online & Physical)' : pro.availabilityMode === 'Offline' ? 'Physical Only' : pro.availabilityMode === 'Online' ? 'Remote Only' : pro.availabilityMode) : 'Not Specified'}
                        </span>
                      </div>
                      {pro.availabilityTimings && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 transition-all hover:bg-white/[0.04]">
                          <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold block mb-1.5">Operation Timings</span>
                          <span className="font-bold text-sm text-white block tracking-tight">{pro.availabilityTimings}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <Globe size={14} className="text-white" /> Languages & Communication
                    </h3>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {languagesList.map(lang => (
                        <span key={lang} className="px-3.5 py-1.5 rounded-full bg-[#B3DC26]/10 text-[#B3DC26] border border-[#B3DC26]/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B3DC26] opacity-80" />
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
                {((pro.role?.toLowerCase().includes("streamer")) || 
                  (pro.role?.toLowerCase().includes("commentator")) || 
                  (pro.role?.toLowerCase().includes("scorer")) || 
                  (pro.role?.toLowerCase().includes("umpire")) || 
                  (pro.matchesCovered || pro.matchFormats?.length > 0)) && (
                  <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                    <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <Layers size={14} className="text-white" /> Operational Specifications & Services
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
                                  <span key={fmt} className="px-2 py-0.5 bg-[#B3DC26]/10 text-[#B3DC26] text-[8px] font-black uppercase tracking-wider rounded border border-[#B3DC26]/20">{fmt}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Streamers Specification details */}
                      {pro.role?.toLowerCase().includes("streamer") && (
                        <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5"><Tv size={12} /> Live Broadcasting specs</p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Max Quality:</span>
                              <span className="font-bold text-white uppercase">{pro.streamQuality || "Not Specified"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Cameras Supported:</span>
                              <span className="font-bold text-white">{pro.camerasSupported != null ? `${pro.camerasSupported} Camera(s)` : "Not Specified"}</span>
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
                      {pro.role?.toLowerCase().includes("commentator") && (
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
                      {(pro.role?.toLowerCase().includes("scorer") || pro.role?.toLowerCase().includes("umpire")) && (
                        <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                          <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">Digital Scoring</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Live Kridaz App Scoring:</span>
                              <span className="font-bold text-[#B3DC26] uppercase">{pro.liveScoringSupport ? "🟢 Supported" : "🔴 Independent"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SERVICE AREAS & LOCATIONS */}
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl">
                  <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
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
                            <span className="font-bold text-[#B3DC26] uppercase tracking-wider block text-[9px]">{item.state}:</span>
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
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 space-y-6 shadow-xl min-h-[400px]">
                  <div className="border-b border-white/5 pb-4">
                    <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Layout size={14} className="text-white" /> Gallery
                    </h3>
                  </div>

                  {pro.portfolio?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                        <div className="w-12 h-12 rounded-full bg-[#B3DC26]/10 border border-[#B3DC26]/20 flex items-center justify-center text-[#B3DC26] shadow-lg group-hover:scale-110 transition-transform duration-300">
                                          <Play size={20} className="fill-white ml-0.5" />
                                        </div>
                                        <span className="text-[8px] font-black text-[#B3DC26] uppercase tracking-[0.25em]">Watch Showcase</span>
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

            {/* CERTIFICATES & ACHIEVEMENTS TAB */}
            {activeTab === "certificates" && (
               <div className="space-y-6 animate-in fade-in duration-300">
                {/* Verified Certifications Stack */}
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 shadow-xl">
                  <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Shield size={14} className="text-white" /> Verified Certifications Stack
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                    {pro.certifications?.length > 0 ? pro.certifications.map((cert, i) => (
                      <div key={i} className="rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all group overflow-hidden cursor-pointer" onClick={() => setActiveCertificate(cert)}>
                        {/* Certificate Image */}
                        <div className="aspect-[16/9] relative overflow-hidden bg-neutral-900 border-b border-white/5 flex items-center justify-center">
                          {cert.image ? (
                            <>
                              <img src={cert.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={cert.title} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                                <span className="text-[8px] font-black text-[#B3DC26] uppercase tracking-[0.25em] flex items-center gap-1.5">
                                  <Eye size={12} /> View Certificate
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <Shield className="text-neutral-700" size={32} />
                              <span className="text-[7px] font-black text-neutral-700 uppercase tracking-[0.3em]">No Image</span>
                            </div>
                          )}
                        </div>
                        {/* Certificate Info */}
                        <div className="p-4 space-y-2">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{cert.title}</h4>
                          <p className="text-[10px] text-white/50 leading-relaxed font-sans line-clamp-2">{cert.description}</p>
                          {cert.description && cert.description.length > 80 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveCertificate(cert); }}
                              className="text-[9px] font-black uppercase tracking-widest text-[#B3DC26] hover:text-[#B3DC26] transition-colors pt-0.5"
                            >
                              Read More →
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-14 bg-black/20 rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-3">
                        <Shield size={28} className="text-neutral-800" />
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">No verified certifications loaded yet</p>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 shadow-xl min-h-[400px]">
                  <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
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
                                <div className="flex items-center text-[#B3DC26] text-[8px] font-black mt-0.5">
                                  <Star size={10} className="fill-white mr-1 text-white" />
                                  {review.rating > 0 ? review.rating.toFixed(1) : "Not Specified"}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed font-sans pt-1">
                              {review.comment || "No comment provided."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* POSTS TAB */}
            {activeTab === "posts" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 p-8 shadow-xl min-h-[400px]">
                  <h3 style={SECTION_HEADING_STYLE} className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                    <MessageSquare size={14} className="text-white" /> Recent Posts & Updates
                  </h3>

                  {!pro.posts || pro.posts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-650">
                      <MessageSquare size={36} />
                      <span className="text-[8px] font-black uppercase tracking-[0.4em]">No posts published yet</span>
                    </div>
                  ) : (
                    <div className="space-y-6 font-sans">
                      {pro.posts.map((post) => (
                        <div key={post.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-900 overflow-hidden border border-[#B3DC26]/30">
                              <img src={pro.profilePicture} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="text-xs text-white font-bold capitalize block">{pro.name}</span>
                              <span className="text-[10px] text-white/50">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : "Recently"}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                            {post.content}
                          </p>
                          {post.mediaUrls && post.mediaUrls[0] && (
                            <div className="rounded-lg overflow-hidden border border-white/10 mt-2 max-h-64 flex justify-center bg-black/50">
                              <img src={post.mediaUrls[0]} className="w-full h-full object-cover opacity-90" />
                            </div>
                          )}
                          <div className="flex items-center gap-6 pt-3 border-t border-white/5 text-xs text-white/50">
                            <span className="flex items-center gap-1.5 text-neutral-400">
                              <Heart size={14} /> {post.likesCount || 0} Likes
                            </span>
                            <span className="flex items-center gap-1.5 text-neutral-400">
                              <MessageCircle size={14} /> {post.commentsCount || 0} Comments
                            </span>
                            <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
                              <Share2 size={14} /> Share
                            </button>
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
              <div className="bg-[#1A1A1A] rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
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
                    <span className="text-[#B3DC26] font-black">₹{pro.price > 0 ? pro.price : "Not Set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Professional Role:</span>
                    <span className="text-white font-bold capitalize">{pro.role}</span>
                  </div>

                </div>

                <button 
                  onClick={() => navigate(`/professionals?role=${pro.role}`)}
                  className="w-full bg-gradient-to-r from-[#B3DC26] to-[#B3DC26] text-black py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  ⚡ Request Matching Now
                </button>
              </div>

              
              {/* Connect & Socials Card */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
                <h3 style={SECTION_HEADING_STYLE} className="font-sans text-sm font-bold text-white uppercase tracking-wider">Connect & Socials</h3>
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
                  <button 
                    onClick={() => navigate(`/messages?userId=${pro.userId}`)}
                    className="ml-auto px-4 py-1.5 rounded-lg border border-[#B3DC26]/40 bg-[#B3DC26]/10 text-[#B3DC26] text-[10px] font-black uppercase tracking-wider hover:bg-[#B3DC26]/20 transition-all flex items-center gap-2"
                  >
                    <MessageSquare size={14} /> Chat Now
                  </button>
                  {(!pro.linkedin && !pro.instagram && !pro.youtube) && (
                    <p className="text-xs text-white/50 font-sans italic w-full mt-2">No social profiles linked.</p>
                  )}
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 shadow-lg">
                <h3 style={SECTION_HEADING_STYLE} className="font-sans text-sm font-bold text-white mb-6 uppercase tracking-wider">Recent Reviews</h3>
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
                            <div className="flex items-center text-[#B3DC26] text-[8px] font-bold">
                              <Star size={8} className="fill-white mr-0.5 text-white" />
                              {review.rating > 0 ? review.rating.toFixed(1) : "Not Specified"}
                            </div>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                            {review.comment || "No comment provided."}
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

      {/* Certificate Detail Popup Modal */}
      {activeCertificate && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={() => setActiveCertificate(null)}>
          <button 
            onClick={() => setActiveCertificate(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors outline-none z-10"
          >
            <X size={20} />
          </button>
          
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Certificate Image */}
            {activeCertificate.image && (
              <div className="w-full aspect-[16/10] bg-neutral-900 overflow-hidden rounded-t-2xl border-b border-white/5">
                <img src={activeCertificate.image} alt={activeCertificate.title} className="w-full h-full object-contain" />
              </div>
            )}
            
            {/* Certificate Details */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#B3DC26]/10 border border-[#B3DC26]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={18} className="text-[#B3DC26]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{activeCertificate.title}</h3>
                  <span className="text-[8px] font-black text-[#B3DC26] uppercase tracking-widest">Verified Certification</span>
                </div>
              </div>
              
              <div className="border-t border-white/5 pt-4">
                <p className="text-[11px] text-white/70 leading-relaxed font-sans whitespace-pre-wrap">{activeCertificate.description}</p>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveCertificate(null)}
                  className="px-5 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
