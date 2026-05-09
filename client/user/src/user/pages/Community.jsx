import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  X, 
  MoreVertical, 
  Send,
  Loader2,
  Trash2,
  Clock,
  User as UserIcon,
  Trophy,
  Edit,
  Edit3,
  Twitter,
  Facebook,
  Link as LinkIcon
} from "lucide-react";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const Community = () => {
  const { user, role, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'BMSP_ADMIN';

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
   const [loading, setLoading] = useState(true);
   const [isPublishing, setIsPublishing] = useState(false);
  
  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null });
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  
  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStory, setNewStory] = useState({ content: '', mediaFiles: [], durationDays: 1 });
  const [storyMediaPreviews, setStoryMediaPreviews] = useState([]);
  
  // Story viewer state
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Comment state
  const [activeDiscussion, setActiveDiscussion] = useState(null); // postId
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null); // { postId, commentId, text }

  useEffect(() => {
    fetchData();
    if (user) {
      fetchFollowingStatus();
    }
  }, [user]);

  const fetchFollowingStatus = async () => {
    try {
      const response = await axiosInstance.get("/api/user/players/network");
      const ids = (response.data.following || []).filter(p => p).map(p => p._id);
      setFollowingIds(ids);
    } catch (error) {
      console.error("Error fetching network:", error);
    }
  };

  useEffect(() => {
    let timer;
    if (selectedStoryGroup) {
      timer = setTimeout(() => {
        if (currentStoryIndex < selectedStoryGroup.stories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
        } else {
          setSelectedStoryGroup(null);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [selectedStoryGroup, currentStoryIndex]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch posts
    try {
      const res = await axiosInstance.get('/api/user/community');
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      toast.error("Failed to load community updates");
    }

    // Fetch stories
    try {
      const res = await axiosInstance.get('/api/user/stories/feed?all=true');
      setStories(res.data.stories || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }

    setLoading(false);
  };

  const handleAuthorAvatarClick = async (author) => {
    gateInteraction(async () => {
      if (!author?.hasActiveStory) return;
      
      try {
        const res = await axiosInstance.get(`/api/user/community/user-stories/${author._id}`);
        if (res.data.success && res.data.stories?.length > 0) {
          setSelectedStoryGroup({
            user: author,
            stories: res.data.stories
          });
          setCurrentStoryIndex(0);
        }
      } catch (error) {
        toast.error("Failed to load stories");
      }
    }, {
      title: "Watch Stories",
      message: "Sign in to see match highlights and updates from your favorite players."
    });
  };

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, image: file });
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content) return toast.error("Content is required");

    const formData = new FormData();
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    if (newPost.image) formData.append('image', newPost.image);

    setIsPublishing(true);
    try {
      if (editingPost) {
        await axiosInstance.put(`/api/user/community/${editingPost._id}`, formData);
        toast.success("Post updated successfully!");
      } else {
        await axiosInstance.post('/api/user/community', formData);
        toast.success("Post created successfully!");
      }
      closePostModal();
      fetchData();
    } catch (error) {
      console.error("Save Post Error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to save post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPost({ title: post.title || '', content: post.content, image: null });
    setPostImagePreview(post.image || post.imageUrl || null);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setEditingPost(null);
    setNewPost({ title: '', content: '', image: null });
    setPostImagePreview(null);
  };

  const handleStoryMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error("You can upload a maximum of 10 media files");
      return;
    }
    setNewStory({ ...newStory, mediaFiles: files });
    const previews = files.map(file => URL.createObjectURL(file));
    setStoryMediaPreviews(previews);
  };

  const handleUploadStory = async (e) => {
    e.preventDefault();
    if (!newStory.content && newStory.mediaFiles.length === 0) return toast.error("Story must have content or media");

    const formData = new FormData();
    formData.append('content', newStory.content);
    formData.append('durationDays', newStory.durationDays);
    
    newStory.mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    setIsPublishing(true);
    try {
      await axiosInstance.post('/api/user/stories', formData);
      toast.success("Story uploaded successfully!");
      setShowStoryModal(false);
      setNewStory({ content: '', mediaFiles: [], durationDays: 1 });
      setStoryMediaPreviews([]);
      fetchData();
    } catch (error) {
      console.error("Upload Story Error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to upload story");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axiosInstance.delete(`/api/user/community/${postId}`);
      toast.success("Post deleted");
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      await axiosInstance.delete(`/api/user/stories/${storyId}`);
      toast.success("Story deleted");
      setSelectedStoryGroup(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete story");
    }
  };

  const handleAddComment = async (postId) => {
    gateInteraction(async () => {
      if (!commentText.trim()) return;
      setIsSubmittingComment(true);
      try {
        const res = await axiosInstance.post(`/api/user/community/${postId}/comment`, { text: commentText });
        if (res.data.success) {
          setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data.comments } : p));
          setCommentText("");
          toast.success("Comment added!");
        }
      } catch (error) {
        toast.error("Failed to add comment");
      } finally {
        setIsSubmittingComment(false);
      }
    }, {
      title: "Join the Discussion",
      message: "Share your thoughts and connect with other athletes. Sign in to leave a comment on this post."
    });
  };

  const handleUpdateComment = async (postId, commentId) => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await axiosInstance.put(`/api/user/community/${postId}/comment/${commentId}`, { text: commentText });
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data.comments } : p));
        setCommentText("");
        setEditingComment(null);
        toast.success("Comment updated!");
      }
    } catch (error) {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await axiosInstance.delete(`/api/user/community/${postId}/comment/${commentId}`);
      if (res.data.success) {
        setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data.comments } : p));
        toast.success("Comment deleted!");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async (postId) => {
    gateInteraction(async () => {
      try {
        const res = await axiosInstance.post(`/api/user/community/${postId}/like`);
        if (res.data.success) {
          setPosts(posts.map(p => p._id === postId ? { 
            ...p, 
            likes: res.data.isLiked 
              ? [...(p.likes || []), user?._id] 
              : (p.likes || []).filter(id => id !== user?._id) 
          } : p));
        }
      } catch (error) {
        toast.error("Failed to like post");
      }
    }, {
      title: "Show Some Love",
      message: "Enjoying the content? Sign in to like this post and support the creator."
    });
  };

  const handleFollowToggle = async (targetUserId) => {
    gateInteraction(async () => {
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
    }, {
      title: "Follow Players",
      message: "Want to see more from this player? Sign in to follow them and stay updated."
    });
  };

  const [shareModalOpen, setShareModalOpen] = useState(null);

  const handleShare = (postId) => {
    setShareModalOpen(postId);
  };

  const handleShareToPlatform = (platform, postId) => {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    const encodedUrl = encodeURIComponent(url);
    const text = encodeURIComponent("Check out this post on TurfSpot!");
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text} ${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        setShareModalOpen(null);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShareModalOpen(null);
    }
  };

  const [highlightedPost, setHighlightedPost] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId && posts.length > 0) {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedPost(postId);
          setTimeout(() => setHighlightedPost(null), 3000);
        }, 500);
      }
    }
  }, [posts]);

  return (
    <div className="min-h-screen bg-black text-white pt-16 pb-20 md:pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Community <span className="text-[#84CC16]">Hub</span></h1>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest">Connect, Share, and Play</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                gateInteraction(() => setShowPostModal(true), {
                  title: "Share Your Update",
                  message: "Tell the community about your latest game or find new teammates. Sign in to create a post."
                });
              }}
              className="p-3 bg-[#84CC16] hover:bg-[#a3e635] text-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[#84CC16]/20 active:scale-95"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">New Post</span>
            </button>
          </div>
        </div>

        {/* Stories Section */}
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 sm:p-6 overflow-hidden">
          <h2 className="text-xs font-bold text-white/20 uppercase tracking-[0.2em] mb-4 sm:mb-6">Live Stories</h2>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 sm:pb-4 no-scrollbar">
            {/* Add Story Button — only shown for logged-in users */}
            {isLoggedIn && (
              <button 
                onClick={() => setShowStoryModal(true)}
                className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 group w-[72px] sm:w-auto"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#84CC16]/30 flex items-center justify-center group-hover:border-[#84CC16] transition-all relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#84CC16]/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#84CC16]" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#84CC16] rounded-full flex items-center justify-center border-2 border-black">
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase group-hover:text-white transition-colors truncate w-16 sm:w-20 text-center">Your Story</span>
              </button>
            )}

            {stories.length === 0 && (
              <div className="flex items-center text-white/20 text-[10px] sm:text-xs uppercase tracking-widest px-2 sm:px-4">
                No stories yet. Be the first!
              </div>
            )}

            {stories.map((group) => (
              <div 
                key={group.user._id} 
                onClick={() => {
                  // Stories are freely viewable by guests
                  setSelectedStoryGroup(group);
                  setCurrentStoryIndex(0);
                }}
                className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer group w-[72px] sm:w-auto"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] sm:p-[3px] bg-gradient-to-tr from-[#84CC16] to-[#4ade80] group-hover:scale-105 transition-all">
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
                    {group.stories[0].mediaUrl ? (
                      <img src={group.stories[0].mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-1 sm:p-2 text-[6px] sm:text-[8px] text-center line-clamp-3 leading-tight font-medium break-words">{group.stories[0].content}</div>
                    )}
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase truncate w-16 sm:w-20 text-center">
                  {group.user._id === user?._id ? "You" : (group.user.username || group.user.name || "Player")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Community Feed</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="text-[#84CC16] animate-spin" />
              <p className="text-white/20 text-xs uppercase tracking-widest">Gathering news...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-20 text-center space-y-4">
              <MessageCircle size={48} className="mx-auto text-white/10" />
              <p className="text-white/20 text-sm uppercase tracking-widest">No updates from TurfSpot yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div 
                key={post._id} 
                id={`post-${post._id}`}
                className={`bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all duration-500 ${highlightedPost === post._id ? 'ring-2 ring-[#84CC16] shadow-[0_0_30px_rgba(132,204,22,0.2)]' : ''}`}
              >
                {/* Post Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div 
                      className={`relative shrink-0 ${post.adminId?.hasActiveStory ? 'cursor-pointer' : ''}`}
                      onClick={(e) => {
                        if (post.adminId?.hasActiveStory) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAuthorAvatarClick(post.adminId);
                        }
                      }}
                    >
                      <div className={`w-10 h-10 rounded-xl border overflow-hidden bg-[#84CC16]/10 flex items-center justify-center shrink-0 transition-all ${post.adminId?.hasActiveStory ? 'border-[#84CC16] ring-2 ring-[#84CC16]/20' : 'border-[#84CC16]/20'}`}>
                        {post.adminId?.profilePicture ? (
                          <img 
                            src={post.adminId.profilePicture} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ display: post.adminId?.profilePicture ? 'none' : 'flex' }}
                        >
                          <User size={20} className="text-[#84CC16]" />
                        </div>
                      </div>
                    </div>
                    <Link to={`/profile/${post.adminId?._id}`} className="hover:opacity-80 transition-opacity">
                      <h3 className="font-bold uppercase tracking-wider text-sm">{post.adminId?.name || "TurfSpot Admin"}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                    {/* Follow button — only shown for logged-in users who are not the post author */}
                    {isLoggedIn && (!user || user._id !== post.adminId?._id) && (
                      <button 
                        onClick={() => handleFollowToggle(post.adminId?._id)}
                        className={`ml-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          followingIds.includes(post.adminId?._id) 
                            ? "bg-white/5 text-white/20 border border-white/10 hover:bg-white/10" 
                            : "bg-[#84CC16] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                        }`}
                      >
                        {followingIds.includes(post.adminId?._id) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                  {(isAdmin || user?._id === post.adminId?._id) && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditPost(post)}
                        className="p-2 hover:bg-[#84CC16]/10 text-white/20 hover:text-[#84CC16] rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="p-6 md:p-8 space-y-6">
                  {post.title && <h4 className="text-xl font-bold uppercase tracking-tight leading-tight">{post.title}</h4>}
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  {(post.image || post.imageUrl) && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/5">
                      <img src={post.image || post.imageUrl} alt="" className="w-full object-cover max-h-[400px] group-hover:scale-105 transition-all duration-700" />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-6 bg-white/[0.01] flex items-center gap-8 border-t border-white/5">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest ${post.likes?.includes(user?._id) ? 'text-[#84CC16]' : 'text-white/40 hover:text-[#84CC16]'}`}
                  >
                    <Heart size={18} fill={post.likes?.includes(user?._id) ? "currentColor" : "none"} /> 
                    {post.likes?.length || 0}
                  </button>
                  <button 
                    onClick={() => setActiveDiscussion(activeDiscussion === post._id ? null : post._id)}
                    className="flex items-center gap-2 text-white/40 hover:text-[#84CC16] transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <MessageCircle size={18} /> {post.comments?.length || 0} Comments
                  </button>
                  <button 
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-2 text-white/40 hover:text-[#84CC16] transition-colors text-xs font-bold uppercase tracking-widest ml-auto"
                  >
                    <Share2 size={18} /> Share
                  </button>
                </div>

                {/* Discussion Section */}
                {activeDiscussion === post._id && (
                  <div className="bg-white/[0.01] border-t border-white/5 p-6 md:p-8 space-y-6 animate-in slide-in-from-top duration-300">
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 flex items-center justify-center border border-[#84CC16]/20 shrink-0">
                        <UserIcon size={18} className="text-[#84CC16]" />
                      </div>
                      {isLoggedIn ? (
                        <div className="flex-1 space-y-3">
                          <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add to the discussion..."
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl min-h-[80px] p-4 text-white text-xs outline-none transition-all resize-none"
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={() => handleAddComment(post._id)}
                              disabled={isSubmittingComment || !commentText.trim()}
                              className="bg-[#84CC16] text-black px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-[#a3e635] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {isSubmittingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                              Post Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                          <p className="text-white/30 text-xs flex-1">Sign in to join the discussion...</p>
                          <button
                            onClick={() => gateInteraction(() => {}, { title: "Join the Discussion", message: "Share your thoughts and connect with other athletes. Sign in to comment." })}
                            className="px-4 py-2 bg-[#84CC16] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#a3e635] transition-all whitespace-nowrap"
                          >
                            Sign In
                          </button>
                        </div>
                      )}
                    </div>

                    {post.comments?.length > 0 && (
                      <div className="space-y-6 pt-4">
                        {post.comments.map((comment, idx) => (
                          <div key={idx} className="flex gap-4 group">
                            <div className="w-8 h-8 rounded-lg bg-[#84CC16]/10 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
                              {comment.userImage ? (
                                <img 
                                  src={comment.userImage} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ display: comment.userImage ? 'none' : 'flex' }}
                              >
                                <span className="text-[#84CC16] font-black text-[10px]">
                                  {comment.userName ? comment.userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : '?'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <Link to={`/profile/${comment.userId}`} className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest hover:underline">{comment.userName}</Link>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[8px] text-white/20 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    {comment.userId === user?._id && (
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => {
                                            setEditingComment({ postId: post._id, commentId: comment._id, text: comment.text });
                                            setCommentText(comment.text);
                                            window.scrollTo({ top: document.getElementById(`post-${post._id}`).offsetTop, behavior: 'smooth' });
                                          }}
                                          className="text-white/20 hover:text-[#84CC16] transition-colors"
                                        >
                                          <Edit3 size={12} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteComment(post._id, comment._id)}
                                          className="text-white/20 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {editingComment?.commentId === comment._id ? (
                                  <div className="space-y-3 mt-2">
                                    <textarea 
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      className="w-full bg-white/[0.03] border border-[#84CC16]/30 rounded-xl p-3 text-white text-xs outline-none transition-all resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => { setEditingComment(null); setCommentText(""); }}
                                        className="text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateComment(post._id, comment._id)}
                                        className="bg-[#84CC16] text-black px-4 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-[#a3e635]"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/60 text-xs leading-relaxed">{comment.text}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closePostModal} />
          <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider">{editingPost ? 'Edit Update' : 'Create Community Post'}</h3>
              <button onClick={closePostModal} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <input 
                type="text" 
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                placeholder="Title (Optional)"
                className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-12 px-4 text-white text-sm outline-none transition-all"
              />
              <textarea 
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                placeholder="Share the update with the community..."
                className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl min-h-[120px] p-4 text-white text-sm outline-none transition-all resize-none"
              />

              {postImagePreview && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 group">
                  <img src={postImagePreview} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => {setNewPost({...newPost, image: null}); setPostImagePreview(null);}}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="relative">
                  <button type="button" className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-white/40 hover:text-[#84CC16] hover:bg-[#84CC16]/5 transition-all flex items-center gap-2">
                    <ImageIcon size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{postImagePreview ? 'Change' : 'Add Image'}</span>
                  </button>
                  <input type="file" onChange={handlePostImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>

                <button 
                  type="submit"
                  disabled={isPublishing}
                  className="bg-[#84CC16] text-black px-8 h-12 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                  {isPublishing ? "Saving..." : (editingPost ? "Update" : "Publish")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowStoryModal(false)} />
          <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider">Share a Story</h3>
              <button onClick={() => setShowStoryModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadStory} className="p-6 space-y-4">
              <textarea 
                value={newStory.content}
                onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                placeholder="What's happening? Feeling inspired? Working out?"
                className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-24 p-4 text-white text-sm outline-none transition-all resize-none"
              />

              {storyMediaPreviews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                  {storyMediaPreviews.map((preview, idx) => (
                    <div key={idx} className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => {
                          const newFiles = [...newStory.mediaFiles];
                          const newPreviews = [...storyMediaPreviews];
                          newFiles.splice(idx, 1);
                          newPreviews.splice(idx, 1);
                          setNewStory({...newStory, mediaFiles: newFiles}); 
                          setStoryMediaPreviews(newPreviews);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="relative flex-1 min-w-[140px]">
                  <button type="button" className="w-full p-3 bg-white/[0.03] border border-white/5 rounded-xl text-white/40 hover:text-[#84CC16] hover:bg-[#84CC16]/5 transition-all flex items-center justify-center gap-2">
                    <ImageIcon size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{storyMediaPreviews.length > 0 ? 'Add More' : 'Add Photo/Video'}</span>
                  </button>
                  <input type="file" multiple onChange={handleStoryMediaChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                </div>

                <div className="relative flex-1 min-w-[140px]">
                  <select 
                    value={newStory.durationDays}
                    onChange={(e) => setNewStory({...newStory, durationDays: parseInt(e.target.value)})}
                    className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-12 px-4 text-white text-[10px] font-bold uppercase tracking-widest outline-none transition-all appearance-none text-center"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={2}>48 Hours</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isPublishing}
                  className="w-full bg-[#84CC16] text-black h-14 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                  {isPublishing ? "Posting..." : "Post Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Story Viewer */}
      {selectedStoryGroup && (
        <StoryViewer 
          storyGroup={selectedStoryGroup}
          onClose={() => setSelectedStoryGroup(null)}
          onDelete={handleDeleteStory}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#84CC16]">Share Post</h3>
              <button onClick={() => setShareModalOpen(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              <button 
                onClick={() => handleShareToPlatform('whatsapp', shareModalOpen)}
                className="flex flex-col items-center gap-3 text-white/60 hover:text-[#25D366] transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#25D366]/50 group-hover:bg-[#25D366]/10 transition-all">
                  <MessageCircle size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => handleShareToPlatform('twitter', shareModalOpen)}
                className="flex flex-col items-center gap-3 text-white/60 hover:text-[#1DA1F2] transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#1DA1F2]/50 group-hover:bg-[#1DA1F2]/10 transition-all">
                  <Twitter size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">X / Twitter</span>
              </button>
              
              <button 
                onClick={() => handleShareToPlatform('facebook', shareModalOpen)}
                className="flex flex-col items-center gap-3 text-white/60 hover:text-[#1877F2] transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#1877F2]/50 group-hover:bg-[#1877F2]/10 transition-all">
                  <Facebook size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
              </button>
              
              <button 
                onClick={() => handleShareToPlatform('copy', shareModalOpen)}
                className="flex flex-col items-center gap-3 text-white/60 hover:text-[#84CC16] transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-[#84CC16]/50 group-hover:bg-[#84CC16]/10 transition-all">
                  <LinkIcon size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Community;
