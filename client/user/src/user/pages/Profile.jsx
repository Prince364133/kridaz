import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2, MessageSquare, Heart, Edit3, Trash2, Loader2, Send
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { login, updateUser } from "@redux/slices/authSlice";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "../hooks/useWriteReview";
import TurfBookingHistorySkeleton from "../components/ui/TurfBookingHistorySkeleton";
import WriteReview from "../components/reviews/WriteReview";
import NetworkModal from "../components/modals/NetworkModal";
import StoryViewer from "../components/StoryViewer";
import EditProfileModal from "../components/modals/EditProfileModal";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

// Derive member level from booking count
const getMemberLevel = (count) => {
  if (count >= 100) return { label: "LEGEND", color: "#F472B6" }; // Pink
  if (count >= 50) return { label: "ELITE", color: "#818CF8" };  // Indigo
  if (count >= 20) return { label: "PRO", color: "#84CC16" };    // Lime
  return { label: "BEGINNER", color: "#94A3B8" };              // Slate
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, role, token } = useSelector((state) => state.auth);
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
  const [myFollowingIds, setMyFollowingIds] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchMyFollowing();
    }
  }, [currentUser]);

  const fetchMyFollowing = async () => {
    try {
      const response = await axiosInstance.get("/api/user/players/network");
      if (response.data.success) {
        setMyFollowingIds((response.data.following || []).filter(u => u).map(u => u._id));
      }
    } catch (error) {
      console.error("Error fetching my network:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please login to follow players");
      return;
    }
    const isFollowing = myFollowingIds.includes(targetUserId);
    try {
      if (isFollowing) {
        await axiosInstance.post(`/api/user/players/${targetUserId}/unfollow`);
        setMyFollowingIds(myFollowingIds.filter(id => id !== targetUserId));
        // Update local profile state to reflect follower count change
        setProfileUser(prev => ({
          ...prev,
          followers: prev.followers.filter(id => id !== currentUser._id)
        }));
        toast.success(`Unfollowed ${profileUser.name}`);
      } else {
        await axiosInstance.post(`/api/user/players/${targetUserId}/follow`);
        setMyFollowingIds([...myFollowingIds, targetUserId]);
        setProfileUser(prev => ({
          ...prev,
          followers: [...(prev.followers || []), currentUser._id]
        }));
        toast.success(`Following ${profileUser.name}`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
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
  }, [targetUserId, isOwnProfile, currentUser]);

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

      {/* ── HIGH DENSITY HEADER ── */}
      <div className="border-b bg-[#050505] sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: BDR }}>
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Identity Row */}
            <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
              {/* Profile Avatar */}
              <div className={`relative shrink-0 group ${profileUser?.hasActiveStory ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border overflow-hidden relative bg-[#111] transition-all ${profileUser?.hasActiveStory ? 'border-[#84CC16] ring-2 ring-[#84CC16]/20' : ''}`}
                  style={{ borderColor: profileUser?.hasActiveStory ? '#84CC16' : BDR }}
                >
                  <User size={18} style={{ color: PRI }} className="absolute inset-0 m-auto opacity-40" />
                  {profileUser?.profilePicture && (
                    <img 
                      src={profileUser.profilePicture} 
                      alt="" 
                      className="w-full h-full object-cover relative z-10" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  
                  {isOwnProfile && (
                    <label htmlFor="profile-upload" className={`absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all`}>
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
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/5" style={{ color: memberLevel.color }}>
                      <Trophy size={8} className="opacity-40" />
                      {memberLevel.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-white/20">
                    <span className="text-[#84CC16]/60">@{profileUser?.username}</span>
                    <span className="hidden md:inline text-white/10">•</span>
                    <span className="hidden md:inline">{profileUser?.role || "USER"}</span>
                    <span className="text-white/10">•</span>
                    <div className="flex items-center gap-2">
                      {(profileUser?.sportTypes || profileUser?.interests || ['Sports']).map(sport => (
                        <span key={sport} className="text-white/40">{sport}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Row - Full Spelling */}
                <div className="flex items-center gap-4 md:gap-8 border-l border-white/5 md:pl-8 h-8">
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
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 md:px-4 md:py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 md:px-8 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                    myFollowingIds.includes(targetUserId)
                      ? "bg-white/5 text-white/20 border border-white/10 hover:bg-white/10"
                      : "bg-[#84CC16] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#84CC16]/20"
                  }`}
                >
                  {myFollowingIds.includes(targetUserId) ? "Following" : "Follow"}
                </button>
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

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-6 pt-4">

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-12 border-b overflow-x-auto no-scrollbar" style={{ borderColor: BDR }}>
          <button 
            onClick={() => setActiveTab("posts")}
            className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'posts' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Posts
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: PRI }} />}
          </button>
          <button 
            onClick={() => setActiveTab("stories")}
            className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'stories' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Stories
            {activeTab === 'stories' && <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: PRI }} />}
          </button>
          
          {isOwnProfile && (
            <>
              <button 
                onClick={() => setActiveTab("bookings")}
                className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'bookings' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Bookings
                {activeTab === 'bookings' && <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: PRI }} />}
              </button>
              <button 
                onClick={() => setActiveTab("activity")}
                className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'activity' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Activity
                {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ backgroundColor: PRI }} />}
              </button>
            </>
          )}
        </div>

        {/* ── POSTS TAB ── */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {loadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#84CC16]" /></div>
            ) : userPosts.length === 0 ? (
              <div className="p-16 text-center rounded-[32px] border" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
                <p className="text-gray-500 uppercase tracking-widest text-sm">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post) => (
                  <div key={post._id} className="rounded-2xl border overflow-hidden bg-[#0A0A0A] group relative" style={{ borderColor: BDR }}>
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

        {/* ── STORIES TAB ── */}
        {activeTab === "stories" && (
          <div className="space-y-6">
            {loadingContent ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#84CC16]" /></div>
            ) : userStories.length === 0 ? (
              <div className="p-16 text-center rounded-[32px] border" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
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
                    <div className={`w-full h-full bg-[#111] p-4 flex items-center justify-center text-center text-xs ${story.mediaUrl ? 'hidden' : 'flex'}`}>
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

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity size={14} style={{ color: PRI }} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Total Activity · {bookings.length} Records
                </span>
              </div>
              <Link
                to="/turfs"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#84CC16] transition-colors"
              >
                Book New Slot <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-6">
              {bookings.length === 0 ? (
                <div
                  className="p-16 text-center rounded-[32px] border space-y-6"
                  style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#111", border: `1px solid ${BDR}` }}>
                    <Calendar size={32} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">No Bookings Yet</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                      You haven't booked any venues yet. Explore local arenas and start playing!
                    </p>
                  </div>
                  <Link
                    to="/turfs"
                    className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all hover:scale-105 text-black"
                    style={{ backgroundColor: PRI }}
                  >
                    Explore Venues <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:border-[#84CC16]/30"
                    style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: PRI }} />
                    <div className="p-5 md:p-8">
                      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                        <div className="shrink-0">
                          <div className="p-3 bg-white rounded-2xl">
                            <img src={booking.qrCode} alt="Booking QR" className="w-28 h-28" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center mt-2">Entry Pass</p>
                        </div>
                        <div className="flex-1 space-y-5 w-full">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <h2 className="text-2xl font-bold uppercase tracking-tight text-white group-hover:text-[#84CC16] transition-colors">
                                {booking.turf.name}
                              </h2>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <MapPin size={11} style={{ color: PRI }} />
                                {booking.turf.location}
                              </div>
                            </div>
                            <div
                              className="px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                              style={{ borderColor: `${PRI}33`, color: PRI, backgroundColor: `${PRI}10` }}
                            >
                              Confirmed
                            </div>
                          </div>
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-5 border-t"
                            style={{ borderColor: BDR }}
                          >
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Booking Date</p>
                              <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <Calendar size={12} style={{ color: PRI }} />
                                {booking.timeSlot.date}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Time Slot</p>
                              <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <Clock size={12} style={{ color: PRI }} />
                                {booking.timeSlot.formattedStartTime} – {booking.timeSlot.formattedEndTime}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Amount Paid</p>
                              <div className="flex items-center gap-1 font-bold text-xl" style={{ color: PRI }}>
                                <IndianRupee size={15} />
                                {booking.totalPrice}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => openReviewModal(booking.turf._id)}
                              className="flex items-center gap-2 px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl hover:border-[#84CC16]/50 hover:text-[#84CC16] group/btn"
                              style={{ borderColor: BDR, color: "#888" }}
                            >
                              <Star size={12} className="group-hover/btn:fill-[#84CC16] group-hover/btn:text-[#84CC16] transition-all" />
                              Write a Review
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === "activity" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {loadingActivity ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={32} className="animate-spin text-[#84CC16]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Scanning Social Database...</p>
              </div>
            ) : activity.length === 0 ? (
              <div className="p-16 text-center rounded-[32px] border space-y-6" style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}>
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
                  <div key={item.postId} className="group bg-[#0A0A0A] border rounded-[2rem] p-6 md:p-8 transition-all hover:border-[#84CC16]/20" style={{ borderColor: BDR }}>
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Post Context */}
                      <div className="w-full md:w-1/3 space-y-4">
                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/5 relative bg-[#111]">
                          {item.postImage ? (
                            <img src={item.postImage} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/5">
                              <User size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                            <span className="text-[8px] font-bold text-[#84CC16] uppercase tracking-widest mb-1">{item.adminName}</span>
                            <h4 className="text-xs font-bold uppercase tracking-widest line-clamp-2">{item.postTitle}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 px-2">
                          {item.isLiked && (
                            <div className="flex items-center gap-1.5 text-[#84CC16]">
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
                          <Edit2 size={12} className="text-[#84CC16]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Your Interactions</span>
                        </div>
                        <div className="space-y-3">
                          {item.myComments.map((comment) => (
                            <div key={comment._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative group/comment transition-all hover:bg-white/[0.04]">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">{new Date(comment.createdAt).toLocaleString()}</span>
                                <div className="flex gap-4 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => { setEditingComment({ postId: item.postId, commentId: comment._id }); setCommentText(comment.text); }}
                                    className="text-white/20 hover:text-[#84CC16] transition-colors"
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
                                    className="w-full bg-black/40 border border-[#84CC16]/30 rounded-xl p-4 text-white text-xs outline-none focus:border-[#84CC16] transition-all resize-none min-h-[100px]"
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
                                      className="bg-[#84CC16] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 hover:scale-105 transition-all"
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
