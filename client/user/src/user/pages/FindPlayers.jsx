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
} from "lucide-react";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { useGetAllTeamsQuery } from "../../redux/api/teamApi";
import TeamMembersModal from "../components/teams/TeamMembersModal";

const FindPlayers = () => {
  const { user: currentUser, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("players"); // "players" or "teams"
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingIds, setFollowingIds] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    sport: ""
  });

  const { data: teamsData, isLoading: teamsLoading } = useGetAllTeamsQuery({
    city: filters.city,
    game: filters.sport,
    search: filters.search
  }, { skip: activeTab !== "teams" });

  const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);

  useEffect(() => {
    if (activeTab === "players") {
      fetchPlayers();
    }
    if (currentUser) {
      fetchFollowingStatus();
    }
  }, [filters, currentUser, activeTab]);

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
        if (activeTab === "players") fetchPlayers();
        // Teams are handled by RTK Query auto-refetch
      }
      return;
    }

    try {
      if (activeTab === "players") {
        const response = await axiosInstance.get(`/api/user/players/search?query=${q}`);
        setPlayers(response.data.players || []);
      } else {
        // For teams, if query is 10 chars, it might be a teamCode
        let endpoint = `/api/team/all?search=${q}`;
        if (q.length === 10 && /^[A-Z0-9]+$/i.test(q)) {
           // We could add a specific find-by-code logic here if needed
        }
        // Actually, we'll just update filters for the RTK Query
        setFilters(prev => ({ ...prev, search: q }));
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
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("players")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "players" ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.1)]" : "text-white/40 hover:text-white"}`}
          >
            Players
          </button>
          <button 
            onClick={() => setActiveTab("teams")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "teams" ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.1)]" : "text-white/40 hover:text-white"}`}
          >
            Teams
          </button>
        </div>

        {/* Compact Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-[0.2em] whitespace-nowrap hidden sm:block">
              {activeTab === "players" ? "Active Players" : "Global Teams"}
            </h2>
            
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder={activeTab === "players" ? "SEARCH PLAYERS..." : "SEARCH TEAMS..."}
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
                if (activeTab === "players") fetchPlayers();
              }}
              className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Players/Teams Grid */}
        <div className="space-y-4 md:space-y-6">
          {(() => {
            if ((loading && activeTab === "players") || (teamsLoading && activeTab === "teams")) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              );
            }

            if (activeTab === "players") {
              if (players.length === 0) {
                return (
                  <div className="py-20 text-center space-y-4">
                    <Users size={48} className="mx-auto text-white/10" />
                    <p className="text-white/20 text-sm uppercase tracking-widest">No players found matching your criteria.</p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {players.map((player) => (
                    <div key={player._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all flex flex-col items-center text-center gap-4 group relative overflow-hidden">
                      {/* Avatar Section */}
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

                      {/* Player Details */}
                      <div className="space-y-1 w-full">
                        <Link to={`/profile/${player._id}`} className="block font-bold text-sm text-white hover:text-[#CCFF00] transition-colors truncate">
                          {player.name}
                        </Link>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-white/40 uppercase tracking-widest">
                          <MapPin size={10} className="text-[#CCFF00]/60" />
                          <span>{player.city || 'Athletic'}</span>
                        </div>

                        {/* Stats Ribbon */}
                        {player.stats?.cricket?.matches > 0 && (
                          <div className="flex items-center justify-center gap-3 py-1 px-3 bg-white/[0.03] border border-white/5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white/40 mt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[#CCFF00]">{player.stats.cricket.runs || 0}</span>
                              <span>Runs</span>
                            </div>
                            <div className="w-[1px] h-2 bg-white/10" />
                            <div className="flex items-center gap-1">
                              <span className="text-[#CCFF00]">{player.stats.cricket.wickets || 0}</span>
                              <span>Wkts</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
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
              );
            }

            // Teams View
            if (!teamsData?.teams || teamsData.teams.length === 0) {
              return (
                <div className="py-20 text-center space-y-4">
                  <Users size={48} className="mx-auto text-white/10" />
                  <p className="text-white/20 text-sm uppercase tracking-widest">No teams found matching your criteria.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamsData.teams.map((team) => (
                  <div 
                    key={team._id} 
                    onClick={() => {
                      setSelectedTeam(team);
                      setIsTeamModalOpen(true);
                    }}
                    className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] cursor-pointer transition-all flex flex-col gap-6 group relative overflow-hidden"
                  >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#CCFF00]/5 blur-[100px] rounded-full group-hover:bg-[#CCFF00]/10 transition-all" />

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="text-[#CCFF00]" size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-[#CCFF00] transition-colors">{team.name}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest mt-1">
                            <span className="text-[#CCFF00]/80 font-black">{team.sportType}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1"><MapPin size={10} /> {team.city || 'Kridaz'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full">
                        <span className="text-[10px] font-black text-[#CCFF00] tracking-tighter uppercase">{team.teamCode}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-white">{team.memberCount}</p>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Players</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-white">{team.matchesPlayed}</p>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Matches</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-white">{team.totalScore}</p>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Scores</p>
                      </div>
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-3">
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Active Members</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members?.slice(0, 5).map((member, idx) => (
                          <div 
                            key={member.user?._id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (member.user?._id) navigate(`/profile/${member.user._id}`);
                            }}
                            className="w-8 h-8 rounded-full border border-white/10 overflow-hidden cursor-pointer hover:scale-110 hover:border-[#CCFF00] transition-all relative group/avatar"
                            title={member.user?.name}
                          >
                            {member.user?.profilePicture ? (
                              <img src={member.user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-white/40">
                                {member.user?.name?.[0] || 'P'}
                              </div>
                            )}
                          </div>
                        ))}
                        {team.memberCount > 5 && (
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/40">
                            +{team.memberCount - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/team/${team._id}`)}
                      className="w-full py-3 bg-white/5 hover:bg-[#CCFF00] hover:text-black border border-white/10 hover:border-[#CCFF00] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-[0_0_20px_rgba(204,255,0,0.1)] mt-auto"
                    >
                      Team Details
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
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

      <TeamMembersModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
        team={selectedTeam} 
      />
    </div>
  );
};

export default FindPlayers;
