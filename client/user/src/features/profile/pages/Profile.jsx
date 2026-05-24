import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send, MessageCircle,
  Wallet, CreditCard, Award, Target, LogOut, Plus, Eye, TrendingUp, Mail, Phone, Ruler, LayoutGrid, CheckCircle2, UserPlus, BarChart, ExternalLink, Crown, Shield, BarChart3, Building2, AlertTriangle, Upload, Search, Medal, Users, Share2,
  ChevronDown, ChevronUp, AlignLeft, Wifi, Radio
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { login, logout, updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { StoryViewer } from "@features/networking";
import EditProfileModal from "@components/modals/EditProfileModal";
import { useSocket } from "@context/SocketContext";

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

const ConnectionsModal = ({ isOpen, onClose, followersList = [], followingList = [], commonConnections = [], followingIds = [], currentUser, handlePlayerFollowToggle, activeTab, setActiveTab }) => {
  if (!isOpen) return null;

  const getList = () => {
    switch (activeTab) {
      case "followers":
        return followersList;
      case "following":
        return followingList;
      case "common":
        return commonConnections;
      default:
        return [];
    }
  };

  const list = getList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white" style={HEADING_STYLE}>Connections</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Network details & mutual links</p>
          </div>
          <button onClick={onClose} className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[15px] font-black uppercase tracking-wider text-[9px] transition-all">
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <button 
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "followers" ? 'text-[#BFF367] border-[#BFF367]' : 'text-gray-400 border-transparent'}`}
          >
            Followers ({followersList.length})
          </button>
          <button 
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "following" ? 'text-[#BFF367] border-[#BFF367]' : 'text-gray-400 border-transparent'}`}
          >
            Following ({followingList.length})
          </button>
          <button 
            onClick={() => setActiveTab("common")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "common" ? 'text-[#BFF367] border-[#BFF367]' : 'text-gray-400 border-transparent'}`}
          >
            Common ({commonConnections.length})
          </button>
        </div>

        {/* List Content */}
        <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {list.length > 0 ? (
            list.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-white/5 rounded-[15px] hover:border-white/10 transition-all">
                <Link 
                  to={`/profile/${player.id}`} 
                  onClick={onClose} 
                  className="flex items-center gap-3 min-w-0 hover:opacity-80"
                >
                  <img 
                    src={player.profilePicture || "https://ui-avatars.com/api/?name=" + player.name} 
                    className="w-10 h-10 rounded-full object-cover border border-white/10" 
                    alt={player.name}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-tight truncate">{player.name}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">@{player.username || "player"}</p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-3 shrink-0">
                  {player.sportTypes && player.sportTypes.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[8px] font-black uppercase">
                      {player.sportTypes[0]}
                    </span>
                  )}
                  {player.id !== (currentUser?.id || currentUser?._id) && (
                    <button
                      onClick={() => handlePlayerFollowToggle(player)}
                      className={`px-3 py-1.5 rounded-[12px] font-black uppercase tracking-wider text-[9px] transition-all ${
                        followingIds.includes(player.id)
                          ? 'bg-white/10 text-white/40 border border-white/5'
                          : 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black hover:scale-105 active:scale-95'
                      }`}
                    >
                      {followingIds.includes(player.id) ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-black/40 rounded-[15px] border border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {activeTab === "followers" && "No followers yet"}
                {activeTab === "following" && "Not following anyone yet"}
                {activeTab === "common" && "No common connections"}
              </p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sportFilter, setSportFilter] = useState("CRICKET");
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsActiveTab, setConnectionsActiveTab] = useState("followers");
  const [isCareerStatsExpanded, setIsCareerStatsExpanded] = useState(false);
  const [isFormGuideExpanded, setIsFormGuideExpanded] = useState(false);
  const [isMatchHistoryExpanded, setIsMatchHistoryExpanded] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  const { isUserOnline, getLastSeen } = useSocket();
  const isOwnProfile = !userId || (currentUser && (userId === currentUser.id || userId === currentUser._id));
  const targetUserId = isOwnProfile ? (currentUser?.id || currentUser?._id) : userId;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const commonConnections = [];
  if (!isOwnProfile && profileUser) {
    const seenIds = new Set();
    const myFollowingSet = new Set(followingIds || []);
    if (profileUser.followersList) {
      profileUser.followersList.forEach(p => {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (p.id !== currentUserId && myFollowingSet.has(p.id) && !seenIds.has(p.id)) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
    if (profileUser.followingList) {
      profileUser.followingList.forEach(p => {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (p.id !== currentUserId && myFollowingSet.has(p.id) && !seenIds.has(p.id)) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
  }

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
        setLoadingPosts(true);
        const [res, postsRes] = await Promise.all([
          axiosInstance.get(`/api/user/players/${targetUserId}`),
          axiosInstance.get(`/api/user/community/user-posts/${targetUserId}`).catch(() => ({ data: { success: false } }))
        ]);
        if (res.data.success) {
          setProfileUser(res.data.profile);
          if (isOwnProfile) dispatch(updateUser(res.data.profile));
        }
        if (postsRes.data.success) {
          setUserPosts(postsRes.data.posts || []);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoadingProfile(false);
        setLoadingPosts(false);
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
        setProfileUser(prev => {
          const currentUserId = currentUser?.id || currentUser?._id;
          return {
            ...prev,
            followers: isFollowing 
              ? prev.followers.filter(id => id !== currentUserId)
              : [...(prev.followers || []), currentUserId]
          };
        });
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

  if (loadingProfile) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#BFF367] animate-spin" /></div>;

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
          
          {/* Share button at top right corner */}
          <button 
            onClick={handleShare}
            className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center z-30"
          >
            <Share2 size={18} className="text-white" />
          </button>
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
                {profileUser?.username && (
                  <p className="text-sm font-bold text-gray-500 tracking-tight" style={SUBHEADING_STYLE}>
                    @{profileUser.username}
                  </p>
                )}
                <p className="text-lg font-bold text-gray-400 uppercase tracking-tight" style={SUBHEADING_STYLE}>
                  {profileUser?.role || "Athlete"} • {profileUser?.interests?.[0] || "Sports"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                <button 
                  onClick={() => {
                    setConnectionsActiveTab("followers");
                    setIsConnectionsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                >
                  <span className="text-[#BFF367]">{profileUser?.followers?.length || 0}</span> Followers
                </button>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <button 
                  onClick={() => {
                    setConnectionsActiveTab("following");
                    setIsConnectionsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                >
                  <span className="text-[#BFF367]">{profileUser?.following?.length || 0}</span> Following
                </button>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" stroke="url(#cyan-lime-gradient)" />
                  {profileUser?.city || "Manchester"}
                </span>
                {(() => {
                  const online = isUserOnline(targetUserId);
                  const lastSeen = getLastSeen(targetUserId);
                  const lastSeenText = lastSeen
                    ? (() => {
                        const diff = Date.now() - new Date(lastSeen).getTime();
                        if (diff < 60000) return 'Just now';
                        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                        return new Date(lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      })()
                    : null;
                  return online ? (
                    <span className="px-3 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] rounded-full border border-[#55DEE8]/20 text-[9px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#55DEE8] animate-pulse" />
                      Online
                    </span>
                  ) : lastSeenText ? (
                    <span className="px-3 py-0.5 bg-white/5 text-gray-500 rounded-full border border-white/5 text-[9px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      {lastSeenText}
                    </span>
                  ) : null;
                })()}
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

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <>
          {/* Short Bio Section */}
          {profileUser?.bio ? (
            <div className="mb-6 px-2">
              <p className="text-sm text-gray-300 leading-relaxed font-bold italic">
                "{profileUser.bio}"
              </p>
            </div>
          ) : isOwnProfile ? (
            <div className="mb-6 px-2">
              <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                No bio added yet. Click the edit icon to add your short sports bio!
              </p>
            </div>
          ) : null}
            {/* Squads Horizontal Row */}
            {profileUser?.teams && profileUser.teams.length > 0 && (
              <div className="mb-6 bg-white/[0.02] border border-white/5 p-5 rounded-[1.5rem] backdrop-blur-md">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#55DEE8]" />
                  My Teams
                </h3>
                <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {profileUser.teams.map((team) => (
                    <Link 
                      key={team.id}
                      to={`/team/${team.id}`}
                      className="flex flex-col items-center gap-2 group shrink-0"
                    >
                      <div className="w-16 h-16 rounded-[12px] bg-black border border-white/10 flex items-center justify-center text-[#55DEE8] font-bold overflow-hidden group-hover:border-[#55DEE8]/50 transition-all">
                        {team.logo || team.image ? (
                          <img src={team.logo || team.image} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{team.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider transition-colors max-w-[80px] truncate text-center">
                        {team.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Live Playing Matches Section */}
            {profileUser?.liveMatches && profileUser.liveMatches.length > 0 && (
              <div className="mb-6 relative overflow-hidden rounded-[1.5rem] border border-[#55DEE8]/30 bg-gradient-to-br from-[#55DEE8]/10 via-black/80 to-[#BFF367]/5 backdrop-blur-md p-5">
                {/* Animated background pulse */}
                <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-[#55DEE8]/5 to-[#BFF367]/5 animate-pulse pointer-events-none" />

                <h3 className="text-xs font-black uppercase tracking-wider text-[#55DEE8] mb-4 flex items-center gap-2 relative z-10">
                  <span className="relative flex items-center justify-center">
                    <span className="absolute w-4 h-4 rounded-full bg-[#55DEE8]/30 animate-ping" />
                    <Wifi className="w-4 h-4 relative" />
                  </span>
                  Live Now — Playing a Match
                </h3>

                <div className="space-y-3 relative z-10">
                  {profileUser.liveMatches.map((match) => {
                    const teamA = match.teams?.[0]?.name || "Team A";
                    const teamB = match.teams?.[1]?.name || "Team B";
                    const matchFormat = match.format || match.gameType || "T20";
                    const location = match.turf?.name || match.turf?.city || match.customVenue || match.city || "Local Ground";
                    const minutesLive = match.liveStartedAt
                      ? Math.floor((Date.now() - new Date(match.liveStartedAt).getTime()) / 60000)
                      : null;

                    return (
                      <Link
                        key={match.id}
                        to={`/analytics/${match.id}`}
                        className="group flex items-center justify-between gap-4 bg-black/50 border border-[#55DEE8]/20 hover:border-[#55DEE8]/60 rounded-[1rem] px-5 py-4 transition-all duration-300 hover:bg-black/70 hover:shadow-[0_0_20px_rgba(85,222,232,0.15)]"
                      >
                        <div className="flex-1 min-w-0">
                          {/* Teams vs */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-black text-white truncate tracking-tight" style={HEADING_STYLE}>
                              {teamA}
                            </span>
                            <span className="text-[10px] font-black text-[#BFF367] px-1.5 py-0.5 bg-[#BFF367]/10 rounded-md border border-[#BFF367]/20 shrink-0">
                              VS
                            </span>
                            <span className="text-sm font-black text-white truncate tracking-tight" style={HEADING_STYLE}>
                              {teamB}
                            </span>
                          </div>

                          {/* Format & Location row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2 py-0.5 rounded-[6px] bg-[#55DEE8]/10 border border-[#55DEE8]/20 text-[#55DEE8] text-[9px] font-black uppercase tracking-widest">
                              {matchFormat}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                              <MapPin size={9} className="text-[#BFF367]" />
                              {location}
                            </span>
                            {minutesLive !== null && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                                <Clock size={9} />
                                {minutesLive < 1 ? 'Just started' : `${minutesLive}m live`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="px-3 py-1.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[9px] font-black uppercase tracking-widest rounded-[8px] flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                            <Radio size={10} strokeWidth={2.5} />
                            Watch Live
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Earned Badges Scrollable Row */}
            <div className="mb-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10 animate-in fade-in duration-500">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <Award className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  Earned Badges
                </h2>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Prestigious dynamic sports career badges</p>
              </div>

              {profileUser?.badges && profileUser.badges.length > 0 ? (
                <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {profileUser.badges.map((badge, idx) => (
                    <div key={idx} className="group relative rounded-[15px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-[#55DEE8]/10 shrink-0 min-w-[200px] max-w-[240px]">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[15px]" />
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[15px]" />
                      <div className="relative bg-[#0d0d0d] rounded-[15px] p-4 h-full flex flex-col justify-between text-center min-h-[130px]">
                        <div>
                          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center">
                            <Medal className="w-5 h-5 text-[#BFF367]" />
                          </div>
                          <h3 className="text-white text-center mb-1 font-black text-[11px] uppercase tracking-tight truncate">{badge.name}</h3>
                          <p className="text-[9px] text-gray-500 leading-normal font-bold line-clamp-2">{badge.description}</p>
                        </div>
                        <p className="text-[8px] text-[#55DEE8] font-black uppercase tracking-widest mt-2">{badge.category || 'MILESTONE'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-black/40 rounded-[15px] border border-white/5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No career badges unlocked yet</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Score centuries, claim five-wicket hauls, or hit boundaries to earn yours!</p>
                </div>
              )}
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
                    <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10 flex flex-col justify-between">
                      <div 
                        onClick={() => setIsCareerStatsExpanded(prev => !prev)}
                        className="flex justify-between items-center cursor-pointer select-none group"
                      >
                        <div>
                          <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                            <BarChart3 className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                            Career Stats Summary
                          </h2>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                            {isCareerStatsExpanded ? "Click here to collapse this section" : "Click here to expand this section"}
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-full border border-white/10 text-white group-hover:scale-105 transition-all">
                          {isCareerStatsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      
                      {isCareerStatsExpanded && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-in fade-in duration-300">
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
                      )}
                    </div>

                    {/* Form Guide */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10 flex flex-col justify-between">
                      <div 
                        onClick={() => setIsFormGuideExpanded(prev => !prev)}
                        className="flex justify-between items-center cursor-pointer select-none group"
                      >
                        <div>
                          <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                            <TrendingUp className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                            Form Guide
                          </h2>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                            {isFormGuideExpanded ? "Click here to collapse this section" : "Click here to expand this section"}
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-full border border-white/10 text-white group-hover:scale-105 transition-all">
                          {isFormGuideExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      
                      {isFormGuideExpanded && (
                        <div className="mt-6 animate-in fade-in duration-300">
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
                      )}
                    </div>
                  </div>



                  {/* Match History Feed */}
                  <div className="space-y-6">
                    <div 
                      onClick={() => setIsMatchHistoryExpanded(prev => !prev)}
                      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/10 flex justify-between items-center cursor-pointer select-none group"
                    >
                      <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                          <Clock className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                          Match History Feed
                        </h2>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          {isMatchHistoryExpanded ? "Click here to collapse this section" : "Click here to expand this section"}
                        </p>
                      </div>
                      <div className="p-2 bg-white/5 rounded-full border border-white/10 text-white group-hover:scale-105 transition-all">
                        {isMatchHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isMatchHistoryExpanded && (
                      <div className="animate-in fade-in duration-300">
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
                    )}
                  </div>
                </div>
              );
            })()}

            {/* User Posts Section */}
            <div className="mt-12 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight" style={HEADING_STYLE}>
                  <Plus className="w-5 h-5" stroke="url(#cyan-lime-gradient)" />
                  User Posts
                </h2>
                {isOwnProfile && (
                  <Link 
                    to="/community?createPost=true"
                    className="px-4 py-2 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black rounded-[15px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(85,222,232,0.2)] flex items-center justify-center"
                  >
                    Create New Post
                  </Link>
                )}
              </div>
              
              {loadingPosts ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-[#BFF367] animate-spin" />
                </div>
              ) : userPosts && userPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {userPosts.map((post) => {
                    const postImage = post.mediaUrls?.[0] || post.image || post.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2070";
                    const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recent';
                    return (
                      <div key={post.id || post._id} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[15px] border border-white/10 overflow-hidden hover:border-[#55DEE8]/40 transition-all group">
                        <div className="h-40 relative overflow-hidden bg-zinc-900/50">
                          {post.mediaType === 'video' ? (
                            <div className="w-full h-full relative">
                              <video src={post.videoUrl || post.mediaUrls?.[0]} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-[#BFF367]" />
                              </div>
                            </div>
                          ) : (
                            <img src={postImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          )}
                          <div className="absolute top-3 right-3 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-[15px] text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                            {post.mediaType || 'Post'}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {profileUser?.profilePicture ? (
                              <img src={profileUser.profilePicture} className="w-5 h-5 rounded-full border border-[#BFF367]/40" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-zinc-850 flex items-center justify-center text-[8px] font-black text-[#BFF367]">
                                {profileUser?.name?.[0]}
                              </div>
                            )}
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate flex-1">
                              {profileUser?.name}
                              {profileUser?.username && <span className="text-gray-600 ml-1">@{profileUser.username}</span>}
                            </span>
                            <span className="text-[8px] text-gray-600 font-bold">{postDate}</span>
                          </div>
                          <h3 className="text-[11px] font-black text-white mb-1 uppercase tracking-tight truncate" style={HEADING_STYLE}>{post.title || "Update"}</h3>
                          <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">{post.content}</p>
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <button className="flex items-center gap-1 text-gray-500 hover:text-[#55DEE8] transition-colors">
                                <Heart size={12} />
                                <span className="text-[9px] font-bold">{post.likes?.length || 0}</span>
                              </button>
                              <button className="flex items-center gap-1 text-gray-500 hover:text-[#55DEE8] transition-colors">
                                <MessageSquare size={12} />
                                <span className="text-[9px] font-bold">{post.comments?.length || 0}</span>
                              </button>
                            </div>
                            <button className="text-gray-500 hover:text-white transition-colors">
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-black/40 rounded-[15px] border border-white/10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No posts uploaded yet</p>
                  {isOwnProfile && (
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Create your first community update to share your sports achievements!</p>
                  )}
                </div>
              )}
            </div>
          </>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={currentUser} />
      <MatchDetailModal 
        isOpen={selectedMatch !== null} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch} 
        userId={profileUser?.id || profileUser?._id} 
      />
      <ConnectionsModal 
        isOpen={isConnectionsModalOpen} 
        onClose={() => setIsConnectionsModalOpen(false)} 
        followersList={profileUser?.followersList || []}
        followingList={profileUser?.followingList || []}
        commonConnections={commonConnections}
        followingIds={followingIds}
        currentUser={currentUser}
        handlePlayerFollowToggle={handlePlayerFollowToggle}
        activeTab={connectionsActiveTab}
        setActiveTab={setConnectionsActiveTab}
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
