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
} from "lucide-react";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const FindPlayers = () => {
 const { user: currentUser, isLoggedIn } = useSelector((state) => state.auth);
 const { gateInteraction } = useLoginOnDemand();
 const navigate = useNavigate();

 const [players, setPlayers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [followingIds, setFollowingIds] = useState([]);
 const [filters, setFilters] = useState({
 city: "",
 sport: ""
 });

 const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];
 const [viewingStoryGroup, setViewingStoryGroup] = useState(null);

  const [activeTab, setActiveTab] = useState("players"); // "players" or "teams"
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (activeTab === "players") {
      fetchPlayers();
    } else {
      fetchTeams();
    }
    if (currentUser) {
      fetchFollowingStatus();
    }
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
 const ids = (response.data.following || []).filter(p => p).map(p => p._id);
 setFollowingIds(ids);
 } catch (error) {
 console.error("Error fetching network:", error);
 }
 };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (q.length < 2) {
      if (q.length === 0) {
        activeTab === "players" ? fetchPlayers() : fetchTeams();
      }
      return;
    }

    try {
      if (activeTab === "players") {
        const response = await axiosInstance.get(`/api/user/players/search?query=${q}`);
        setPlayers(response.data.players || []);
      } else {
        fetchTeams(); // fetchTeams already uses searchQuery
      }
    } catch (error) {
      console.error("Search error:", error);
    }
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
 }, {
 title: "Build Your Network",
 message: "Connect with players in your city, track their progress, and challenge them to a match. Sign in to start following athletes."
 });
 };

 const handleAvatarClick = (player) => {
 gateInteraction(() => {
 if (!player.hasActiveStory) {
 navigate(`/profile/${player._id}`);
 return;
 }
 
 const fetchStories = async () => {
 try {
 const res = await axiosInstance.get(`/api/user/community/user-stories/${player._id}`);
 if (res.data.success && res.data.stories?.length > 0) {
 setViewingStoryGroup({
 user: player,
 stories: res.data.stories
 });
 } else {
 navigate(`/profile/${player._id}`);
 }
 } catch (error) {
 toast.error("Failed to load stories");
 navigate(`/profile/${player._id}`);
 }
 };
 fetchStories();
 }, {
 title: "View Profile",
 message: "Sign in to view player profiles and stories."
 });
 };

 return (
 <div className="min-h-screen bg-black text-white pt-24 pb-20 md:pb-12 px-4 md:px-8">
  <div className="max-w-6xl mx-auto space-y-6">
    
    {/* Tab Switcher */}
    <div className="flex items-center gap-4 border-b border-white/5 pb-1">
      <button 
        onClick={() => setActiveTab("players")}
        className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "players" ? "text-[#CCFF00]" : "text-white/20 hover:text-white/40"}`}
      >
        Players
        {activeTab === "players" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#CCFF00]" />}
      </button>
      <button 
        onClick={() => setActiveTab("teams")}
        className={`pb-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "teams" ? "text-[#CCFF00]" : "text-white/20 hover:text-white/40"}`}
      >
        Teams
        {activeTab === "teams" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#CCFF00]" />}
      </button>
    </div>

    {/* Compact Header Row */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-[0.2em] whitespace-nowrap hidden sm:block">{activeTab === "players" ? "Active Players" : "Verified Teams"}</h2>
 
 <div className="relative flex-1 max-w-md group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors" size={16} />
 <input 
 type="text" 
 value={searchQuery}
 onChange={handleSearch}
 placeholder="SEARCH..."
 className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#CCFF00]/50 rounded-xl h-10 pl-11 pr-4 text-white text-[10px] md:text-xs placeholder:text-white/20 outline-none transition-all uppercase tracking-widest font-bold"
 />
 </div>
 </div>

 <div className="flex items-center gap-2">
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
 <select 
 value={filters.sport}
 onChange={(e) => handleFilterChange("sport", e.target.value)}
 className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#CCFF00] focus:border-[#CCFF00]/50 outline-none cursor-pointer hover:bg-white/10 transition-all"
 >
 <option value="" className="bg-black text-white/40">All Sports</option>
 {sports.map(sport => (
 <option key={sport} value={sport} className="bg-black text-white">{sport}</option>
 ))}
 </select>

 <div className="relative group">
 <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00]" size={10} />
 <input 
 type="text"
 placeholder="LOCATION..."
 value={filters.city}
 onChange={(e) => handleFilterChange("city", e.target.value)}
 className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#CCFF00] focus:border-[#CCFF00]/50 outline-none w-28 md:w-32 placeholder:text-white/20"
 />
 </div>
 </div>

 <button 
 onClick={() => {
 setFilters({ city: "", sport: "" });
 setSearchQuery("");
 activeTab === "players" ? fetchPlayers() : fetchTeams();
 }}
 className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2"
 >
 Reset
 </button>
 </div>
 </div>

 {/* Players Grid */}
 <div className="space-y-4 md:space-y-6">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === "players" ? (
        players.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Users size={48} className="mx-auto text-white/10" />
            <p className="text-white/20 text-sm uppercase tracking-widest">No players found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <div key={player._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all flex flex-col items-center text-center gap-4 group relative overflow-hidden">
                <div 
                  className={`relative w-24 h-24 rounded-full p-[2px] transition-all duration-500 group-hover:scale-110 ${player.hasActiveStory ? 'cursor-pointer ring-2 ring-[#CCFF00] ring-offset-2 ring-offset-black' : ''}`}
                  onClick={() => handleAvatarClick(player)}
                >
                  <div className="absolute inset-0 rounded-full bg-[#CCFF00]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden z-10 bg-[#1a1a1a] border border-white/10">
                    {player.profilePicture ? (
                      <img src={player.profilePicture} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#CCFF00] font-black text-2xl">
                        {player.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Link to={`/profile/${player._id}`} className="block font-bold text-sm text-white hover:text-[#CCFF00] transition-colors truncate">
                    {player.name}
                  </Link>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-white/40 uppercase tracking-widest">
                    <MapPin size={10} className="text-[#CCFF00]/60" />
                    <span>{player.city || 'Athletic'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-auto">
                  {(!currentUser || currentUser._id !== player._id) && (
                    <>
                      <button 
                        onClick={() => handleFollowToggle(player._id)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          followingIds.includes(player._id)
                          ? "bg-white/5 text-white/20 border border-white/10"
                          : "bg-[#CCFF00] text-black hover:bg-[#a3e635] shadow-[0_0_20px_rgba(132,204,22,0.1)]"
                        }`}
                      >
                        {followingIds.includes(player._id) ? "Following" : "Follow"}
                      </button>
                      <button 
                        onClick={() => {
                          gateInteraction(() => navigate(`/messages?userId=${player._id}`), {
                            title: "Start a Conversation",
                            message: "Direct messaging allows you to coordinate matches and discuss tactics. Sign in to chat with players."
                          });
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#CCFF00] hover:bg-white/10 transition-all group/msg"
                      >
                        <MessageCircle size={16} className="group-hover/msg:scale-110 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        teams.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Trophy size={48} className="mx-auto text-white/10" />
            <p className="text-white/20 text-sm uppercase tracking-widest">No teams found in your city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <div key={team._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all flex flex-col items-center text-center gap-4 group relative overflow-hidden">
                <Link 
                  to={`/team/${team._id}`}
                  className="relative w-20 h-20 rounded-2xl p-[1px] transition-all duration-500 group-hover:scale-110 bg-white/10"
                >
                  <div className="w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden z-10 bg-[#1a1a1a]">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={32} className="text-[#CCFF00]/60" />
                    )}
                  </div>
                </Link>
                <div className="space-y-1 w-full">
                  <Link to={`/team/${team._id}`} className="font-bold text-sm text-white group-hover:text-[#CCFF00] transition-colors truncate uppercase tracking-wider block">{team.name}</Link>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{team.sportType}</p>
                  <div className="flex items-center justify-center gap-1 text-[9px] text-white/20 uppercase tracking-widest mt-1">
                    <MapPin size={8} />
                    <span>{team.city || "Athletic"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full px-4 py-2 bg-white/5 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-[#CCFF00]">{team.memberCount || team.members?.length || 0}</p>
                    <p className="text-[7px] text-white/20 uppercase font-bold tracking-widest">Members</p>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-[#CCFF00]">{team.matchesPlayed || 0}</p>
                    <p className="text-[7px] text-white/20 uppercase font-bold tracking-widest">Matches</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Link 
                    to={`/team/${team._id}`}
                    className="py-2.5 rounded-xl bg-[#CCFF00] text-black text-[8px] font-black uppercase tracking-widest text-center hover:bg-[#a3e635] transition-all"
                  >
                    Join Team
                  </Link>
                  <Link 
                    to={`/team/${team._id}`}
                    className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white text-center hover:bg-white/10 transition-all"
                  >
                    Challenge
                  </Link>
                </div>

                <Link 
                  to={`/team-pass/${team._id}`}
                  className="w-full py-2 text-center text-white/20 hover:text-[#CCFF00] text-[8px] font-black uppercase tracking-[0.2em] transition-colors"
                >
                  View Team Pass
                </Link>
              </div>
            ))}
          </div>
        )
      )}
 </div>
 </div>

 {/* Story Viewer */}
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
