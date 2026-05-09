import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Search, UserPlus, UserMinus, Loader2, MapPin, Users } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const NetworkModal = ({ isOpen, onClose, userId, type, initialCount }) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchNetwork();
      if (currentUser) {
        fetchMyFollowing();
      }
    }
  }, [isOpen, userId, type, currentUser]);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/user/players/${userId}/network`);
      if (response.data.success) {
        setUsers(type === "followers" ? response.data.followers : response.data.following);
      }
    } catch (error) {
      toast.error("Failed to load network");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyFollowing = async () => {
    try {
      const response = await axiosInstance.get("/api/user/players/network");
      if (response.data.success) {
        setFollowingIds(response.data.following.map(u => u._id));
      }
    } catch (error) {
      console.error("Error fetching my network:", error);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    if (!currentUser) {
      toast.error("Please login to follow players");
      return;
    }
    const isFollowing = followingIds.includes(targetUser._id);
    try {
      if (isFollowing) {
        await axiosInstance.post(`/api/user/players/${targetUser._id}/unfollow`);
        setFollowingIds(followingIds.filter(id => id !== targetUser._id));
        toast.success(`Unfollowed ${targetUser.name}`);
      } else {
        await axiosInstance.post(`/api/user/players/${targetUser._id}/follow`);
        setFollowingIds([...followingIds, targetUser._id]);
        toast.success(`Following ${targetUser.name}`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aIsMutual = followingIds.includes(a._id);
    const bIsMutual = followingIds.includes(b._id);
    if (aIsMutual && !bIsMutual) return -1;
    if (!aIsMutual && bIsMutual) return 1;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            {type === "followers" ? "Followers" : "Following"}
            <span className="text-[#84CC16] bg-[#84CC16]/10 px-2 py-0.5 rounded-full text-[10px]">
              {initialCount}
            </span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#84CC16]/50 transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto no-scrollbar p-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-[#84CC16]" size={32} />
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="space-y-1">
              {sortedUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Link to={`/profile/${user._id}`} onClick={onClose} className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center bg-[#84CC16]/10"
                        style={{ display: user.profilePicture ? 'none' : 'flex' }}
                      >
                        <span className="text-[#84CC16] font-black text-[10px]">
                          {user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    </Link>
                    <div className="overflow-hidden">
                      <Link to={`/profile/${user._id}`} onClick={onClose} className="block font-bold text-xs text-white hover:text-[#84CC16] transition-colors truncate">
                        {user.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest truncate">
                        <span>@{user.username || "player"}</span>
                        {followingIds.includes(user._id) && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="text-[#84CC16]/60">Following</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentUser?._id !== user._id && (
                    <button
                      onClick={() => handleFollowToggle(user)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                        followingIds.includes(user._id)
                          ? "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                          : "bg-[#84CC16] text-black hover:scale-105 active:scale-95"
                      }`}
                    >
                      {followingIds.includes(user._id) ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
              <Users size={40} />
              <p className="text-[10px] uppercase tracking-[0.2em]">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkModal;
