import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send, MessageCircle,
  Wallet, CreditCard, Award, Target, LogOut, Plus, Eye, TrendingUp, Mail, Phone, Ruler, LayoutGrid, CheckCircle2, UserPlus, BarChart, ExternalLink, Crown, Shield, BarChart3, Building2, AlertTriangle, Upload, Search, Medal, Users
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { login, logout, updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import useBookingHistory from "@hooks/useBookingHistory";
import useWriteReview from "@hooks/useWriteReview";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { TurfBookingHistory } from "@features/turf";
import TurfBookingHistorySkeleton from "@components/ui/TurfBookingHistorySkeleton";
import { StoryViewer } from "@features/networking";
import EditProfileModal from "@components/modals/EditProfileModal";

const PRI = "#BFF367"; // New primary lime accent matching the gradient vibrant stop
const SEC = "#55DEE8"; // Secondary cyan accent matching the gradient cool stop

// --- STYLE TOKENS ---
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif" };

const QuickStatCard = ({ icon: Icon, label, value, showDivider }) => (
  <div className={`flex-1 flex items-center justify-center gap-4 py-4 ${showDivider ? 'border-r border-white/10' : ''}`}>
    <div className="flex items-center justify-center">
      <Icon size={20} strokeWidth={2.5} stroke="url(#cyan-lime-gradient)" />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
      </div>
      <div className="text-2xl font-black bg-gradient-to-r from-[#55DEE8] to-[#BFF367] bg-clip-text text-transparent tracking-tighter leading-none">{value}</div>
    </div>
  </div>
);

const AchievementCard = ({ icon: Icon, title, rarity, year }) => {
  const rarityColors = {
    platinum: 'from-cyan-400 to-blue-400',
    gold: 'from-yellow-400 to-orange-400',
    silver: 'from-gray-300 to-gray-400',
  };
  return (
    <div className="group relative rounded-[15px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden">
      {/* Gradient Border Overlay - Only visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
      
      {/* Normal Border Overlay - Fades out on hover */}
      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px] animate-in" />

      {/* Card Content Wrapper */}
      <div className="relative bg-[#0d0d0d] rounded-[15px] p-4 h-full flex flex-col justify-between">
        <div className="relative">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarityColors[rarity]} p-[2px]`}>
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6" stroke="url(#cyan-lime-gradient)" />
            </div>
          </div>
          <h3 className="text-white text-center mb-1 line-clamp-2 min-h-[2.5rem] font-bold text-xs" style={HEADING_STYLE}>{title}</h3>
          <p className={`text-[9px] text-center bg-gradient-to-r ${rarityColors[rarity]} bg-clip-text text-transparent uppercase tracking-wider font-bold`}>
            {rarity} • {year}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, followingIds } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);
  const targetUserId = isOwnProfile ? currentUser?._id : userId;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);
  const { loading, bookings } = useBookingHistory();

  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("posts"); 
  const [userStories, setUserStories] = useState([]);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOwnProfile && currentUser) setProfileUser(currentUser);
  }, [currentUser, isOwnProfile]);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axiosInstance.get(`/api/user/players/${targetUserId}`);
        if (res.data.success) {
          setProfileUser(res.data.profile);
          if (isOwnProfile) dispatch(updateUser(res.data.profile));
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    if (targetUserId) fetchTargetProfile();
  }, [targetUserId, isOwnProfile, dispatch]);

  const handleFollowToggle = async () => {
    const isFollowing = followingIds.includes(targetUserId);
    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const response = await axiosInstance.post(`/api/user/players/${targetUserId}/${endpoint}`);
      if (response.data.success) {
        dispatch(isFollowing ? unfollowUser(targetUserId) : followUser(targetUserId));
        setProfileUser(prev => ({
          ...prev,
          followers: isFollowing 
            ? prev.followers.filter(id => id !== currentUser._id)
            : [...(prev.followers || []), currentUser._id]
        }));
        toast.success(`${isFollowing ? 'Unfollowed' : 'Following'} ${profileUser.name}`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
      toast.success("Signed out successfully!");
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profileUser?.name}'s Profile`,
        url: url
      }).catch(() => toast.error("Share failed"));
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const handleAvatarClick = async () => {
    if (!profileUser?.hasActiveStory && (!userStories || userStories.length === 0)) return;
    setInitialStoryIndex(0);
    try {
      const res = await axiosInstance.get(`/api/user/community/user-stories/${targetUserId}`);
      if (res.data.success && res.data.stories?.length > 0) {
        setViewingStoryGroup({ user: profileUser, stories: res.data.stories });
      }
    } catch (error) {
      toast.error("Failed to load stories");
    }
  };

  if (loadingProfile || (isOwnProfile && loading)) return <TurfBookingHistorySkeleton />;

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden">
      
      {/* ── Gradient SVG Definition for Lucide Icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="cyan-lime-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@100..900&display=swap');
      `}</style>

      <div className="relative">
        <div className="h-72 relative overflow-hidden rounded-b-[32px]">
          <img
            src={profileUser?.bannerImage || "https://images.unsplash.com/photo-1742610569389-687ba54287f3?q=80&w=2070&auto=format&fit=crop"}
            alt="Stadium Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative -mt-16 z-10">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="relative group shrink-0">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[4px] border-black bg-gradient-to-br from-[#55DEE8] to-[#BFF367] p-[2px] shadow-[0_0_35px_rgba(85,222,232,0.35)] overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                {profileUser?.profilePicture ? (
                  <img src={profileUser.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-zinc-900 text-[#BFF367] text-4xl font-black">
                    {profileUser?.name?.[0]}
                  </div>
                )}
              </div>
              
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-br from-[#55DEE8] to-[#BFF367] rounded-full border-[4px] border-black flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg z-20"
                >
                  <Edit2 size={16} strokeWidth={3} />
                </button>
              )}
            </div>

            <div className="pb-2 flex-1 space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase" style={HEADING_STYLE}>{profileUser?.name || "Player Name"}</h1>
                  <CheckCircle2 className="w-6 h-6 text-[#BFF367]" fill="currentColor" />
                </div>
                <p className="text-lg font-bold text-gray-400 uppercase tracking-tight" style={SUBHEADING_STYLE}>
                  {profileUser?.role || "Athlete"} • {profileUser?.interests?.[0] || "Sports"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#BFF367]">{profileUser?.followers?.length || 0}</span> Followers
                </span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <span className="text-[#BFF367]">{profileUser?.following?.length || 0}</span> Following
                </span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" stroke="url(#cyan-lime-gradient)" />
                  {profileUser?.city || "Manchester"}
                </span>
                <span className="px-3 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[9px]">
                  Online
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {isOwnProfile ? (
                  <>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(85,222,232,0.25)] flex items-center gap-2">
                      <UserPlus size={14} strokeWidth={3} />
                      Invite Player
                    </button>
                    <button onClick={handleShare} className="px-4 py-2.5 bg-white/5 text-white rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <ArrowRight size={14} />
                      Share
                    </button>
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${activeTab === 'overview' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black border-transparent shadow-[0_0_15px_rgba(85,222,232,0.3)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <LayoutGrid size={14} />
                      Overview
                    </button>
                    <button 
                      onClick={() => setActiveTab('posts')}
                      className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${activeTab === 'posts' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black border-transparent shadow-[0_0_15px_rgba(85,222,232,0.3)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <Plus size={14} />
                      Post
                    </button>
                    <button 
                      onClick={() => setActiveTab('stories')}
                      className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${activeTab === 'stories' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black border-transparent shadow-[0_0_15px_rgba(85,222,232,0.3)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <Camera size={14} />
                      Stories
                    </button>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${activeTab === 'activity' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black border-transparent shadow-[0_0_15px_rgba(85,222,232,0.3)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <Activity size={14} />
                      Activity
                    </button>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black border-transparent shadow-[0_0_15px_rgba(85,222,232,0.3)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <Calendar size={14} />
                      Bookings
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(85,222,232,0.25)] flex items-center gap-2">
                      <UserPlus size={14} strokeWidth={3} />
                      Invite Player
                    </button>
                    <button onClick={() => navigate(`/messages?userId=${targetUserId}`)} className="px-4 py-2.5 bg-white/5 text-white rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <MessageCircle size={14} />
                      Message
                    </button>
                    <button onClick={handleShare} className="px-4 py-2.5 bg-white/5 text-white rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <ArrowRight size={14} />
                      Share
                    </button>
                    <button onClick={() => gateInteraction(handleFollowToggle)} className={`px-4 py-2.5 rounded-[15px] font-black uppercase tracking-wider text-[11px] transition-all flex items-center gap-2 ${followingIds.includes(targetUserId) ? 'bg-white/10 text-white/40' : 'bg-white text-black hover:scale-105'}`}>
                      <Heart size={14} fill={followingIds.includes(targetUserId) ? "currentColor" : "none"} />
                      {followingIds.includes(targetUserId) ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] border border-white/10 mb-8 overflow-hidden">
          <div className="flex flex-wrap md:flex-nowrap divide-x divide-white/10">
            {[
              { label: "Matches Played", value: profileUser?.stats?.cricket?.matches || "120", icon: Calendar },
              { label: "Wins", value: "89", icon: Trophy },
              { label: "Goals", value: profileUser?.stats?.cricket?.runs || "67", icon: Target },
              { label: "Assists", value: "45", icon: Activity },
              { label: "Accuracy", value: "92%", icon: ShieldCheck },
              { label: "MVP Awards", value: "14", icon: Award },
            ].map((stat, idx, arr) => (
              <QuickStatCard key={idx} {...stat} showDivider={idx < arr.length - 1} />
            ))}
          </div>
        </div>

        {activeTab === 'posts' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Plus className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                User Posts
              </h2>
              {isOwnProfile && (
                <button className="px-4 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[15px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(85,222,232,0.2)]">
                  Create New Post
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Victory at the Arena', desc: 'Incredible match today! The team spirit was at an all-time high.', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070', likes: 24, comments: 5, date: '2h ago' },
                { title: 'Training Sessions', desc: 'Focusing on my agility and speed today. Getting ready.', img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2070', likes: 18, comments: 2, date: '1d ago' },
                { title: 'New Gear!', desc: 'Finally got the new Predator boots. The grip is insane.', img: 'https://images.unsplash.com/photo-1431324155629-1a6eda1eed2d?q=80&w=2070', likes: 42, comments: 12, date: '3d ago' },
                { title: 'Game Day', desc: 'Pre-match ritual. feeling focused and ready to win.', img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2070', likes: 56, comments: 8, date: '4d ago' },
              ].map((post, idx) => (
                <div key={idx} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] border border-white/10 overflow-hidden hover:border-[#55DEE8]/40 transition-all group">
                  <div className="h-40 relative overflow-hidden">
                    <img src={post.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-3 right-3 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-[15px] text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                      Post
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={profileUser?.profilePicture} className="w-5 h-5 rounded-full border border-[#BFF367]/40" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate flex-1">{profileUser?.name}</span>
                      <span className="text-[8px] text-gray-600 font-bold">{post.date}</span>
                    </div>
                    <h3 className="text-[11px] font-black text-white mb-1 uppercase tracking-tight truncate" style={HEADING_STYLE}>{post.title}</h3>
                    <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">{post.desc}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1 text-gray-500 hover:text-[#55DEE8] transition-colors">
                          <Heart size={12} />
                          <span className="text-[9px] font-bold">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-[#55DEE8] transition-colors">
                          <MessageSquare size={12} />
                          <span className="text-[9px] font-bold">{post.comments}</span>
                        </button>
                      </div>
                      <button className="text-gray-500 hover:text-white transition-colors">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Camera className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Recent Stories
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { title: 'Morning Grind', time: '2h ago', img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2070' },
                { title: 'Training Day', time: '5h ago', img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2070' },
                { title: 'Game Ready', time: '12h ago', img: 'https://images.unsplash.com/photo-1431324155629-1a6eda1eed2d?q=80&w=2070' },
              ].map((story, idx) => (
                <div key={idx} className="aspect-[9/16] relative rounded-[15px] overflow-hidden border border-white/10 group cursor-pointer hover:border-[#55DEE8]/50 transition-all">
                  <img src={story.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{story.title}</p>
                    <p className="text-[8px] font-bold text-[#BFF367] uppercase tracking-widest">{story.time}</p>
                  </div>
                </div>
              ))}
              {isOwnProfile && (
                <div className="aspect-[9/16] relative rounded-[15px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-[#55DEE8]/40 transition-all bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-[#55DEE8]/10 flex items-center justify-center text-[#55DEE8] group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Add Story</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
              <Activity className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
              Detailed Activity Feed
            </h2>
            <div className="space-y-4 max-w-4xl">
              {[
                { icon: Trophy, title: 'Tournament Victory', desc: 'Won the Elite Champions Trophy with Manchester United', time: 'Yesterday' },
                { icon: Star, title: 'High Performance', desc: 'Achieved 95% passing accuracy in the last match', time: '2 days ago' },
                { icon: MessageSquare, title: 'New Review', desc: 'Received a 5-star review for sportsmanship', time: '3 days ago' },
                { icon: Users, title: 'Team Collaboration', desc: 'Joined a new training session with Elite Athletes', time: '1 week ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-[15px] border border-white/10 hover:border-[#55DEE8]/30 transition-all group">
                  <div className="w-12 h-12 rounded-[15px] bg-[#55DEE8]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <activity.icon className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-black text-sm uppercase tracking-tight" style={HEADING_STYLE}>{activity.title}</h3>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{activity.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Calendar className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Your Bookings
              </h2>
            </div>
            
            <div className="space-y-4">
              {bookings && bookings.length > 0 ? (
                <TurfBookingHistory />
              ) : (
                <>
                  {[
                    { name: 'Elite Football Arena', date: '24 May 2024', time: '18:00 - 19:30', price: '₹1,200', status: 'Confirmed', sport: 'Football', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070' },
                    { name: 'Thunder Cricket Ground', date: '20 May 2024', time: '09:00 - 12:00', price: '₹2,500', status: 'Completed', sport: 'Cricket', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2070' },
                  ].map((mock, idx) => (
                    <div key={idx} className="group relative rounded-[15px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden">
                      {/* Gradient Border Overlay - Only visible on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
                      
                      {/* Normal Border Overlay - Fades out on hover */}
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px]" />

                      {/* Card Content Wrapper */}
                      <div className="relative bg-[#0d0d0d] rounded-[15px] p-4 flex flex-col md:flex-row gap-6 w-full">
                        <div className="w-full md:w-48 h-32 shrink-0 rounded-[15px] overflow-hidden bg-white/5">
                          <img src={mock.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-1.5 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded text-[8px] font-black uppercase tracking-widest border border-[#55DEE8]/20">{mock.sport}</span>
                              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">ID: #B{8402 + idx}</span>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2" style={HEADING_STYLE}>{mock.name}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={12} className="text-[#BFF367]" /> {mock.time}</div>
                              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#BFF367]" /> {mock.date}</div>
                              <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#BFF367]" /> Manchester</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <button className="px-3 py-1.5 rounded-[15px] bg-white/5 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-gradient-to-r hover:from-[#55DEE8] hover:to-[#BFF367] hover:text-black hover:border-transparent transition-all">View Pass</button>
                            <button className="px-3 py-1.5 rounded-[15px] bg-white/5 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Invoice</button>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between items-end py-1 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Paid</p>
                            <p className="text-xl font-black text-white">{mock.price}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-[15px] text-[8px] font-black uppercase tracking-widest border ${mock.status === 'Confirmed' ? 'text-[#55DEE8] bg-[#55DEE8]/10 border-[#55DEE8]/20' : 'text-gray-400 bg-white/5 border-white/10'}`}>
                            {mock.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Showing Sample Bookings UI</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <User className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: User, label: 'Full Name', value: profileUser?.name || 'Marcus James Anderson' },
                    { icon: Mail, label: 'Email', value: profileUser?.email || 'marcus.anderson@elitepro.com' },
                    { icon: Calendar, label: 'Age', value: '26 Years' },
                    { icon: Activity, label: 'Main Sport', value: profileUser?.interests?.[0] || 'Football' },
                    { icon: Activity, label: 'Secondary Sport', value: 'Futsal' },
                    { icon: Shield, label: 'Preferred Foot', value: 'Right' },
                    { icon: MapPin, label: 'Position', value: 'Striker / Forward' },
                    { icon: ShieldCheck, label: 'Current Team', value: 'Manchester United' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3.5 rounded-[15px] bg-black/40 border border-white/5 hover:border-[#55DEE8]/30 transition-all group">
                      <div className="w-9 h-9 rounded-[15px] bg-[#55DEE8]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <item.icon className="w-4 h-4" stroke="url(#cyan-lime-gradient)" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                        <p className="text-xs font-bold text-white tracking-tight truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <Activity className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {[
                    { icon: Trophy, title: 'Won Premier League Match', desc: 'Man Utd vs Chelsea (3-1)', time: '2 hours ago' },
                    { icon: Medal, title: 'Achievement Unlocked', desc: 'Scored hat-trick in match', time: '5 hours ago' },
                    { icon: Upload, title: 'Training Session Uploaded', desc: 'HIIT training completed', time: '1 day ago' },
                    { icon: Users, title: 'Joined Tournament', desc: 'UEFA Champions League', time: '2 days ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3.5 bg-black/40 rounded-[15px] border border-white/10 hover:border-[#55DEE8]/40 transition-all group">
                      <div className="w-9 h-9 rounded-[15px] bg-[#55DEE8]/10 flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_10px_rgba(85,222,232,0.15)] transition-all">
                        <activity.icon className="w-4 h-4" stroke="url(#cyan-lime-gradient)" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-[11px] mb-0.5" style={HEADING_STYLE}>{activity.title}</h3>
                        <p className="text-[10px] text-gray-500 mb-1.5">{activity.desc}</p>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <TrendingUp className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Performance Analytics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                  <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Skill Radar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={[
                      { stat: 'Speed', value: 92 }, { stat: 'Strength', value: 88 }, { stat: 'Agility', value: 95 },
                      { stat: 'Stamina', value: 90 }, { stat: 'Dribbling', value: 94 }, { stat: 'Passing', value: 87 },
                    ]}>
                      <defs>
                        <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#55DEE8" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#BFF367" stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="stat" tick={{ fill: '#888', fontSize: 10, fontWeight: '900' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar name="Performance" dataKey="value" stroke="url(#cyan-lime-gradient)" strokeWidth={2.5} fill="url(#radar-gradient)" fillOpacity={1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                  <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Monthly Performance</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={[
                      { month: 'Jan', perf: 85 }, { month: 'Feb', perf: 88 }, { month: 'Mar', perf: 90 },
                      { month: 'Apr', perf: 87 }, { month: 'May', perf: 92 }, { month: 'Jun', perf: 95 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold' }} axisLine={false} />
                      <YAxis domain={[80, 100]} tick={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="perf" stroke="url(#cyan-lime-gradient)" strokeWidth={3.5} dot={{ fill: '#BFF367', r: 4, strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Award className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Certificates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'UEFA Pro License', org: 'UEFA', date: 'March 2024', img: 'https://images.unsplash.com/photo-1547968483-0ea9e863caca?q=80&w=2070' },
                  { title: 'Sports Science', org: 'ISA', date: 'Jan 2024', img: 'https://images.unsplash.com/photo-1755039466834-3322b29dc45e?q=80&w=2070' },
                  { title: 'Elite Training', org: 'PL Academy', date: 'Nov 2023', img: 'https://images.unsplash.com/photo-1658504140972-7af3e80d35f1?q=80&w=2070' },
                ].map((cert, idx) => (
                  <div key={idx} className="group bg-black/40 rounded-[15px] overflow-hidden border border-white/10 hover:border-[#55DEE8]/30 transition-all">
                    <div className="h-32 overflow-hidden">
                      <img src={cert.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold text-xs mb-0.5 truncate" style={HEADING_STYLE}>{cert.title}</h3>
                      <p className="text-[10px] text-gray-500 mb-0.5">{cert.org}</p>
                      <p className="text-[9px] text-[#BFF367] font-bold uppercase tracking-widest">{cert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Trophy className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AchievementCard icon={Crown} title="National Champion" rarity="platinum" year="2024" />
                <AchievementCard icon={Trophy} title="MVP Winner" rarity="gold" year="2024" />
                <AchievementCard icon={Award} title="Best Striker" rarity="gold" year="2023" />
                <AchievementCard icon={Star} title="Golden Boot" rarity="gold" year="2023" />
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <BarChart3 className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                Career Summary
              </h2>
              
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10 mb-6">
                <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Career Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { icon: Calendar, label: 'Years Active', value: '12', color: '#BFF367' },
                    { icon: Target, label: 'Total Matches', value: '287', color: '#BFF367' },
                    { icon: Building2, label: 'Total Clubs', value: '4', color: '#BFF367' },
                    { icon: Zap, label: 'Total Goals', value: '145', color: '#BFF367' },
                    { icon: Users, label: 'Assists', value: '89', color: '#BFF367' },
                    { icon: Award, label: 'Tournaments', value: '18', color: '#BFF367' },
                    { icon: Medal, label: 'MOTM Awards', value: '34', color: '#BFF367' },
                    { icon: AlertTriangle, label: 'Red Cards', value: '2', color: '#ff4444' },
                    { icon: AlertTriangle, label: 'Yellow Cards', value: '23', color: '#ffaa00' },
                    { icon: BarChart3, label: 'Win Ratio', value: '69%', color: '#BFF367' },
                    { icon: Target, label: 'Pass Accuracy', value: '87%', color: '#BFF367' },
                    { icon: BarChart3, label: 'Season Goals', value: '28', color: '#BFF367' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-black/40 rounded-[15px] p-4 border border-white/5 hover:border-[#55DEE8]/40 transition-all group">
                      <div className="w-9 h-9 rounded-[15px] bg-[#55DEE8]/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <stat.icon className="w-4 h-4" stroke="url(#cyan-lime-gradient)" />
                      </div>
                      <p className="text-xl font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                  <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest" style={HEADING_STYLE}>
                    <Building2 className="w-4 h-4" stroke="url(#cyan-lime-gradient)" />
                    Previous Clubs
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Manchester United', years: '2022-Present', logo: '🔴' },
                      { name: 'Chelsea FC', years: '2019-2022', logo: '🔵' },
                      { name: 'Liverpool FC', years: '2016-2019', logo: '🔴' },
                      { name: 'Arsenal Youth', years: '2012-2016', logo: '🔴' },
                    ].map((club, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-[15px] bg-black/40 border border-white/5 hover:border-[#55DEE8]/30 transition-all">
                        <div className="w-10 h-10 rounded-[15px] bg-gradient-to-br from-[#55DEE8]/15 to-transparent flex items-center justify-center text-lg border border-white/5">
                          {club.logo}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white tracking-tight">{club.name}</p>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{club.years}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                  <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest" style={HEADING_STYLE}>
                    <Clock className="w-4 h-4" stroke="url(#cyan-lime-gradient)" />
                    Career Milestones
                  </h3>
                  <div className="space-y-2">
                    {[
                      { year: '2024', event: 'National Championship Winner' },
                      { year: '2023', event: 'Golden Boot Award' },
                      { year: '2022', event: 'Signed with Manchester United' },
                      { year: '2021', event: '100th Career Goal' },
                      { year: '2019', event: 'First International Cap' },
                    ].map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-[15px] bg-black/40 border border-white/5">
                        <div className="w-10 h-10 rounded-[15px] bg-[#55DEE8]/10 flex items-center justify-center flex-shrink-0 border border-[#55DEE8]/20">
                          <span className="text-[#BFF367] font-black text-[10px]">{m.year}</span>
                        </div>
                        <p className="text-white font-bold text-[10px] tracking-tight">{m.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <Calendar className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  Next Match
                </h2>
                <div className="bg-black/40 rounded-[15px] p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center space-y-1">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-3xl border border-red-500/30">🔴</div>
                      <p className="text-[9px] font-black text-white uppercase">Man Utd</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-[#BFF367] tracking-tighter mb-0.5 italic">VS</p>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Premier League</p>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl border border-blue-500/30">🔵</div>
                      <p className="text-[9px] font-black text-white uppercase">Chelsea</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {Object.entries(timeLeft).map(([unit, val]) => (
                      <div key={unit} className="bg-[#55DEE8]/10 rounded-[15px] p-3 text-center border border-[#55DEE8]/20">
                        <p className="text-xl font-black text-[#55DEE8] leading-none mb-0.5">{val}</p>
                        <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{unit}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black py-3 rounded-[15px] font-black uppercase tracking-wider text-[10px] hover:scale-[1.02] transition-all shadow-[0_5px_15px_rgba(85,222,232,0.2)]">
                    Watch Match Live
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] p-6 border border-white/10">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <UserPlus className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  Invite Players
                </h2>
                <div className="space-y-3">
                  {[
                    { name: 'James Rodriguez', pos: 'Midfielder', rat: 92, img: 'https://images.unsplash.com/photo-1663576748377-cafb47103042?q=80&w=2070' },
                    { name: 'David Silva', pos: 'Forward', rat: 89, img: 'https://images.unsplash.com/photo-1663576748367-4ff6bec25639?q=80&w=2070' },
                    { name: 'Chris Johnson', pos: 'Defender', rat: 85, img: 'https://images.unsplash.com/photo-1776416817016-f4b64cc132b1?q=80&w=2070' },
                  ].map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 bg-black/40 rounded-[15px] border border-white/10 hover:border-[#55DEE8]/40 transition-all group">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img src={player.img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold tracking-tight truncate text-[11px]" style={HEADING_STYLE}>{player.name}</h3>
                        <p className="text-[9px] text-gray-500 font-medium">{player.pos}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#55DEE8]/10 rounded-full border border-[#55DEE8]/20">
                        <Star size={10} stroke="url(#cyan-lime-gradient)" fill="url(#cyan-lime-gradient)" />
                        <span className="text-[#BFF367] font-black text-[9px]">{player.rat}</span>
                      </div>
                      <button className="p-2 bg-[#55DEE8]/10 text-[#55DEE8] rounded-[15px] hover:bg-[#55DEE8]/20 transition-all border border-[#55DEE8]/20">
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={currentUser} />
      {viewingStoryGroup && (
        <StoryViewer 
          storyGroup={viewingStoryGroup} 
          onClose={() => setViewingStoryGroup(null)} 
          onDelete={isOwnProfile ? (id) => toast.error("Delete logic not mapped") : null} 
          currentUser={currentUser} 
          initialIndex={initialStoryIndex} 
        />
      )}
    </div>
  );
}
