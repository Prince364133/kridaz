import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send, MessageCircle,
  Wallet, CreditCard, Award, Target, LogOut
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { login, logout, updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "../hooks/useWriteReview";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import TurfBookingHistorySkeleton from "../components/ui/TurfBookingHistorySkeleton";
import TurfBookingHistory from "../components/turf/TurfBookingHistory";
import WriteReview from "../components/reviews/WriteReview";
import NetworkModal from "../components/modals/NetworkModal";
import StoryViewer from "../components/StoryViewer";
import EditProfileModal from "../components/modals/EditProfileModal";

const PRI = "#CCFF00";
const BDR = "#2D2D2D";

// Derive member level from booking count
const getMemberLevel = (count) => {
  if (count >= 100) return { label: "LEGEND", color: "#F472B6" }; // Pink
  if (count >= 50) return { label: "ELITE", color: "#818CF8" };  // Indigo
  if (count >= 20) return { label: "PRO", color: "#CCFF00" };    // Lime
  return { label: "BEGINNER", color: "#94A3B8" };              // Slate
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, role, token, followingIds } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);
  const targetUserId = isOwnProfile ? currentUser?._id : userId;
  const isAdmin = role && role.includes("ADMIN");
  const canEdit = isOwnProfile || isAdmin;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);
  const { loading, bookings } = useBookingHistory();
  const {
    isReviewModalOpen,
    rating,
    review,
    isSubmitting,
    openReviewModal,
    closeReviewModal,
    handleRatingChange,
    handleReviewChange,
    submitReview,
  } = useWriteReview();

  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "stories", or "bookings"
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "bookings") {
      setActiveTab("bookings");
    }
  }, [searchParams]);
  
  // For another user or own user we can fetch posts/stories
  const [userPosts, setUserPosts] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Network (Followers/Following)
  const [networkModal, setNetworkModal] = useState({ isOpen: false, type: "followers" });



  const onFollowClick = () => {
    gateInteraction(() => handleFollowToggle());
  };

  const handleFollowToggle = async () => {
    const isFollowing = followingIds.includes(targetUserId);
    try {
      if (isFollowing) {
        const response = await axiosInstance.post(`/api/user/players/${targetUserId}/unfollow`);
        if (response.data.success) {
          dispatch(unfollowUser(targetUserId));
          // Update local profile state to reflect follower count change
          setProfileUser(prev => ({
            ...prev,
            followers: prev.followers.filter(id => id !== currentUser._id)
          }));
          toast.success(`Unfollowed ${profileUser.name}`);
        }
      } else {
        const response = await axiosInstance.post(`/api/user/players/${targetUserId}/follow`);
        if (response.data.success) {
          dispatch(followUser(targetUserId));
          setProfileUser(prev => ({
            ...prev,
            followers: [...(prev.followers || []), currentUser._id]
          }));
          toast.success(`Following ${profileUser.name}`);
        }
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

  const handleMessageClick = () => {
    navigate(`/messages?userId=${targetUserId}`);
  };

  useEffect(() => {
    const fetchTargetProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axiosInstance.get(`/api/user/players/${targetUserId}`);
        if (res.data.success) {
          setProfileUser(res.data.profile);
          // Update Redux if it's our own profile to keep it in sync
          if (isOwnProfile) {
            dispatch(updateUser(res.data.profile));
          }
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    if (targetUserId) fetchTargetProfile();
  }, [targetUserId, isOwnProfile, dispatch]);

  const fetchUserContent = async (type) => {
    if (!targetUserId || targetUserId === "undefined") return;
    setLoadingContent(true);
    try {
      if (type === 'posts') {
        const res = await axiosInstance.get(`/api/user/community/user-posts/${targetUserId}`);
        if (res.data.success) setUserPosts(res.data.posts);
      } else if (type === 'stories') {
        const res = await axiosInstance.get(`/api/user/community/user-stories/${targetUserId}`);
        if (res.data.success && res.data.stories) {
          setUserStories(res.data.stories);
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch ${type}`);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleAvatarClick = async () => {
    if (!profileUser?.hasActiveStory) return;
    
    try {
      const res = await axiosInstance.get(`/api/user/community/user-stories/${targetUserId}`);
      if (res.data.success && res.data.stories?.length > 0) {
        setViewingStoryGroup({
          user: profileUser,
          stories: res.data.stories
        });
      }
    } catch (error) {
      toast.error("Failed to load stories");
    }
  };

  useEffect(() => {
    if (activeTab === 'posts' || activeTab === 'stories') {
      fetchUserContent(activeTab);
    } else if (activeTab === 'activity' && isOwnProfile) {
      fetchActivity();
    }
  }, [activeTab, targetUserId]);

  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await axiosInstance.get("/api/user/community/my-activity");
      if (res.data.success) {
        setActivity(res.data.activity);
      }
    } catch (error) {
      toast.error("Failed to fetch activity");
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleUpdateComment = async (postId, commentId) => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await axiosInstance.put(`/api/user/community/${postId}/comment/${commentId}`, { text: commentText });
      if (res.data.success) {
        setActivity(activity.map(a => a.postId === postId ? { 
          ...a, 
          myComments: a.myComments.map(c => c._id === commentId ? { ...c, text: commentText } : c)
        } : a));
        setEditingComment(null);
        setCommentText("");
        toast.success("Comment updated!");
      }
    } catch (error) {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await axiosInstance.delete(`/api/user/community/${postId}/comment/${commentId}`);
      if (res.data.success) {
        setActivity(activity.map(a => a.postId === postId ? { 
          ...a, 
          myComments: a.myComments.filter(c => c._id !== commentId)
        } : a).filter(a => a.myComments.length > 0 || a.isLiked));
        toast.success("Comment deleted!");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await axiosInstance.delete(`/api/user/community/${postId}`);
      if (res.data.success) {
        setUserPosts(userPosts.filter(p => p._id !== postId));
        toast.success("Post deleted!");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Delete this story?")) return;
    try {
      const res = await axiosInstance.delete(`/api/user/stories/${storyId}`);
      if (res.data.success) {
        setUserStories(userStories.filter(s => s._id !== storyId));
        toast.success("Story deleted!");
      }
    } catch (error) {
      toast.error("Failed to delete story");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    setUploading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      dispatch(updateUser({ profilePicture: response.data.profilePicture }));
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const memberLevel = getMemberLevel(profileUser?.bookingCount || (isOwnProfile ? bookings.length : 0));
  const totalSpent = isOwnProfile ? bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0) : 0;

  if (loadingProfile || (isOwnProfile && loading)) return <TurfBookingHistorySkeleton />;

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden">

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ HIGH DENSITY HEADER Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="border-b bg-black/40 sticky top-0 z-50 backdrop-blur-xl" style={{ borderColor: BDR }}>
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Identity Row */}
            <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
              {/* Profile Avatar */}
              <div className={`relative shrink-0 group ${profileUser?.hasActiveStory ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                <div
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border overflow-hidden relative bg-[#CCFF00]/5 transition-all ${profileUser?.hasActiveStory ? 'border-[#CCFF00] ring-2 ring-[#CCFF00]/20' : ''}`}
                  style={{ borderColor: profileUser?.hasActiveStory ? PRI : BDR }}
                >
                  {profileUser?.profilePicture ? (
                    <img 
                      src={profileUser.profilePicture} 
                      alt="" 
                      className="w-full h-full object-cover relative z-10" 
                      onError={(e) => { 
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  <div 
                    className="w-full h-full flex items-center justify-center bg-[#000000]"
                    style={{ display: profileUser?.profilePicture ? 'none' : 'flex' }}
                  >
                    <span className="text-[#CCFF00] font-black text-2xl tracking-tighter">
                      {profileUser?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
                    </span>
                  </div>
                  
                  {isOwnProfile && (
                    <label htmlFor="profile-upload" className={`absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all z-20`}>
                      <Camera size={14} className="text-white" />
                      <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Identity Block */}
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8 min-w-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <h1 className="text-sm md:text-lg font-black uppercase tracking-tight truncate text-white">
                      {profileUser?.name}
                    </h1>
                    {/* Level Tag - Integrated */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[8px] font-normal uppercase tracking-widest bg-[#CCFF00]/10 border border-[#2D2D2D]" style={{ color: memberLevel.color }}>
                      <Trophy size={8} className="opacity-40" />
                      {memberLevel.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-white/20">
                    <span className="text-[#CCFF00]/80">@{profileUser?.username}</span>
                    <span className="hidden md:inline text-white/10">Ã¢â‚¬Â¢</span>
                    <span className="hidden md:inline text-white/40">{profileUser?.role || "PLAYER"}</span>
                    <span className="text-white/10">Ã¢â‚¬Â¢</span>
                    <div className="flex items-center gap-2">
                      {(profileUser?.sportTypes || profileUser?.interests || ['Sports']).map(sport => (
                        <span key={sport} className="text-white/40">{sport}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Row - Full Spelling */}
                <div className="flex items-center gap-4 md:gap-8 border-l border-[#2D2D2D] md:pl-8 h-8">
                  <button 
                    onClick={() => setActiveTab("stats")}
                    className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white font-black text-xs md:text-sm">{profileUser?.stats?.cricket?.runs || 0}</span>
                    <span className="text-white/20 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Runs</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("stats")}
                    className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white font-black text-xs md:text-sm">{profileUser?.stats?.cricket?.wickets || 0}</span>
                    <span className="text-white/20 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Wickets</span>
                  </button>
                  <button 
                    onClick={() => setNetworkModal({ isOpen: true, type: 'followers' })}
                    className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white font-black text-xs md:text-sm">{profileUser?.followers?.length || 0}</span>
                    <span className="text-white/20 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Followers</span>
                  </button>
                  <button 
                    onClick={() => setNetworkModal({ isOpen: true, type: 'following' })}
                    className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white font-black text-xs md:text-sm">{profileUser?.following?.length || 0}</span>
                    <span className="text-white/20 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="shrink-0">
              {isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 md:px-4 md:py-2 rounded-lg border border-[#2D2D2D] text-[#999999] hover:text-white transition-all flex items-center gap-2"
                  >
                    <Edit3 size={14} />
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Edit Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 md:px-4 md:py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMessageClick}
                    className="p-2 md:px-4 md:py-2.5 rounded-xl border border-[#2D2D2D] text-[#999999] hover:text-white transition-all flex items-center gap-2 group"
                  >
                    <MessageCircle size={14} className="group-hover:text-[#CCFF00] transition-colors" />
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Message</span>
                  </button>

                  <button
                    onClick={onFollowClick}
                    className={`px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                      followingIds.includes(targetUserId)
                        ? "border border-[#2D2D2D] text-[#999999] hover:border-[#CCFF00]/30"
                        : "bg-[#CCFF00] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#CCFF00]/20"
                    }`}
                  >
                    {followingIds.includes(targetUserId) ? "Following" : "Follow"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NetworkModal 
        isOpen={networkModal.isOpen}
        onClose={() => setNetworkModal({ ...networkModal, isOpen: false })}
        userId={targetUserId}
        type={networkModal.type}
        initialCount={networkModal.type === "followers" ? (profileUser?.followers?.length || 0) : (profileUser?.following?.length || 0)}
      />

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
      />

      {/* Story Viewer */}
      {viewingStoryGroup && (
        <StoryViewer 
          storyGroup={viewingStoryGroup}
          onClose={() => setViewingStoryGroup(null)}
          onDelete={isOwnProfile ? handleDeleteStory : null}
          currentUser={currentUser}
        />
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CONTENT Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="max-w-5xl mx-auto px-6 pt-4">

        {/* Tabs â€“ exact match to OwnerDashboard filter pills */}
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          <div className="flex items-center gap-1 bg-[#2D2D2D] p-1 rounded-[6px]">
            {["posts", "stories", "stats"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-[4px] text-[11px] font-normal uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "bg-[#CCFF00] text-black"
                    : "text-[#999999] hover:text-[#FFFFFF]"
                }`}
              >
                {tab}
              </button>
            ))}
            {isOwnProfile && (
              <>
                {["bookings", "activity"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-[4px] text-[11px] font-normal uppercase tracking-wider transition-all ${
                      activeTab === tab
                        ? "bg-[#CCFF00] text-black"
                        : "text-[#999999] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>


        {/* Ã¢â€â‚¬Ã¢â€â‚¬ POSTS TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {loadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-20 rounded-[8px] border border-dashed" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
                <p className="text-gray-500 uppercase tracking-widest text-sm">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post) => (
                  <div key={post._id} className="rounded-[8px] border overflow-hidden bg-[#000000] group relative" style={{ borderColor: BDR }}>
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="" className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-white/20 p-6 text-center text-sm">
                        {post.content}
                      </div>
                    )}
                    <div className="p-4">
                      {post.mediaUrl && <p className="text-sm text-gray-300 mb-2 truncate">{post.content}</p>}
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1"><Heart size={12}/> {post.likesCount}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.comments?.length || 0}</span>
                        </div>
                      </div>
                      
                      {/* Manage Actions */}
                      {canEdit && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-black/60 rounded-full text-white/50 hover:text-red-500" onClick={() => handleDeletePost(post._id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ STORIES TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "stories" && (
          <div className="space-y-6">
            {loadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            ) : userStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-20 rounded-[8px] border border-dashed" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
                <p className="text-gray-500 uppercase tracking-widest text-sm">No active stories</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {userStories.map((story) => (
                  <div key={story._id} className="relative w-40 h-64 shrink-0 rounded-2xl overflow-hidden border group" style={{ borderColor: BDR }}>
                    {story.mediaUrl ? (
                      <img 
                        src={story.mediaUrl} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-[#000000] p-4 flex items-center justify-center text-center text-xs ${story.mediaUrl ? 'hidden' : 'flex'}`}>
                      {story.content}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white">
                      {new Date(story.createdAt).toLocaleTimeString()}
                    </div>
                    {canEdit && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 bg-black/60 rounded-full text-white/50 hover:text-red-500" onClick={() => handleDeleteStory(story._id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ STATS TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "stats" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header / Career Summary */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">Cricket Career</h3>
              <div className="px-4 py-1.5 rounded-[6px] bg-[#CCFF00]/10 border border-[#2D2D2D] text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Verified stats
              </div>
            </div>

            {/* Batting Bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Matches</span>
                  <span className="text-4xl font-black text-white">{profileUser?.stats?.cricket?.matches || 0}</span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Runs</span>
                  <span className="text-4xl font-black text-[#CCFF00]">{profileUser?.stats?.cricket?.runs || 0}</span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Average</span>
                  <span className="text-4xl font-black text-white">
                    {profileUser?.stats?.cricket?.battingAverage ? Number(profileUser.stats.cricket.battingAverage).toFixed(2) : '0.00'}
                  </span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Strike Rate</span>
                  <span className="text-4xl font-black text-white">
                    {profileUser?.stats?.cricket?.battingStrikeRate ? Number(profileUser.stats.cricket.battingStrikeRate).toFixed(2) : '0.00'}
                  </span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Highest</span>
                  <span className="text-4xl font-black text-white">{profileUser?.stats?.cricket?.highestScore || 0}</span>
               </div>
            </div>
            
            {/* Bowling Bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Wickets</span>
                  <span className="text-4xl font-black text-[#CCFF00]">{profileUser?.stats?.cricket?.wickets || 0}</span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Average</span>
                  <span className="text-4xl font-black text-white">
                    {profileUser?.stats?.cricket?.bowlingAverage ? Number(profileUser.stats.cricket.bowlingAverage).toFixed(2) : '0.00'}
                  </span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Economy</span>
                  <span className="text-4xl font-black text-white">
                    {profileUser?.stats?.cricket?.bowlingEconomy ? Number(profileUser.stats.cricket.bowlingEconomy).toFixed(2) : '0.00'}
                  </span>
               </div>
               <div className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col justify-center group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Best Bowling</span>
                  <span className="text-2xl font-black text-white">
                    {profileUser?.stats?.cricket?.bestBowling?.wickets || 0}/{profileUser?.stats?.cricket?.bestBowling?.runs || 0}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
               {/* Milestones */}
               <div className="bg-[#000000] border border-[#2D2D2D] p-6 rounded-[8px] group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block text-gray-500">Major Milestones</span>
                  <div className="flex gap-12">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Centuries</span>
                       <span className="text-5xl font-black text-white">{profileUser?.stats?.cricket?.hundreds || 0}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fifties</span>
                       <span className="text-5xl font-black text-white">{profileUser?.stats?.cricket?.fifties || 0}</span>
                    </div>
                  </div>
               </div>

               {/* Fielding */}
               <div className="bg-[#000000] border border-[#2D2D2D] p-6 rounded-[8px] group hover:border-[#CCFF00]/30 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block text-gray-500">Fielding Prowess</span>
                  <div className="flex gap-12">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catches</span>
                       <span className="text-5xl font-black text-[#CCFF00]">{profileUser?.stats?.cricket?.catches || 0}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stumpings</span>
                       <span className="text-5xl font-black text-white">{profileUser?.stats?.cricket?.stumpings || 0}</span>
                    </div>
                  </div>
                </div>
             </div>

             {/* Ã¢â€â‚¬Ã¢â€â‚¬ EARNED BADGES Ã¢â€â‚¬Ã¢â€â‚¬ */}
             <div className="mt-12">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center">
                     <Award className="text-[#CCFF00]" size={16} />
                   </div>
                   <h3 className="text-xl font-black uppercase tracking-tighter">Achievement Badges</h3>
                 </div>
                 <div className="px-4 py-1.5 rounded-[6px] bg-[#CCFF00]/10 border border-[#2D2D2D] text-[10px] font-normal text-[#878C9F] uppercase tracking-widest">
                   {profileUser?.badges?.length || 0} Unlocked
                 </div>
               </div>

               {profileUser?.badges && profileUser.badges.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {profileUser.badges.map((badge, idx) => {
                     const IconMap = {
                       Trophy: Trophy,
                       Target: Target,
                       Activity: Activity,
                       Star: Star,
                       Zap: Zap
                     };
                     const IconComponent = IconMap[badge.icon] || Award;

                     return (
                       <div 
                         key={idx}
                         className="bg-[#000000] border border-[#2D2D2D] p-5 rounded-[8px] flex items-center gap-5 group hover:border-[#CCFF00]/30 transition-all hover:bg-[#0F0F0F] relative overflow-hidden"
                       >
                         {/* Shine effect */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/0 via-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         <div className="w-10 h-10 rounded-[6px] bg-[#CCFF00]/10 border border-[#2D2D2D] flex items-center justify-center shrink-0 transition-transform relative z-10">
                           <IconComponent className="text-[#CCFF00]" size={24} />
                         </div>
                         <div className="flex flex-col min-w-0 relative z-10">
                           <span className="text-xs font-black uppercase tracking-tight text-white truncate">{badge.name}</span>
                           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate mb-1">{badge.category}</span>
                           <p className="text-[8px] text-white/30 font-medium leading-tight line-clamp-2">{badge.description}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center gap-4 text-center py-20 rounded-[8px] group transition-all hover:border-[#CCFF00]/10">
                   <div className="w-20 h-20 rounded-[8px] bg-[#CCFF00]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                     <Award size={32} className="text-gray-700 opacity-20" />
                   </div>
                   <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-2">The Hall of Fame awaits</h4>
                   <p className="text-gray-500 uppercase tracking-[0.2em] text-[9px] font-bold max-w-xs mx-auto leading-relaxed">
                     Complete matches and reach career milestones to unlock your first achievement badge.
                   </p>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ BOOKINGS TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "bookings" && (
          <TurfBookingHistory />
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ ACTIVITY TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "activity" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {loadingActivity ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Scanning Social Database...</p>
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-20 rounded-[8px] border border-dashed space-y-6" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#111", border: `1px solid ${BDR}` }}>
                  <MessageSquare size={32} className="text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight">Quiet on the Field</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase tracking-widest leading-loose">
                  You haven't engaged with any community updates yet. Join the conversation!
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {activity.map((item) => (
                  <div key={item.postId} className="group bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 md:p-8 transition-all hover:border-[#CCFF00]/20" style={{ borderColor: BDR }}>
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Post Context */}
                      <div className="w-full md:w-1/3 space-y-4">
                        <div className="aspect-video rounded-2xl overflow-hidden border border-[#2D2D2D] relative bg-[#000000]">
                          {item.postImage ? (
                            <img src={item.postImage} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#CCFF00]/20 bg-[#1a1a1a]">
                                <span className="text-4xl font-black tracking-tighter">
                                  {item.adminName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P"}
                                </span>
                              </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                            <span className="text-[8px] font-normal text-[#CCFF00] uppercase tracking-widest mb-1">{item.adminName}</span>
                            <h4 className="text-xs font-bold uppercase tracking-widest line-clamp-2">{item.postTitle}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 px-2">
                          {item.isLiked && (
                            <div className="flex items-center gap-1.5 text-[#CCFF00]">
                              <Heart size={12} fill="currentColor" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Liked</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-white/40">
                            <MessageSquare size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.myComments.length} Comments</span>
                          </div>
                        </div>
                      </div>

                      {/* Your Comments */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Edit2 size={12} className="text-[#CCFF00]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Your Interactions</span>
                        </div>
                        <div className="space-y-3">
                          {item.myComments.map((comment) => (
                            <div key={comment._id} className="bg-white/[0.02] border border-[#2D2D2D] rounded-[8px] p-5 relative group/comment transition-all hover:bg-white/[0.04]">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">{new Date(comment.createdAt).toLocaleString()}</span>
                                <div className="flex gap-4 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => { setEditingComment({ postId: item.postId, commentId: comment._id }); setCommentText(comment.text); }}
                                    className="text-[#999999] hover:text-[#CCFF00] transition-colors"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(item.postId, comment._id)}
                                    className="text-white/20 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {editingComment?.commentId === comment._id ? (
                                <div className="space-y-4">
                                  <textarea 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="w-full bg-black/40 border border-[#CCFF00]/30 rounded-[8px] p-4 text-white text-xs outline-none focus:border-[#CCFF00] transition-all resize-none min-h-[100px]"
                                  />
                                  <div className="flex justify-end gap-3">
                                    <button 
                                      onClick={() => { setEditingComment(null); setCommentText(""); }}
                                      className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white"
                                    >
                                      Discard
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateComment(item.postId, comment._id)}
                                      disabled={isSubmittingComment}
                                      className="bg-[#CCFF00] text-black px-6 py-2 rounded-[8px] font-normal uppercase tracking-wider text-[10px] flex items-center gap-2 hover:scale-105 transition-all"
                                    >
                                      {isSubmittingComment ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                                      Update
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-white/70 text-xs leading-relaxed italic italic">"{comment.text}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <WriteReview
          rating={rating}
          review={review}
          isSubmitting={isSubmitting}
          onClose={closeReviewModal}
          onRatingChange={handleRatingChange}
          onReviewChange={handleReviewChange}
          onSubmit={submitReview}
        />
      )}
    </div>
  );
}




