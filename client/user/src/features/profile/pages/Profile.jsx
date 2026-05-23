import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send, MessageCircle,
  Wallet, CreditCard, Award, Target, LogOut, Plus, Eye, TrendingUp, Mail, Phone, Ruler, LayoutGrid, CheckCircle2, UserPlus, BarChart, ExternalLink, Crown, Shield, BarChart3, Building2, AlertTriangle, Upload, Search, Medal, Users, Share2
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
import useUserRecommendations from "@hooks/useUserRecommendations";
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
const MatchDetailModal = ({ isOpen, onClose, match, userId }) => {
  const [activeSubTab, setActiveSubTab] = useState("impact");
  if (!isOpen || !match) return null;

  // Find player's stat in this match
  const playerStat = match.cricketMatch?.playerStats?.find(s => s.userId === userId) || {};
  const isBatting = playerStat.battingBalls > 0 || playerStat.battingRuns > 0;
  const isBowling = playerStat.bowlingOvers > 0 || playerStat.bowlingBalls > 0;

  // Determine user's team
  const userTeamSlot = match.teams?.find(t => t.slots?.some(s => s.userId === userId));
  const userTeamName = userTeamSlot ? userTeamSlot.name : "My Team";
  const userTeamKey = userTeamSlot ? userTeamSlot.teamKey : "";

  // Determine opponent team
  const opponentTeamSlot = match.teams?.find(t => t.teamKey !== userTeamKey);
  const opponentTeamName = opponentTeamSlot ? opponentTeamSlot.name : "Opponents";

  // Determine outcome
  const inningsUser = match.cricketMatch?.innings?.find(i => i.battingTeam === userTeamKey);
  const inningsOpponent = match.cricketMatch?.innings?.find(i => i.battingTeam !== userTeamKey);

  const userRuns = inningsUser ? inningsUser.totalRuns : 0;
  const userWickets = inningsUser ? inningsUser.totalWickets : 0;
  const opponentRuns = inningsOpponent ? inningsOpponent.totalRuns : 0;
  const opponentWickets = inningsOpponent ? inningsOpponent.totalWickets : 0;

  let outcomeText = "Match Tied";
  let won = false;
  if (userRuns > opponentRuns) {
    outcomeText = "Won";
    won = true;
  } else if (opponentRuns > userRuns) {
    outcomeText = "Lost";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">{match.name || "Match Details"}</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{match.turf?.name || match.customVenue || "Local Ground"} • {new Date(match.date).toLocaleDateString('en-GB')}</p>
          </div>
          <button onClick={onClose} className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[15px] font-black uppercase tracking-wider text-[9px] transition-all">
            Close
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <button 
            onClick={() => setActiveSubTab("impact")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeSubTab === "impact" ? 'text-[#BFF367] border-[#BFF367]' : 'text-gray-400 border-transparent'}`}
          >
            My Impact
          </button>
          <button 
            onClick={() => setActiveSubTab("scorecard")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeSubTab === "scorecard" ? 'text-[#BFF367] border-[#BFF367]' : 'text-gray-400 border-transparent'}`}
          >
            Match Scorecard
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {activeSubTab === "impact" ? (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className={`p-6 rounded-[1.5rem] border ${won ? 'bg-[#55DEE8]/5 border-[#55DEE8]/10 text-[#55DEE8]' : 'bg-red-500/5 border-red-500/10 text-red-400'} flex items-center justify-between`}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Result</p>
                  <p className="text-xl font-black uppercase tracking-tight">{outcomeText}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Contribution</p>
                  <p className="text-sm font-bold text-white">
                    {isBatting ? `${playerStat.battingRuns} Runs ` : ""}
                    {isBowling ? `& ${playerStat.bowlingWickets} Wkts` : ""}
                    {!isBatting && !isBowling ? "Fielded / DNP" : ""}
                  </p>
                </div>
              </div>

              {/* Milestones celebrations */}
              {playerStat.battingRuns >= 100 && (
                <div className="p-4 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 rounded-[1.5rem] flex items-center gap-3">
                  <Crown className="text-yellow-400 animate-bounce" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-yellow-400">Magnificent Century!</h4>
                    <p className="text-[10px] text-gray-400">Played a sensational innings of {playerStat.battingRuns} runs.</p>
                  </div>
                </div>
              )}
              {playerStat.bowlingWickets >= 5 && (
                <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-[1.5rem] flex items-center gap-3">
                  <Zap className="text-red-500 animate-pulse" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-red-500">Five-Wicket Haul!</h4>
                    <p className="text-[10px] text-gray-400">Sensational bowling display taking {playerStat.bowlingWickets} wickets.</p>
                  </div>
                </div>
              )}

              {/* Batting Card */}
              {isBatting && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Batting Performance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Runs</p>
                      <p className="text-lg font-black text-white">{playerStat.battingRuns}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Balls</p>
                      <p className="text-lg font-black text-white">{playerStat.battingBalls}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Strike Rate</p>
                      <p className="text-lg font-black text-[#BFF367]">
                        {playerStat.battingBalls > 0 ? ((playerStat.battingRuns / playerStat.battingBalls) * 100).toFixed(1) : "0.0"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Boundaries</p>
                      <p className="text-lg font-black text-white">{playerStat.battingFours}x4 / {playerStat.battingSixes}x6</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bowling Card */}
              {isBowling && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Bowling Performance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Overs</p>
                      <p className="text-lg font-black text-white">{playerStat.bowlingOvers || (playerStat.bowlingBalls / 6).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Runs</p>
                      <p className="text-lg font-black text-white">{playerStat.bowlingRuns}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Wickets</p>
                      <p className="text-lg font-black text-[#55DEE8]">{playerStat.bowlingWickets}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Economy</p>
                      <p className="text-lg font-black text-white">
                        {playerStat.bowlingBalls > 0 ? ((playerStat.bowlingRuns / playerStat.bowlingBalls) * 6).toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scoreboard Overall */}
              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-6 text-center relative overflow-hidden">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{userTeamName}</p>
                  <p className="text-3xl font-black text-white">{userRuns}/{userWickets}</p>
                </div>
                <div className="border-l border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{opponentTeamName}</p>
                  <p className="text-3xl font-black text-white">{opponentRuns}/{opponentWickets}</p>
                </div>
              </div>

              {/* Roster & Performances */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Team Lineup & Performance</h4>
                <div className="space-y-2">
                  {match.teams?.flatMap(t => t.slots || []).map((slot, index) => {
                    if (!slot.user) return null;
                    return (
                      <div key={index} className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-[15px] hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <img src={slot.user.profilePicture || "https://ui-avatars.com/api/?name=" + slot.user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                          <div>
                            <p className="text-xs font-bold text-white tracking-tight">{slot.user.name}</p>
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Player</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">
                            {match.cricketMatch?.playerStats?.find(s => s.userId === slot.userId)
                              ? `${match.cricketMatch.playerStats.find(s => s.userId === slot.userId).battingRuns} Runs` 
                              : "DNP"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, followingIds } = useSelector((/** @type {any} */ state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sportFilter, setSportFilter] = useState("CRICKET");
  
  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);
  const targetUserId = isOwnProfile ? currentUser?._id : userId;

  const commonConnections = [];
  if (!isOwnProfile && profileUser) {
    const seenIds = new Set();
    const myFollowingSet = new Set(followingIds || []);
    if (profileUser.followersList) {
      profileUser.followersList.forEach(p => {
        if (p.id !== currentUser?._id && myFollowingSet.has(p.id) && !seenIds.has(p.id)) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
    if (profileUser.followingList) {
      profileUser.followingList.forEach(p => {
        if (p.id !== currentUser?._id && myFollowingSet.has(p.id) && !seenIds.has(p.id)) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
  }

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);
  const { loading, bookings } = useBookingHistory();
  const { recommendations: userRecommendations, loading: loadingRecs } = useUserRecommendations({ limit: 3 });

  const dispatch = useDispatch();

  const handlePlayerFollowToggle = async (player) => {
    const isFollowing = followingIds.includes(player.id);
    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const response = await axiosInstance.post(`/api/user/players/${player.id}/${endpoint}`);
      if (response.data.success) {
        dispatch(isFollowing ? unfollowUser(player.id) : followUser(player.id));
        toast.success(`${isFollowing ? 'Unfollowed' : 'Following'} ${player.name}`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const [activeTab, setActiveTab] = useState("overview"); 
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
          
          {/* Share button relocated to tabs header */}
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

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* Profile Switching Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 mb-8 pb-4 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutGrid size={16} />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('posts')}
              className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Plus size={16} />
              Post
            </button>
            <button 
              onClick={() => setActiveTab('stories')}
              className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'stories' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Camera size={16} />
              Stories
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'activity' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Activity size={16} />
              Activity
            </button>
            <button 
              onClick={() => setActiveTab('connections')}
              className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'connections' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Users size={16} />
              Connections
            </button>
            {isOwnProfile && (
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`px-5 py-3 rounded-t-[10px] font-black uppercase tracking-wider text-[12px] transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'text-[#BFF367] border-b-2 border-[#BFF367] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Calendar size={16} />
                Bookings
              </button>
            )}
          </div>
          <button 
            onClick={handleShare}
            className="px-4 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[15px] font-black uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Share2 size={14} strokeWidth={2.5} />
            Share
          </button>
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

        {activeTab === 'connections' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 space-y-12">
            
            {/* Teams Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                    <Building2 className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                    Squad Portfolio
                  </h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Teams owned or joined by this player</p>
                </div>
              </div>

              {profileUser?.teams && profileUser.teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileUser.teams.map((team) => (
                    <div 
                      key={team.id} 
                      className="group relative rounded-[15px] p-[1px] transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[#55DEE8]/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px]" />
                      <div className="relative bg-[#0d0d0d] rounded-[15px] p-5 flex items-center justify-between gap-4 h-full">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-[12px] bg-black border border-white/10 flex items-center justify-center text-[#55DEE8] font-bold overflow-hidden">
                              {team.logo || team.image ? (
                                <img src={team.logo || team.image} alt={team.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{team.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-[#BFF367] text-[7px] px-1.5 py-0.5 rounded-full border border-white/10 font-black uppercase">
                              {team.sportType?.slice(0, 3) || "CRI"}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-white text-sm uppercase tracking-tight truncate mb-1">{team.name}</h3>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <User size={10} className="text-[#BFF367]" /> Captain: {team.captainName || "N/A"}
                              </p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <MapPin size={10} className="text-[#55DEE8]" /> {team.city || "Local Ground"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[8px] font-black text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">{team.teamCode}</span>
                          <Link 
                            to={`/team/${team.id}`}
                            className="p-2 bg-white/5 hover:bg-gradient-to-r hover:from-[#55DEE8] hover:to-[#BFF367] hover:text-black border border-white/10 rounded-[12px] text-white transition-all hover:scale-105"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-black/40 rounded-[15px] border border-white/5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Not a member of any squad</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1.5">Join a team using an invite code or create a new team to showcase it here!</p>
                </div>
              )}
            </div>

            {/* Common Connections Section */}
            {!isOwnProfile && (
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#55DEE8]" stroke="url(#cyan-lime-gradient)" fill="url(#cyan-lime-gradient)" />
                  Common Connections ({commonConnections.length})
                </h3>
                {commonConnections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commonConnections.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3.5 bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 rounded-[15px] hover:border-[#55DEE8]/30 transition-all">
                        <Link to={`/profile/${player.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                          <img 
                            src={player.profilePicture || "https://ui-avatars.com/api/?name=" + player.name} 
                            className="w-10 h-10 rounded-full object-cover border border-white/10" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white tracking-tight truncate">{player.name}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">@{player.username || "player"}</p>
                          </div>
                        </Link>
                        <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[8px] font-black uppercase shrink-0">
                          Mutual
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-black/40 rounded-[15px] border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No common connections yet</p>
                    <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-1">Connect with more players in the community to find mutual links!</p>
                  </div>
                )}
              </div>
            )}

            {/* Network Connections (Followers & Following) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Following List */}
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                  Following ({profileUser?.followingList?.length || 0})
                </h3>
                {profileUser?.followingList && profileUser.followingList.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {profileUser.followingList.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-white/5 rounded-[15px] hover:border-white/10 transition-all">
                        <Link to={`/profile/${player.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                          <img 
                            src={player.profilePicture || "https://ui-avatars.com/api/?name=" + player.name} 
                            className="w-10 h-10 rounded-full object-cover border border-white/10" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white tracking-tight truncate">{player.name}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">@{player.username || "player"}</p>
                          </div>
                        </Link>
                        {player.sportTypes && player.sportTypes.length > 0 && (
                          <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[8px] font-black uppercase">
                            {player.sportTypes[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-black/40 rounded-[15px] border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Not following anyone yet</p>
                  </div>
                )}
              </div>

              {/* Followers List */}
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#BFF367]" />
                  Followers ({profileUser?.followersList?.length || 0})
                </h3>
                {profileUser?.followersList && profileUser.followersList.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {profileUser.followersList.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-white/5 rounded-[15px] hover:border-white/10 transition-all">
                        <Link to={`/profile/${player.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                          <img 
                            src={player.profilePicture || "https://ui-avatars.com/api/?name=" + player.name} 
                            className="w-10 h-10 rounded-full object-cover border border-white/10" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white tracking-tight truncate">{player.name}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">@{player.username || "player"}</p>
                          </div>
                        </Link>
                        {player.sportTypes && player.sportTypes.length > 0 && (
                          <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[8px] font-black uppercase">
                            {player.sportTypes[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-black/40 rounded-[15px] border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">No followers yet</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Sports Filter & Resume Header */}
            <div className="flex items-center justify-between mb-8 bg-white/[0.02] border border-white/5 p-5 rounded-[1.5rem] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Medal className="text-[#BFF367]" size={22} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white" style={HEADING_STYLE}>Sports Resumé</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Verified athlete resume & credentials</p>
                </div>
              </div>
              <select 
                value={sportFilter} 
                onChange={(e) => setSportFilter(e.target.value)} 
                className="bg-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-[15px] focus:outline-none focus:border-[#55DEE8] transition-all cursor-pointer"
              >
                <option value="CRICKET">Cricket Stats</option>
                <option value="FOOTBALL">Football (Coming Soon)</option>
              </select>
            </div>

            {/* Career stats grid */}
            {(() => {
              const currentStats = profileUser?.careerStats?.find(s => s.sportType === sportFilter) || {
                matchesPlayed: 0, matchesWon: 0, matchesLost: 0, winPercentage: 0,
                totalRuns: 0, fours: 0, sixes: 0, centuries: 0, halfCenturies: 0, highestScore: 0, battingAverage: 0, battingStrikeRate: 0,
                wickets: 0, economyRate: 0, bowlingAverage: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, ballsBowled: 0, runsConceded: 0, fiveWicketHauls: 0
              };

              const formGuideData = (profileUser?.matchHistory || [])
                .slice(0, 5)
                .reverse()
                .map((match, idx) => {
                  const stat = match.cricketMatch?.playerStats?.find(s => s.userId === profileUser.id) || {};
                  return {
                    matchNum: `Match ${idx + 1}`,
                    runs: stat.battingRuns || 0
                  };
                });

              return (
                <div className="space-y-8">
                  {/* Grid layout for Stats Summary & Form Guide */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Career Statistics */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10">
                      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                        <BarChart3 className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                        Career Stats Summary
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Matches Played', value: currentStats.matchesPlayed, color: '#white' },
                          { label: 'Win/Loss Spell', value: `${currentStats.matchesWon}W - ${currentStats.matchesLost}L`, color: '#55DEE8' },
                          { label: 'Win Ratio', value: `${currentStats.winPercentage}%`, color: '#BFF367' },
                          { label: 'Runs Scored', value: currentStats.totalRuns, color: '#white' },
                          { label: 'Batting Avg', value: currentStats.battingAverage || "0.0", color: '#white' },
                          { label: 'Strike Rate', value: currentStats.battingStrikeRate || "0.0", color: '#BFF367' },
                          { label: 'High Score', value: currentStats.highestScore || "0", color: '#white' },
                          { label: 'Centuries (100s)', value: currentStats.centuries, color: '#white' },
                          { label: 'Wickets Taken', value: currentStats.wickets, color: '#55DEE8' },
                          { label: 'Economy', value: currentStats.bowlingEconomy || currentStats.economyRate || "0.00", color: '#white' },
                          { label: 'Bowling Avg', value: currentStats.bowlingAverage || "0.00", color: '#white' },
                          { label: 'Best Bowling', value: currentStats.bestBowlingWickets ? `${currentStats.bestBowlingWickets}/${currentStats.bestBowlingRuns}` : "N/A", color: '#white' },
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-black/40 rounded-[15px] p-4 border border-white/5 hover:border-[#55DEE8]/30 transition-all group">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-lg font-black tracking-tight" style={{ color: stat.color }}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Form Guide */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10 flex flex-col justify-between">
                      <div>
                        <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                          <TrendingUp className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                          Form Guide
                        </h2>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-6">Batting runs over last 5 matches</p>
                      </div>
                      
                      {formGuideData.length > 0 ? (
                        <div className="w-full h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formGuideData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                              <XAxis dataKey="matchNum" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold' }} axisLine={false} />
                              <YAxis tick={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
                              <Line type="monotone" dataKey="runs" stroke="url(#cyan-lime-gradient)" strokeWidth={3.5} dot={{ fill: '#BFF367', r: 4, strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center bg-black/40 border border-white/5 rounded-[15px] py-12 text-center">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">No match form data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bento Badge Showcase */}
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10">
                    <div className="mb-6">
                      <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                        <Award className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                        Earned Badges
                      </h2>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Prestigious dynamic sports career badges</p>
                    </div>

                    {profileUser?.badges && profileUser.badges.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {profileUser.badges.map((badge, idx) => (
                          <div key={idx} className="group relative rounded-[15px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-[#55DEE8]/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
                            <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px]" />
                            <div className="relative bg-[#0d0d0d] rounded-[15px] p-5 h-full flex flex-col justify-between text-center min-h-[140px]">
                              <div>
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center">
                                  <Medal className="w-6 h-6 text-[#BFF367]" />
                                </div>
                                <h3 className="text-white text-center mb-1 font-black text-xs uppercase tracking-tight">{badge.name}</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed font-bold">{badge.description}</p>
                              </div>
                              <p className="text-[8px] text-[#55DEE8] font-black uppercase tracking-widest mt-3">{badge.category || 'MILESTONE'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-black/40 rounded-[15px] border border-white/5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No career badges unlocked yet</p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1.5">Score centuries, claim five-wicket hauls, or hit boundaries to earn yours!</p>
                      </div>
                    )}
                  </div>

                  {/* Match History Feed */}
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                        <Clock className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                        Match History Feed
                      </h2>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Complete score logs played in Kridaz</p>
                    </div>

                    {profileUser?.matchHistory && profileUser.matchHistory.length > 0 ? (
                      <div className="space-y-4 max-w-4xl">
                        {profileUser.matchHistory.map((match, idx) => {
                          const stat = match.cricketMatch?.playerStats?.find(s => s.userId === profileUser.id) || {};
                          const userTeamSlot = match.teams?.find(t => t.slots?.some(s => s.userId === profileUser.id));
                          const userTeamKey = userTeamSlot ? userTeamSlot.teamKey : "";
                          const userTeamName = userTeamSlot ? userTeamSlot.name : "My Team";
                          const opponentTeamName = match.teams?.find(t => t.teamKey !== userTeamKey)?.name || "Opponent";

                          const inningsUser = match.cricketMatch?.innings?.find(i => i.battingTeam === userTeamKey);
                          const inningsOpponent = match.cricketMatch?.innings?.find(i => i.battingTeam !== userTeamKey);
                          const won = (inningsUser?.totalRuns || 0) > (inningsOpponent?.totalRuns || 0);

                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedMatch(match)}
                              className="group relative rounded-[15px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-[#BFF367]/5"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
                              <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px]" />
                              <div className="relative bg-[#0d0d0d] rounded-[15px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-[15px] text-[8px] font-black uppercase tracking-widest border ${won ? 'text-[#55DEE8] bg-[#55DEE8]/10 border-[#55DEE8]/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                      {won ? 'WON' : 'LOST'}
                                    </span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{new Date(match.date).toLocaleDateString('en-GB')}</span>
                                  </div>
                                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1" style={HEADING_STYLE}>{userTeamName} vs {opponentTeamName}</h3>
                                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={10} className="text-[#BFF367]" /> {match.turf?.name || match.customVenue || "Local Ground"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-[15px] text-right">
                                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Match Performance</p>
                                    <p className="text-xs font-black text-[#BFF367]">
                                      {stat.battingRuns > 0 ? `${stat.battingRuns} Runs ` : ""}
                                      {stat.bowlingWickets > 0 ? `& ${stat.bowlingWickets} Wkts` : ""}
                                      {stat.battingRuns === 0 && stat.bowlingWickets === 0 ? "Fielded" : ""}
                                    </p>
                                  </div>
                                  <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[15px] text-white transition-all group-hover:scale-105">
                                    <ArrowRight size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/40 rounded-[15px] border border-white/10">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No match history available</p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Once matches are completed on Kridaz, your detailed resumes will display here!</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={currentUser} />
      <MatchDetailModal 
        isOpen={selectedMatch !== null} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch} 
        userId={profileUser?.id || profileUser?._id} 
      />
      {viewingStoryGroup && (
        <StoryViewer 
          storyGroup={viewingStoryGroup} 
          onClose={() => setViewingStoryGroup(null)} 
          onDelete={isOwnProfile ? (id) => toast.error("Delete logic not mapped") : null} 
          currentUser={currentUser} 
          isAdmin={currentUser?.role === 'BMSP_SUPER_ADMIN' || currentUser?.role === 'BMSP_ADMIN'} 
          initialIndex={initialStoryIndex} 
        />
      )}
    </div>
  );
}
