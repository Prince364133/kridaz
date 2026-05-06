import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Search, 
  MapPin, 
  UserPlus, 
  UserMinus, 
  Loader2, 
  Star,
  Users,
  Trophy,
  Filter,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";

const FindPlayers = () => {
  const { user: currentUser, isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Debugging auth state
  useEffect(() => {
    console.log("FindPlayers Auth State:", { isLoggedIn, currentUser });
  }, [isLoggedIn, currentUser]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingIds, setFollowingIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    sport: ""
  });

  const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);

  useEffect(() => {
    fetchPlayers();
    if (currentUser) {
      fetchFollowingStatus();
    }
  }, [filters, currentUser]);

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
      if (q.length === 0) fetchPlayers();
      return;
    }

    try {
      const response = await axiosInstance.get(`/api/user/players/search?query=${q}`);
      setPlayers(response.data.players || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFollowToggle = async (targetUserId) => {
    if (!isLoggedIn || !currentUser) {
      console.warn("Follow toggle failed: User not logged in", { isLoggedIn, currentUser });
      toast.error("Please login to follow players");
      navigate("/login");
      return;
    }
    const isFollowing = followingIds.includes(targetUserId);
    try {
      const endpoint = isFollowing 
        ? `/api/user/players/${targetUserId}/unfollow` 
        : `/api/user/players/${targetUserId}/follow`;
        
      const response = await axiosInstance.post(endpoint);
      if (response.data.success) {
        if (isFollowing) {
          setFollowingIds(followingIds.filter(id => id !== targetUserId));
          toast.success("Unfollowed player");
        } else {
          setFollowingIds([...followingIds, targetUserId]);
          toast.success("Following player");
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update follow status";
      toast.error(message);
    }
  };

  const handleAvatarClick = async (player) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!player.hasActiveStory) return;
    
    try {
      const res = await axiosInstance.get(`/api/user/community/user-stories/${player._id}`);
      if (res.data.success && res.data.stories?.length > 0) {
        setViewingStoryGroup({
          user: player,
          stories: res.data.stories
        });
      }
    } catch (error) {
      toast.error("Failed to load stories");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 md:pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Compact Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-[0.2em] whitespace-nowrap hidden sm:block">Active Players</h2>
            
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16] transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="SEARCH PLAYERS..."
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 focus:border-[#84CC16]/50 rounded-xl h-10 pl-11 pr-4 text-white text-[10px] md:text-xs placeholder:text-white/20 outline-none transition-all uppercase tracking-widest font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {/* Quick Filters */}
              <select 
                value={filters.sport}
                onChange={(e) => handleFilterChange("sport", e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#84CC16] focus:border-[#84CC16]/50 outline-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option value="" className="bg-black text-white/40">All Sports</option>
                {sports.map(sport => (
                  <option key={sport} value={sport} className="bg-black text-white">{sport}</option>
                ))}
              </select>

              <div className="relative group">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16]" size={10} />
                <input 
                  type="text"
                  placeholder="LOCATION..."
                  value={filters.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/60 focus:text-[#84CC16] focus:border-[#84CC16]/50 outline-none w-28 md:w-32 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>

            <button 
              onClick={() => {
                setFilters({ city: "", sport: "" });
                setSearchQuery("");
                fetchPlayers();
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
            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 md:h-48 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Users size={48} className="mx-auto text-white/10" />
              <p className="text-white/20 text-sm uppercase tracking-widest">No players found matching your criteria.</p>
            </div>
          ) : (
          <div className="flex flex-col gap-1.5 md:gap-2">
            {players.map((player) => (
              <div key={player._id} className="bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2 md:px-5 md:py-2.5 hover:bg-white/[0.03] transition-all flex items-center gap-3 md:gap-8 group">
                
                {/* Profile Icon - High Density */}
                <div 
                  className={`w-12 h-12 rounded-full border-2 border-[#84CC16]/20 p-1 group-hover:border-[#84CC16]/50 transition-all flex items-center justify-center relative overflow-hidden ${player.hasActiveStory ? 'cursor-pointer' : ''}`}
                  style={{ backgroundColor: avatarColor(player.name) }}
                  onClick={() => handleAvatarClick(player)}
                >
                  {player.profilePicture && (
                    <img 
                      src={player.profilePicture} 
                      alt={player.name} 
                      className="w-full h-full rounded-full object-cover absolute inset-0 z-10" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-white font-bold text-lg relative z-0">
                    {player.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>

                {/* Unified Info Row */}
                <div className="flex-1 flex flex-row items-center justify-between gap-4 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-8 overflow-hidden min-w-0">
                    {/* Name & Username Block */}
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${player._id}`} className="font-bold text-xs md:text-sm text-white hover:text-[#84CC16] transition-colors truncate">
                        {player.name}
                      </Link>
                      <span className="text-[9px] md:text-[10px] font-bold text-white/10 uppercase tracking-widest truncate group-hover:text-white/20 transition-colors">
                        @{player.username || "player"}
                      </span>
                    </div>

                    {/* Meta Section */}
                    <div className="flex items-center gap-6">
                      {/* Level Badge - Ultra Compact */}
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5" style={{ 
                        color: player.bookingCount >= 100 ? "#F472B6" : player.bookingCount >= 50 ? "#818CF8" : player.bookingCount >= 20 ? "#84CC16" : "#64748B",
                      }}>
                        <Trophy size={9} className="opacity-40" />
                        <span>
                          {player.bookingCount >= 100 ? "LEGEND" : player.bookingCount >= 50 ? "ELITE" : player.bookingCount >= 20 ? "PRO" : "BEGINNER"}
                        </span>
                      </div>
                      
                      {/* Social Counts - Full Spelling Required */}
                      <div className="hidden sm:flex items-center gap-4 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/10 group-hover:text-white/20 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40 group-hover:text-white/60">{player.followers?.length || 0}</span>
                          <span className="opacity-50">Followers</span>
                        </div>
                        <div className="h-2 w-px bg-white/5"></div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40 group-hover:text-white/60">{player.following?.length || 0}</span>
                          <span className="opacity-50">Following</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Sticky Right */}
                  <div className="flex items-center gap-3 shrink-0">
                    {(!currentUser || currentUser._id !== player._id) && (
                      <button 
                        onClick={() => handleFollowToggle(player._id)}
                        className={`px-3 md:px-5 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                          followingIds.includes(player._id) 
                            ? "bg-white/5 text-white/20 border border-white/10 hover:bg-white/10" 
                            : "bg-[#84CC16] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                        }`}
                      >
                        {followingIds.includes(player._id) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
