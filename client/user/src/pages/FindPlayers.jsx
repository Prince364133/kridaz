import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Search, 
  MapPin, 
  Loader2, 
  Users,
  MessageCircle,
  Trophy,
  ShieldCheck,
  UserPlus,
  Swords,
  ChevronRight,
  Target,
  Crown,
  Activity,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StoryViewer from "@features/networking/components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const PRI = "#BFF367";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const PlayerCard = ({ player, rank, followingIds, handleFollowToggle, handleAvatarClick, currentUser, navigate, gateInteraction }) => {
  const shapes = [
    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    "circle(50% at 50% 50%)",
    "polygon(50% 0%, 100% 100%, 0% 100%)",
    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
  ];
  const shape = shapes[rank % shapes.length];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-black rounded-[8px] border border-[#BFF367]/20 overflow-hidden flex flex-col h-[360px] p-1 group hover:border-[#BFF367]/60 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex justify-end items-start p-4 absolute top-0 left-0 right-0 z-20">
        <div className="p-1.5 bg-[#BFF367]/10 rounded-[8px] border border-[#BFF367]/20">
          <ShieldCheck size={14} className="text-[#BFF367]" />
        </div>
      </div>

      <div className="h-40 relative mt-2 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute w-52 h-52 bg-[#BFF367]/10 border border-[#BFF367]/30 blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-700"
          style={{ clipPath: shape }}
        />
        <div 
          className="absolute w-48 h-48 border-2 border-[#BFF367]/40"
          style={{ clipPath: shape }}
        />
        <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none">
          <img 
            src={player.profilePicture || "https://pngimg.com/d/cricket_PNG102.png"} 
            alt="" 
            className="h-[95%] w-[90%] object-contain filter drop-shadow-[0_10px_30px_rgba(85, 222, 232,0.4)] group-hover:scale-110 transition-transform duration-700 select-none"
          />
        </div>

      </div>

      <div className="flex-1 px-3 pt-4 pb-2 flex flex-col items-center text-center">
        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 truncate w-full" style={HEADING_STYLE}>
          {player.name}
        </h3>
        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          <MapPin size={10} className="text-[#BFF367]" />
          {player.city || 'Athletic'}
        </div>
        <div className="grid grid-cols-3 w-full border-t border-white/5 pt-2 mb-2">
          <div className="flex flex-col items-center">
            <span className="text-[#BFF367] text-[6px] font-black uppercase tracking-widest mb-1">Matches</span>
            <span className="text-white font-black text-[10px]">—</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <span className="text-[#BFF367] text-[6px] font-black uppercase tracking-widest mb-1">Runs</span>
            <span className="text-white font-black text-[10px]">—</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#BFF367] text-[6px] font-black uppercase tracking-widest mb-1">Strike Rate</span>
            <span className="text-white font-black text-[10px]">—</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full mt-auto">
          <button onClick={() => handleFollowToggle(player.id || player._id)} className={`flex-1 h-11 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${followingIds.includes(player.id || player._id) ? "bg-white/5 text-white/20 border border-white/10" : "bg-[#BFF367] text-black hover:bg-[#88EEF6]"}`}>
            {followingIds.includes(player.id || player._id) ? "Following" : "Follow"}
          </button>
          <button onClick={() => gateInteraction(() => navigate(`/messages?userId=${player.id || player._id}`))} className="w-11 h-11 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#BFF367] transition-all">
            <MessageCircle size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TeamCard = ({ team, navigate }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-[#0A0A0A] rounded-[8px] border border-white/5 overflow-hidden flex flex-col h-[380px] group hover:border-[#BFF367]/30 transition-all duration-500 shadow-2xl"
    >
      {/* Top Section: Banner */}
      <div className="h-32 relative">
        <img 
          src={team.sportType === 'Cricket' ? 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop'} 
          alt="" 
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        
        {/* Verified Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-[6px] border border-white/10">
          <div className="w-3.5 h-3.5 bg-[#BFF367] rounded-full flex items-center justify-center">
            <ShieldCheck size={10} className="text-black" />
          </div>
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Verified</span>
        </div>

        {/* Team Avatar Overlay */}
        <div className="absolute bottom-[-16px] left-4 z-10">
          <div className="w-14 h-14 rounded-full border-[2px] border-[#0A0A0A] bg-[#0A0A0A] relative overflow-hidden group/avatar">
            <div className="absolute inset-0 border-2 border-[#BFF367] rounded-full z-20" />
            <div className="w-full h-full flex items-center justify-center bg-[#111] relative z-10">
              {team.logo ? (
                <img src={team.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#BFF367]">
                  <Crown size={24} className="mb-1" />
                  <div className="w-10 h-10 border-2 border-[#BFF367] rounded-full flex items-center justify-center p-1">
                     {team.sportType === 'Cricket' ? <Trophy size={16} /> : <Activity size={16} />}
                  </div>
                </div>
              )}
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-[#BFF367] rounded-full border-[3px] border-[#0A0A0A] z-30" />
          </div>
        </div>
      </div>

      {/* Middle Section: Details */}
      <div className="flex-1 pt-6 px-4 pb-2 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tighter mb-0.5" style={HEADING_STYLE}>{team.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[#BFF367] font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5">
                {team.sportType === 'Cricket' ? <Trophy size={10} /> : <Activity size={10} />}
                {team.sportType}
              </span>
            </div>
            <p className="text-gray-600 text-[8px] font-bold uppercase tracking-widest mt-0.5">@ {team.city || 'Global'}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-[8px] border border-white/10 text-white/40 hover:text-[#BFF367] transition-colors">
            <Star size={16} />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/5 mb-3">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-white/5 rounded-[8px] border border-white/10">
                <Users size={14} className="text-[#BFF367]" />
             </div>
             <div>
                <p className="text-sm font-black text-white leading-none mb-0.5">{team.memberCount || 1}</p>
                <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Members</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="p-2 bg-white/5 rounded-[8px] border border-white/10">
                <Target size={14} className="text-[#BFF367]" />
             </div>
             <div>
                <p className="text-sm font-black text-white leading-none mb-0.5">{team.matchesPlayed || 0}</p>
                <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Matches</p>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <Link 
              to={`/team/${team._id}`}
              className="h-12 bg-[#BFF367] text-black rounded-[8px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_5px_15px_rgba(85, 222, 232,0.2)]"
           >
              <UserPlus size={14} strokeWidth={3} />
              Join Team
           </Link>
           <Link 
              to={`/team/${team._id}`}
              className="h-12 bg-transparent border-2 border-white/10 text-white rounded-[8px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
           >
              <Swords size={14} />
              Challenge
           </Link>
        </div>

        <Link 
          to={`/team-pass/${team._id}`}
          className="mt-3 flex items-center justify-center gap-2 text-gray-600 hover:text-[#BFF367] text-[9px] font-black uppercase tracking-[0.2em] transition-all"
        >
          View Team Pass <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
};

const FindPlayers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingIds, setFollowingIds] = useState([]);
  const [filters, setFilters] = useState({ city: "", sport: "" });
  const [activeTab, setActiveTab] = useState("players");
  const [teams, setTeams] = useState([]);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);

  const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];

  useEffect(() => {
    if (activeTab === "players") fetchPlayers();
    else fetchTeams();
    if (currentUser) fetchFollowingStatus();
  }, [filters, currentUser, activeTab]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append("city", filters.city);
      if (filters.sport) params.append("sportType", filters.sport);
      if (searchQuery) params.append("search", searchQuery);
      const response = await axiosInstance.get(`/api/team/all?${params.toString()}`);
      setTeams(response.data.teams || []);
    } catch (error) {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append("city", filters.city);
      if (filters.sport) params.append("sport", filters.sport);
      const response = await axiosInstance.get(`/api/user/players?${params.toString()}`);
      setPlayers(response.data.players || []);
    } catch (error) {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    try {
      const response = await axiosInstance.get("/api/user/players/network");
      const ids = (response.data.following || []).filter(p => p).map(p => p.id || p._id);
      setFollowingIds(ids);
    } catch (error) {
      console.error("Error fetching network:", error);
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length === 0) activeTab === "players" ? fetchPlayers() : fetchTeams();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFollowToggle = async (targetUserId) => {
    gateInteraction(async () => {
      const isFollowing = followingIds.includes(targetUserId);
      try {
        const endpoint = `/api/user/players/${targetUserId}/${isFollowing ? 'unfollow' : 'follow'}`;
        await axiosInstance.post(endpoint);
        if (isFollowing) {
          setFollowingIds(prev => prev.filter(id => id !== targetUserId));
          toast.success("Unfollowed player");
        } else {
          setFollowingIds(prev => [...prev, targetUserId]);
          toast.success("Following player");
        }
      } catch (error) {
        toast.error("Failed to update follow status");
      }
    });
  };

  const handleAvatarClick = (player) => {
    gateInteraction(() => {
      const playerId = player.id || player._id;
      if (!player.hasActiveStory) {
        navigate(`/profile/${playerId}`);
        return;
      }
      const fetchStories = async () => {
        try {
          const res = await axiosInstance.get(`/api/user/community/user-stories/${playerId}`);
          if (res.data.success && res.data.stories?.length > 0) {
            setViewingStoryGroup({ user: player, stories: res.data.stories });
          } else {
            navigate(`/profile/${playerId}`);
          }
        } catch (error) {
          toast.error("Failed to load stories");
          navigate(`/profile/${playerId}`);
        }
      };
      fetchStories();
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Tab Switcher */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-1">
          <button 
            onClick={() => setActiveTab("players")}
            className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "players" ? "text-[#BFF367]" : "text-white/20 hover:text-white/40"}`}
          >
            Players
            {activeTab === "players" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#BFF367]" />}
          </button>
          <button 
            onClick={() => setActiveTab("teams")}
            className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "teams" ? "text-[#BFF367]" : "text-white/20 hover:text-white/40"}`}
          >
            Teams
            {activeTab === "teams" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#BFF367]" />}
          </button>
        </div>

        {/* Compact Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-[8px] p-3 md:p-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-[0.2em] whitespace-nowrap hidden sm:block" style={SUBHEADING_STYLE}>{activeTab === "players" ? "Active Players" : "Verified Teams"}</h2>
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#BFF367] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="SEARCH..."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#BFF367]/50 rounded-[8px] h-10 pl-11 pr-4 text-white text-[10px] md:text-xs placeholder:text-white/20 outline-none transition-all uppercase tracking-widest font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={filters.sport}
              onChange={(e) => handleFilterChange("sport", e.target.value)}
              className="bg-white/5 border border-white/10 rounded-[6px] px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#BFF367] focus:border-[#BFF367]/50 outline-none cursor-pointer hover:bg-white/10 transition-all"
            >
              <option value="">All Sports</option>
              {sports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="relative group">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#BFF367]" size={10} />
              <input 
                type="text"
                placeholder="LOCATION..."
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#BFF367] focus:border-[#BFF367]/50 outline-none w-28 md:w-32 placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[520px] bg-white/[0.02] border border-white/5 rounded-[8px] animate-pulse" />
            ))}
          </div>
        ) : activeTab === "players" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {players.map((player, idx) => (
              <PlayerCard 
                key={player.id || player._id} 
                player={player} 
                rank={idx}
                followingIds={followingIds}
                handleFollowToggle={handleFollowToggle}
                handleAvatarClick={handleAvatarClick}
                currentUser={currentUser}
                navigate={navigate}
                gateInteraction={gateInteraction}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teams.map((team) => (
              <TeamCard key={team._id} team={team} navigate={navigate} />
            ))}
          </div>
        )}
      </div>

      {viewingStoryGroup && (
        <StoryViewer 
          storyGroup={viewingStoryGroup}
          onClose={() => setViewingStoryGroup(null)}
          onDelete={null}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default FindPlayers;
