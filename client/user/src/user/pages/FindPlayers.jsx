import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
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
  Check,
  MessageCircle,
  User
} from "lucide-react";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const avatarColors = ["#1a3300", "#001a33", "#330033", "#331a00", "#003333", "#1a0033"];
const avatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || "#1a1a1a";

const FindPlayers = () => {
  const dispatch = useDispatch();
  const { user: currentUser, isLoggedIn, followingIds } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    city: "",
    sport: ""
  });

  const sports = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis"];
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);

  useEffect(() => {
    fetchPlayers();
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
    gateInteraction(async () => {
      const isFollowing = followingIds.includes(targetUserId);
      try {
        const endpoint = `/api/user/players/${targetUserId}/${isFollowing ? 'unfollow' : 'follow'}`;
        const response = await axiosInstance.post(endpoint);
        
        if (response.data.success) {
          if (isFollowing) {
            dispatch(unfollowUser(targetUserId));
            toast.success("Unfollowed player");
          } else {
            dispatch(followUser(targetUserId));
            toast.success("Following player");
          }
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
      if (!player.hasActiveStory) return;
      
      const fetchStories = async () => {
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
      fetchStories();
    }, {
      title: "Watch Stories",
      message: "See the latest highlights, training sessions, and match updates from your favorite players. Sign in to view their stories."
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 md:pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Users size={48} className="mx-auto text-white/10" />
              <p className="text-white/20 text-sm uppercase tracking-widest">No players found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.map((player) => (
                <div 
                  key={player._id} 
                  className="group relative bg-neutral-900/50 rounded-[32px] border border-neutral-800 overflow-hidden hover:border-[#84CC16]/50 transition-all duration-500"
                >
                  {/* Image Section */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <div className="w-full h-full bg-[#84CC16]/10 flex items-center justify-center overflow-hidden">
                      {player.profilePicture ? (
                        <img 
                          src={player.profilePicture} 
                          alt={player.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onClick={() => handleAvatarClick(player)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                        style={{ display: player.profilePicture ? 'none' : 'flex' }}
                        onClick={() => handleAvatarClick(player)}
                      >
                        <User size={48} className="text-[#84CC16]" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />
                    
                    {/* Follow Button - Hidden for self */}
                    {(!currentUser || currentUser._id !== player._id) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(player._id);
                        }}
                        className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-20 ${
                          followingIds.includes(player._id) 
                            ? "bg-white/10 text-white/40 border border-white/10 hover:bg-white/20" 
                            : "bg-[#84CC16] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#84CC16]/20"
                        }`}
                      >
                        {followingIds.includes(player._id) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <Link to={`/profile/${player._id}`} className="block group/link">
                      <h3 className="font-display text-xl uppercase leading-none mb-1 group-hover/link:text-[#84CC16] transition-colors truncate">{player.name}</h3>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4 truncate">@{player.username || "player"}</p>
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest" style={{ 
                        color: player.bookingCount >= 100 ? "#F472B6" : player.bookingCount >= 50 ? "#818CF8" : player.bookingCount >= 20 ? "#84CC16" : "#64748B",
                      }}>
                        {player.bookingCount >= 100 ? "LEGEND" : player.bookingCount >= 50 ? "ELITE" : player.bookingCount >= 20 ? "PRO" : "BEGINNER"}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-white/20 uppercase tracking-widest">
                        <Users size={10} /> {player.followers?.length || 0}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                        <MapPin size={12} className="text-[#84CC16]" />
                        <span className="truncate max-w-[80px]">{player.city || "India"}</span>
                      </div>
                      {(!currentUser || currentUser._id !== player._id) && (
                        <button 
                          onClick={() => {
                            gateInteraction(() => navigate(`/messages?userId=${player._id}`), {
                              title: "Start a Conversation",
                              message: "Coordinate matches and discuss tactics. Sign in to chat."
                            });
                          }}
                          className="bg-white text-black p-2 rounded-lg hover:bg-[#84CC16] transition-all"
                        >
                          <MessageCircle size={16} />
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
