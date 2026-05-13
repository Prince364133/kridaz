import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send, MessageCircle,
  Wallet, CreditCard, Award, Target, LogOut, Plus, Eye, TrendingUp, Mail, Phone, Ruler, LayoutGrid, CheckCircle2, UserPlus, BarChart, ExternalLink, Crown, Shield, BarChart3, Building2, AlertTriangle, Upload, Search, Medal, Users, X, Image as ImageIcon
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { login, logout, updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "../hooks/useWriteReview";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import TurfBookingHistorySkeleton from "../components/ui/TurfBookingHistorySkeleton";
import StoryViewer from "../components/StoryViewer";
import EditProfileModal from "../components/modals/EditProfileModal";

const PRI = "#00ff41";

// --- STYLE TOKENS ---
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif", fontSize: "20px" };

const QuickStatCard = ({ icon: Icon, label, value, showDivider }) => (
  <div className={`flex-1 flex items-center justify-center gap-4 py-4 ${showDivider ? 'border-r border-white/10' : ''}`}>
    <div className="text-[#00ff41]">
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
      </div>
      <div className="text-2xl font-black text-white tracking-tighter leading-none">{value}</div>
    </div>
  </div>
);

const AchievementCard = ({ icon: Icon, title, rarity, year }) => {
  const rarityColors = {
    platinum: 'from-cyan-400 to-blue-400',
    gold: 'from-yellow-400 to-orange-400',
    silver: 'from-gray-300 to-gray-400',
  };
  const rarityGlow = {
    platinum: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    gold: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]',
    silver: 'shadow-[0_0_30px_rgba(209,213,219,0.3)]',
  };
  return (
    <div className={`group relative bg-black/40 rounded-xl p-4 border border-white/10 hover:border-transparent transition-all ${rarityGlow[rarity]} hover:scale-105 cursor-pointer`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[rarity]} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`}></div>
      <div className="relative">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarityColors[rarity]} p-[2px]`}>
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#00ff41]" />
          </div>
        </div>
        <h3 className="text-white text-center mb-1 line-clamp-2 min-h-[2.5rem] font-bold text-xs" style={HEADING_STYLE}>{title}</h3>
        <p className={`text-[9px] text-center bg-gradient-to-r ${rarityColors[rarity]} bg-clip-text text-transparent uppercase tracking-wider font-bold`}>
          {rarity} • {year}
        </p>
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
  const [activeTab, setActiveTab] = useState("overview"); 
  const [showPostForm, setShowPostForm] = useState(false);
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
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[4px] border-black bg-gradient-to-br from-[#00ff41]/20 to-transparent p-1 shadow-[0_0_30px_rgba(0,255,65,0.3)] overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                {profileUser?.profilePicture ? (
                  <img src={profileUser.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-zinc-900 text-[#00ff41] text-4xl font-black">
                    {profileUser?.name?.[0]}
                  </div>
                )}
              </div>
              
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-[#00ff41] rounded-full border-[4px] border-black flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg z-20"
                >
                  <Edit2 size={16} strokeWidth={3} />
                </button>
              )}
            </div>

            <div className="pb-2 flex-1 space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase" style={HEADING_STYLE}>{profileUser?.name || "Player Name"}</h1>
                  <CheckCircle2 className="w-6 h-6 text-[#00ff41]" fill="currentColor" />
                </div>
                <p className="text-lg font-bold text-gray-400 uppercase tracking-tight" style={SUBHEADING_STYLE}>
                  {profileUser?.role || "Athlete"} • {profileUser?.interests?.[0] || "Sports"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff41]">{profileUser?.followers?.length || 0}</span> Followers
                </span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <span className="text-[#00ff41]">{profileUser?.following?.length || 0}</span> Following
                </span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00ff41]" />
                  {profileUser?.city || "Manchester"}
                </span>
                <span className="px-3 py-0.5 bg-[#00ff41]/10 text-[#00ff41] rounded-full border border-[#00ff41]/20 text-[9px]">
                  Online
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {isOwnProfile ? (
                  <>
                    <button className="px-5 py-2.5 bg-[#00ff41] text-black rounded-xl font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(0,255,65,0.2)] flex items-center gap-2">
                      <UserPlus size={14} strokeWidth={3} />
                      Invite Player
                    </button>
                    <button onClick={handleShare} className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <ArrowRight size={14} />
                      Share
                    </button>
                    <button onClick={() => navigate('/messages')} className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <MessageCircle size={14} />
                      Messages
                    </button>
                    <button 
                      onClick={() => setShowPostForm(!showPostForm)}
                      className={`px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all backdrop-blur-md border flex items-center gap-2 ${showPostForm ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                      <Plus size={14} />
                      Post
                    </button>
                    <button className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <Camera size={14} />
                      Stories
                    </button>
                    <button className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <Activity size={14} />
                      Activity
                    </button>
                    <button className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <Calendar size={14} />
                      Bookings
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-5 py-2.5 bg-[#00ff41] text-black rounded-xl font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(0,255,65,0.2)] flex items-center gap-2">
                      <UserPlus size={14} strokeWidth={3} />
                      Invite Player
                    </button>
                    <button onClick={() => navigate(`/messages?userId=${targetUserId}`)} className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <MessageCircle size={14} />
                      Message
                    </button>
                    <button onClick={handleShare} className="px-4 py-2.5 bg-white/5 text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <ArrowRight size={14} />
                      Share
                    </button>
                    <button onClick={() => gateInteraction(handleFollowToggle)} className={`px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all flex items-center gap-2 ${followingIds.includes(targetUserId) ? 'bg-white/10 text-white/40' : 'bg-white text-black hover:scale-105'}`}>
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
        {showPostForm && (
          <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-md rounded-2xl border border-[#00ff41]/20 mb-8 overflow-hidden animate-in slide-in-from-top duration-500">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                <Plus className="w-5 h-5 text-[#00ff41]" />
                Share Your Update
              </h2>
              <button 
                onClick={() => setShowPostForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                  {profileUser?.profilePicture ? (
                    <img src={profileUser.profilePicture} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[#00ff41]" />
                  )}
                </div>
                <textarea 
                  placeholder="What's happening on the field?"
                  className="w-full bg-black/40 border border-white/5 focus:border-[#00ff41]/50 rounded-xl p-4 text-white text-sm outline-none transition-all resize-none min-h-[120px]"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-[#00ff41] transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <ImageIcon size={16} />
                    Add Photo
                  </button>
                  <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-[#00ff41] transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <MapPin size={16} />
                    Location
                  </button>
                </div>
                <button className="px-8 py-2.5 bg-[#00ff41] text-black rounded-xl font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(0,255,65,0.2)] flex items-center gap-2">
                  <Send size={14} strokeWidth={3} />
                  Post Update
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 mb-8 overflow-hidden">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
              <User className="w-5 h-5 text-[#00ff41]" />
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: User, label: 'Full Name', value: profileUser?.name || 'Marcus James Anderson' },
                { icon: Mail, label: 'Email', value: profileUser?.email || 'marcus.anderson@elitepro.com' },
                { icon: Phone, label: 'Phone', value: profileUser?.phone || '+44 7700 900123' },
                { icon: Calendar, label: 'Age', value: '26 Years' },
                { icon: Ruler, label: 'Height / Weight', value: '6\'2" / 82kg' },
                { icon: Activity, label: 'Main Sport', value: profileUser?.interests?.[0] || 'Football' },
                { icon: Activity, label: 'Secondary Sport', value: 'Futsal' },
                { icon: Shield, label: 'Preferred Foot', value: 'Right' },
                { icon: MapPin, label: 'Position', value: 'Striker / Forward' },
                { icon: ShieldCheck, label: 'Current Team', value: 'Manchester United' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-[#00ff41]/20 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[#00ff41]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <item.icon className="w-4 h-4 text-[#00ff41]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-xs font-bold text-white tracking-tight truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
              <Activity className="w-5 h-5 text-[#00ff41]" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {[
                { icon: Trophy, title: 'Won Premier League Match', desc: 'Man Utd vs Chelsea (3-1)', time: '2 hours ago' },
                { icon: Medal, title: 'Achievement Unlocked', desc: 'Scored hat-trick in match', time: '5 hours ago' },
                { icon: Upload, title: 'Training Session Uploaded', desc: 'HIIT training completed', time: '1 day ago' },
                { icon: Users, title: 'Joined Tournament', desc: 'UEFA Champions League', time: '2 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3.5 bg-black/40 rounded-xl border border-white/10 hover:border-[#00ff41]/30 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[#00ff41]/10 flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-all">
                    <activity.icon className="w-4 h-4 text-[#00ff41]" />
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
            <TrendingUp className="w-5 h-5 text-[#00ff41]" />
            Performance Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Skill Radar</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[
                  { stat: 'Speed', value: 92 }, { stat: 'Strength', value: 88 }, { stat: 'Agility', value: 95 },
                  { stat: 'Stamina', value: 90 }, { stat: 'Dribbling', value: 94 }, { stat: 'Passing', value: 87 },
                ]}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name="Performance" dataKey="value" stroke="#00ff41" fill="#00ff41" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Monthly Performance</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[
                  { month: 'Jan', perf: 85 }, { month: 'Feb', perf: 88 }, { month: 'Mar', perf: 90 },
                  { month: 'Apr', perf: 87 }, { month: 'May', perf: 92 }, { month: 'Jun', perf: 95 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 9, fontWeight: 'bold' }} axisLine={false} />
                  <YAxis domain={[80, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="perf" stroke="#00ff41" strokeWidth={3} dot={{ fill: '#00ff41', r: 4, strokeWidth: 2, stroke: '#000' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
            <Award className="w-5 h-5 text-[#00ff41]" />
            Certificates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'UEFA Pro License', org: 'UEFA', date: 'March 2024', img: 'https://images.unsplash.com/photo-1547968483-0ea9e863caca?q=80&w=2070' },
              { title: 'Sports Science', org: 'ISA', date: 'Jan 2024', img: 'https://images.unsplash.com/photo-1755039466834-3322b29dc45e?q=80&w=2070' },
              { title: 'Elite Training', org: 'PL Academy', date: 'Nov 2023', img: 'https://images.unsplash.com/photo-1658504140972-7af3e80d35f1?q=80&w=2070' },
            ].map((cert, idx) => (
              <div key={idx} className="group bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-[#00ff41]/30 transition-all">
                <div className="h-32 overflow-hidden">
                  <img src={cert.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-xs mb-0.5 truncate" style={HEADING_STYLE}>{cert.title}</h3>
                  <p className="text-[10px] text-gray-500 mb-0.5">{cert.org}</p>
                  <p className="text-[9px] text-[#00ff41] font-bold uppercase tracking-widest">{cert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
            <Trophy className="w-5 h-5 text-[#00ff41]" />
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
            <BarChart3 className="w-5 h-5 text-[#00ff41]" />
            Career Summary
          </h2>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <h3 className="text-xs font-black text-white mb-4 uppercase tracking-widest" style={HEADING_STYLE}>Career Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { icon: Calendar, label: 'Years Active', value: '12', color: '#00ff41' },
                { icon: Target, label: 'Total Matches', value: '287', color: '#00ff41' },
                { icon: Building2, label: 'Total Clubs', value: '4', color: '#00ff41' },
                { icon: Zap, label: 'Total Goals', value: '145', color: '#00ff41' },
                { icon: Users, label: 'Assists', value: '89', color: '#00ff41' },
                { icon: Award, label: 'Tournaments', value: '18', color: '#00ff41' },
                { icon: Medal, label: 'MOTM Awards', value: '34', color: '#00ff41' },
                { icon: AlertTriangle, label: 'Red Cards', value: '2', color: '#ff4444' },
                { icon: AlertTriangle, label: 'Yellow Cards', value: '23', color: '#ffaa00' },
                { icon: BarChart3, label: 'Win Ratio', value: '69%', color: '#00ff41' },
                { icon: Target, label: 'Pass Accuracy', value: '87%', color: '#00ff41' },
                { icon: BarChart3, label: 'Season Goals', value: '28', color: '#00ff41' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-[#00ff41]/30 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-[#00ff41]/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <stat.icon className="w-4 h-4 text-[#00ff41]" />
                  </div>
                  <p className="text-xl font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest" style={HEADING_STYLE}>
                <Building2 className="w-4 h-4 text-[#00ff41]" />
                Previous Clubs
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Manchester United', years: '2022-Present', logo: '🔴' },
                  { name: 'Chelsea FC', years: '2019-2022', logo: '🔵' },
                  { name: 'Liverpool FC', years: '2016-2019', logo: '🔴' },
                  { name: 'Arsenal Youth', years: '2012-2016', logo: '🔴' },
                ].map((club, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#00ff41]/30 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff41]/10 to-transparent flex items-center justify-center text-lg border border-white/5">
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

            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest" style={HEADING_STYLE}>
                <Clock className="w-4 h-4 text-[#00ff41]" />
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
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-[#00ff41]/10 flex items-center justify-center flex-shrink-0 border border-[#00ff41]/20">
                      <span className="text-[#00ff41] font-black text-[10px]">{m.year}</span>
                    </div>
                    <p className="text-white font-bold text-[10px] tracking-tight">{m.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
              <Calendar className="w-5 h-5 text-[#00ff41]" />
              Next Match
            </h2>
            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-3xl border border-red-500/30">🔴</div>
                  <p className="text-[9px] font-black text-white uppercase">Man Utd</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-[#00ff41] tracking-tighter mb-0.5 italic">VS</p>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Premier League</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl border border-blue-500/30">🔵</div>
                  <p className="text-[9px] font-black text-white uppercase">Chelsea</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {Object.entries(timeLeft).map(([unit, val]) => (
                  <div key={unit} className="bg-[#00ff41]/10 rounded-lg p-3 text-center border border-[#00ff41]/20">
                    <p className="text-xl font-black text-[#00ff41] leading-none mb-0.5">{val}</p>
                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{unit}</p>
                  </div>
                ))}
              </div>
              <button className="w-full bg-[#00ff41] text-black py-3 rounded-xl font-black uppercase tracking-wider text-[10px] hover:scale-[1.02] transition-all shadow-[0_5px_15px_rgba(0,255,65,0.1)]">
                Watch Match Live
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
              <UserPlus className="w-5 h-5 text-[#00ff41]" />
              Invite Players
            </h2>
            <div className="space-y-3">
              {[
                { name: 'James Rodriguez', pos: 'Midfielder', rat: 92, img: 'https://images.unsplash.com/photo-1663576748377-cafb47103042?q=80&w=2070' },
                { name: 'David Silva', pos: 'Forward', rat: 89, img: 'https://images.unsplash.com/photo-1663576748367-4ff6bec25639?q=80&w=2070' },
                { name: 'Chris Johnson', pos: 'Defender', rat: 85, img: 'https://images.unsplash.com/photo-1776416817016-f4b64cc132b1?q=80&w=2070' },
              ].map((player, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5 bg-black/40 rounded-xl border border-white/10 hover:border-[#00ff41]/30 transition-all group">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img src={player.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold tracking-tight truncate text-[11px]" style={HEADING_STYLE}>{player.name}</h3>
                    <p className="text-[9px] text-gray-500 font-medium">{player.pos}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00ff41]/10 rounded-full border border-[#00ff41]/20">
                    <Star size={10} className="text-[#00ff41]" fill="currentColor" />
                    <span className="text-[#00ff41] font-black text-[9px]">{player.rat}</span>
                  </div>
                  <button className="p-2 bg-[#00ff41]/10 text-[#00ff41] rounded-lg hover:bg-[#00ff41]/20 transition-all border border-[#00ff41]/20">
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
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
