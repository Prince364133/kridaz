import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { 
  Heart, MessageCircle, Plus, Image as ImageIcon, X, MoreVertical, Send,
  Loader2, Trash2, User as UserIcon, Trophy, Edit3,
  ChevronDown, BarChart3, Users, Zap,
  ShieldCheck, MonitorPlay, FileText,
  Circle, Bookmark, Smile, Search, Video, Home, Bell, PlaySquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StoryViewer from "@features/networking/components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import {
  communityApi,
  useGetCommunityFeedQuery,
  useGetStoriesFeedQuery,
  useGetCommunityStatsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteStoryMutation,
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation
} from "@redux/api/communityApi";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import ReelItem from "@features/reels/components/ReelItem";
import { useSocket } from "@context/SocketContext";
import { uploadFileToR2 } from "@utils/mediaUpload";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif" };

const Community = () => {
  // @ts-ignore
  const { user, role, followingIds } = useSelector((state) => state.auth);
  const dispatch = /** @type {any} */ (useDispatch());
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'BMSP_ADMIN';

  // RTK Query Hooks
  const { data: communityData, isLoading: feedLoading } = useGetCommunityFeedQuery();
  const { data: storiesData } = useGetStoriesFeedQuery();
  const { data: statsData } = useGetCommunityStatsQuery();
  
  const [createPost] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteStory] = useDeleteStoryMutation();

  const [getStoryUploadUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStoryUpload] = useConfirmStoryUploadMutation();

  const { socket } = useSocket();

  const [activeFilter, setActiveFilter] = useState("All");
  const [activePanel, setActivePanel] = useState(null); // 'messages' | 'notifications' | null
  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  // Reels feed data
  const [reelCursor, setReelCursor] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const { data: reelsData, isLoading: reelsLoading, isFetching: reelsFetching } = useGetReelsFeedQuery(
    { cursor: reelCursor },
    { skip: activeFilter !== "Reels" }
  );
  const reels = reelsData?.reels || [];

  const rawPosts = communityData?.posts || [];
  const posts = rawPosts.filter(post => {
    if (activeFilter === "Reels") {
      return post.image || post.imageUrl || post.videoUrl;
    }
    if (activeFilter === "Following") {
      const authorId = post.adminId?._id || post.adminId || post.user?._id || post.user;
      return followingIds?.includes(authorId);
    }
    return true;
  });
  const stories = storiesData?.stories || [];
  const loading = feedLoading;

  // Socket Listeners for Real-time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          if (!draft.posts.find(p => p._id === newPost._id)) {
            draft.posts.unshift(newPost);
          }
        })
      );
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = (parseInt(draft.stats.posts) + 1).toString();
        })
      );
    };

    const handlePostLiked = ({ postId, likes }) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === postId);
          if (post) {
            post.likes = likes;
          }
        })
      );
    };

    const handlePostCommented = ({ postId, comments }) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === postId);
          if (post) {
            post.comments = comments;
          }
        })
      );
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.comments = (parseInt(draft.stats.comments) + 1).toString();
        })
      );
    };

    const handlePostDeleted = (postId) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          draft.posts = draft.posts.filter(p => p._id !== postId);
        })
      );
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = Math.max(0, parseInt(draft.stats.posts) - 1).toString();
        })
      );
    };

    const handleMediaProgress = ({ mediaId, progress }) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === mediaId);
          if (post) {
            post.status = 'pending';
            post.processingProgress = progress;
          }
        })
      );
    };

    const handleMediaComplete = ({ mediaId, hlsUrl, thumbnailUrl }) => {
      // @ts-ignore
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === mediaId);
          if (post) {
            post.status = 'ready';
            post.mediaUrl = hlsUrl;
            post.image = thumbnailUrl;
            post.processingProgress = 100;
          }
        })
      );
      // @ts-ignore
      dispatch(communityApi.util.invalidateTags(['Community', 'Stories']));
    };

    socket.on('new_community_post', handleNewPost);
    socket.on('community_post_liked', handlePostLiked);
    socket.on('community_post_commented', handlePostCommented);
    socket.on('community_post_deleted', handlePostDeleted);
    socket.on('MEDIA_PROCESSING_PROGRESS', handleMediaProgress);
    socket.on('MEDIA_PROCESSING_COMPLETE', handleMediaComplete);

    return () => {
      socket.off('new_community_post', handleNewPost);
      socket.off('community_post_liked', handlePostLiked);
      socket.off('community_post_commented', handlePostCommented);
      socket.off('community_post_deleted', handlePostDeleted);
      socket.off('MEDIA_PROCESSING_PROGRESS', handleMediaProgress);
      socket.off('MEDIA_PROCESSING_COMPLETE', handleMediaComplete);
    };
  }, [socket, dispatch]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null });
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStory, setNewStory] = useState({ content: '', mediaFiles: [], durationDays: 1 });
  const [storyMediaPreviews, setStoryMediaPreviews] = useState([]);
  
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);


  const [commentInputs, setCommentInputs] = useState({});

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!showGlobalSearch) return;
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axiosInstance.get('/api/user/players', { params: { search: searchQuery } });
        if (res.data?.success) {
          setSearchResults(res.data.players || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showGlobalSearch]);

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, image: file });
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content && !newPost.image) return toast.error("Content or image is required");

    setIsPublishing(true);
    try {
      if (editingPost) {
        // We'll keep update post as is or refactor later if needed, 
        // usually it's just updating text.
        const formData = new FormData();
        if (newPost.title) formData.append('title', newPost.title);
        if (newPost.content) formData.append('content', newPost.content);
        await updatePost({ id: editingPost._id, data: formData }).unwrap();
        toast.success("Post updated!");
        closePostModal();
      } else {
        if (newPost.image) {
          // Use Flash Upload (Backgrounding)
          dispatch(startUpload({
            id: Date.now().toString(),
            file: newPost.image,
            previewUrl: URL.createObjectURL(newPost.image),
            metadata: {
              type: 'community',
              title: newPost.title,
              content: newPost.content || ''
            }
          }));
        } else {
          // Plain text post (unlikely with current UI but handled)
          await createPost({ title: newPost.title, content: newPost.content }).unwrap();
          toast.success("Post created!");
        }
        closePostModal();
      }
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to save post");
    } finally {
      setIsPublishing(false);
    }
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
      toast.error("Maximum 10 media files allowed");
      return;
    }
    setNewStory({ ...newStory, mediaFiles: files });
    const previews = files.map(file => URL.createObjectURL(file));
    setStoryMediaPreviews(previews);
  };

  const handleUploadStory = async (e) => {
    e.preventDefault();
    if (!newStory.content && newStory.mediaFiles.length === 0) return toast.error("Story must have content or media");

    // If exactly one media file, use Flash Upload (Backgrounding)
    if (newStory.mediaFiles.length === 1 && !newStory.content) {
      const file = newStory.mediaFiles[0];
      dispatch(startUpload({
        id: Date.now().toString(),
        file,
        previewUrl: URL.createObjectURL(file),
        metadata: {
          type: 'story',
          content: ''
        }
      }));
      setNewStory({ content: '', mediaFiles: [], durationDays: 1 });
      setStoryMediaPreviews([]);
      setShowStoryModal(false);
      return;
    }

    setIsPublishing(true);
    try {
      const mediaItems = [];
      
      // 1. Upload each media file (Fallback for multi-file/text stories)
      for (const file of newStory.mediaFiles) {
        // @ts-ignore
      const { data: uploadData } = await getStoryUploadUrl({
          contentType: file.type,
          fileName: file.name
        }).unwrap();

        await uploadFileToR2(uploadData.uploadUrl, file);
        
        mediaItems.push({
          key: uploadData.key,
          mediaType: file.type.startsWith('video') ? 'video' : 'image'
        });
      }

      // 2. Confirm Story
      await confirmStoryUpload({
        content: newStory.content,
        durationDays: newStory.durationDays,
        mediaItems
      }).unwrap();

      toast.success("Story uploaded!");
      setNewStory({ content: '', mediaFiles: [], durationDays: 1 });
      setStoryMediaPreviews([]);
      setShowStoryModal(false);
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to upload story");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deletePost(postId).unwrap();
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteStory(storyId).unwrap();
      toast.success("Story deleted");
      setSelectedStoryGroup(null);
    } catch (error) {
      toast.error("Failed to delete story");
    }
  };

  const handleAddComment = async (postId) => {
    gateInteraction(async () => {
      const text = commentInputs[postId];
      if (!text || !text.trim()) return;
      try {
        await addComment({ postId, text }).unwrap();
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        toast.success("Comment added!");
      } catch (error) {
        toast.error("Failed to add comment");
      }
    }, {
      title: "Join the Discussion",
      message: "Sign in to leave a comment."
    });
  };

  const handleLike = async (postId) => {
    gateInteraction(async () => {
      try {
        await likePost(postId).unwrap();
      } catch (error) {
        toast.error("Failed to like post");
      }
    });
  };



  const handleShareToPlatform = (platform, postId) => {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-4 pb-12 px-4 md:px-6 xl:pl-[100px] font-sans relative">
      
      {/* ================= FAR LEFT COLUMN (NAVBAR) ================= */}
      <div className="hidden xl:flex flex-col gap-2 fixed left-0 top-[80px] w-[80px] z-50">
              {/* Home */}
              <div 
                onClick={() => setActiveFilter("All")}
                title="Home"
                className={`flex justify-center py-4 cursor-pointer group rounded-r-xl transition-colors ${activeFilter !== 'Reels' ? 'bg-[#55DEE8]/5 border-l-[3px] border-[#55DEE8]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
              >
                <Home size={24} className={activeFilter !== 'Reels' ? "text-[#55DEE8]" : "text-white/70 group-hover:text-white"} fill={activeFilter !== 'Reels' ? "currentColor" : "none"} />
              </div>
              {/* Search */}
              <div 
                onClick={() => setShowGlobalSearch(true)}
                title="Search"
                className="flex justify-center py-4 cursor-pointer group hover:bg-white/5 rounded-r-xl transition-colors border-l-[3px] border-transparent"
              >
                <Search size={24} className="text-white/70 group-hover:text-white" />
              </div>
              {/* Reels */}
              <div 
                onClick={() => setActiveFilter(activeFilter === "Reels" ? "All" : "Reels")}
                title="Reels"
                className={`flex justify-center py-4 cursor-pointer group rounded-r-xl transition-colors ${activeFilter === 'Reels' ? 'bg-[#55DEE8]/5 border-l-[3px] border-[#55DEE8]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
              >
                <PlaySquare size={24} className={activeFilter === 'Reels' ? 'text-[#55DEE8]' : 'text-white/70 group-hover:text-white'} />
              </div>
              {/* Notifications */}
              <div 
                onClick={() => togglePanel('notifications')}
                title="Notifications"
                className={`flex justify-center py-4 cursor-pointer group rounded-r-xl transition-colors ${activePanel === 'notifications' ? 'bg-[#55DEE8]/5 border-l-[3px] border-[#55DEE8]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
              >
                <div className="relative">
                  <Bell size={24} className="text-white/70 group-hover:text-white" />
                  <div className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-[#55DEE8] rounded-full flex items-center justify-center text-[9px] font-black text-black border-2 border-[#050505]">3</div>
                </div>
              </div>
              {/* Messages */}
              <div 
                onClick={() => togglePanel('messages')}
                title="Messages"
                className={`flex justify-center py-4 cursor-pointer group rounded-r-xl transition-colors ${activePanel === 'messages' ? 'bg-[#55DEE8]/5 border-l-[3px] border-[#55DEE8]' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}
              >
                <div className="relative">
                  <Send size={24} className="text-white/70 group-hover:text-white" />
                  <div className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-[#55DEE8] rounded-full flex items-center justify-center text-[9px] font-black text-black border-2 border-[#050505]">5</div>
                </div>
              </div>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showGlobalSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/80 backdrop-blur-md"
            onClick={() => setShowGlobalSearch(false)}
          >
            <motion.div 
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[#111]">
                <Search size={20} className="text-[#55DEE8]" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search players..." 
                  className="flex-1 bg-transparent text-white text-[16px] outline-none placeholder:text-white/30 font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setShowGlobalSearch(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                {isSearching ? (
                  <div className="flex justify-center p-12">
                    <Loader2 size={32} className="text-[#55DEE8] animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map(player => (
                      <div 
                        key={player._id} 
                        onClick={() => {
                          setShowGlobalSearch(false);
                          navigate(`/profile/${player._id}`);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="w-[46px] h-[46px] rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                           <img 
                             src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                             className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-white group-hover:text-[#55DEE8] transition-colors truncate">{player.name}</div>
                          <div className="text-[12px] font-medium text-white/40 truncate">@{player.username || player.name.toLowerCase().replace(/\s+/g, '')}</div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/50 group-hover:border-[#55DEE8] group-hover:text-[#55DEE8] transition-all">
                          View Profile
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">
                    No players found
                  </div>
                ) : (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">
                    Type to start searching
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ================= NOTIFICATIONS COLUMN ================= */}
          {activePanel === 'notifications' && (
            <div className="hidden xl:block xl:col-span-3 transition-all duration-300">
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 flex flex-col h-[calc(100vh-100px)] sticky top-[80px]">

                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[14px] font-black uppercase tracking-widest" style={HEADING_STYLE}>NOTIFICATIONS</h3>
                  <button onClick={() => setActivePanel(null)} className="text-white/40 hover:text-white p-1 bg-white/5 rounded-lg"><X size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
                  {[
                    { icon: Heart, color: "text-red-500", text: "simran.s liked your post", time: "2m", img: "simran.s" },
                    { icon: MessageCircle, color: "text-blue-400", text: "rohit45 commented: 'Great game!'" , time: "10m", img: "rohit45" },
                    { icon: Users, color: "text-[#55DEE8]", text: "deepak_29 started following you", time: "30m", img: "deepak_29" },
                    { icon: Heart, color: "text-red-500", text: "vikash07 liked your story", time: "1h", img: "vikash07" },
                    { icon: MessageCircle, color: "text-blue-400", text: "team_kridaz replied to your comment", time: "2h", img: "team_kridaz" },
                    { icon: Users, color: "text-[#55DEE8]", text: "aman.singh started following you", time: "3h", img: "aman.singh" },
                    { icon: Trophy, color: "text-yellow-400", text: "You earned the 'Match Winner' badge!", time: "5h", img: "kridaz_bot" }
                  ].map((notif, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                      <div className="relative shrink-0">
                        <div className="w-[38px] h-[38px] rounded-full bg-[#111] border border-white/5 overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.img}`} className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full bg-[#111] flex items-center justify-center border border-[#0A0A0A]`}>
                          <notif.icon size={9} className={notif.color} fill="currentColor" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white/80 group-hover:text-white transition-colors leading-snug">{notif.text}</div>
                        <div className="text-[9px] font-bold text-white/30 mt-1">{notif.time} ago</div>
                      </div>
                      {i < 2 && <div className="w-2 h-2 rounded-full bg-[#55DEE8] shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-2 border-t border-white/5 flex justify-center">
                  <button className="text-[#55DEE8] text-[10px] font-bold hover:underline tracking-widest uppercase">View all notifications</button>
                </div>

              </div>
            </div>
          )}

          {/* ================= LEFT COLUMN (MESSAGES) ================= */}
          {activePanel === 'messages' && (
            <div className="hidden xl:block xl:col-span-3 transition-all duration-300">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 flex flex-col h-[calc(100vh-100px)] sticky top-[80px]">
              
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-black uppercase tracking-widest" style={HEADING_STYLE}>MESSAGES</h3>
                <button className="text-[#55DEE8] hover:brightness-110 p-1 bg-white/5 rounded-lg">
                  <Edit3 size={16} />
                </button>
              </div>

              <div className="relative mb-5">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search messages" 
                  className="w-full bg-[#111] border border-white/5 rounded-full py-2.5 pl-9 pr-4 text-[11px] font-bold outline-none focus:border-white/20 transition-all placeholder:text-white/30"
                />
              </div>

              <div className="flex items-center gap-6 border-b border-white/10 mb-3 px-1">
                <button className="pb-2.5 text-[10px] font-black text-white border-b-2 border-[#55DEE8] tracking-widest uppercase">PRIMARY</button>
                <button className="pb-2.5 text-[10px] font-black text-white/40 hover:text-white transition-colors tracking-widest uppercase">REQUESTS</button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-1 pr-1">
                {[
                  { name: "simran.s", msg: "Great game! =���=���", time: "2m", unread: 2 },
                  { name: "rohit45", msg: "See you at the next match!", time: "10m", unread: 1 },
                  { name: "deepak_29", msg: "That was insane! =�Ƭ", time: "30m", unread: 0 },
                  { name: "vikash07", msg: "Let's train tomorrow", time: "45m", unread: 0 },
                  { name: "katta_18", msg: "Keep pushing! =���", time: "1h", unread: 0 },
                  { name: "aman.singh", msg: "Photo", time: "1h", unread: 0 },
                  { name: "team_kridaz", msg: "New announcement!", time: "2h", unread: 3 },
                  { name: "arjun_11", msg: "Thanks bro! =���", time: "3h", unread: 0 }
                ].map((msg, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                    <div className="relative shrink-0">
                      <div className="w-[36px] h-[36px] rounded-full bg-[#111] border border-white/5 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.name}`} className="w-full h-full object-cover" />
                      </div>
                      {msg.unread > 0 && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#55DEE8] rounded-full border-2 border-[#0A0A0A]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate group-hover:text-[#55DEE8] transition-colors">{msg.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${msg.unread > 0 ? 'font-bold text-white' : 'font-medium text-white/40'}`}>
                        {msg.msg}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-bold text-white/30">{msg.time}</span>
                      {msg.unread > 0 && (
                        <div className="w-[16px] h-[16px] bg-[#55DEE8] text-black rounded-full flex items-center justify-center text-[9px] font-black">
                          {msg.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-2 border-t border-white/5 flex justify-center">
                <button className="text-[#55DEE8] text-[10px] font-bold hover:underline tracking-widest uppercase">
                  View all messages
                </button>
              </div>

            </div>
            </div>
          )}

          {/* ================= MIDDLE COLUMN (FEED) ================= */}
          <div className={`lg:col-span-8 ${activePanel ? 'xl:col-span-6' : 'xl:col-span-8'} transition-all duration-300 ${activeFilter === 'Reels' ? 'h-[calc(100vh-100px)] sticky top-[80px]' : 'space-y-6'}`}>
            
            {activeFilter !== "Reels" && (
              <div className="space-y-6 mb-6">
                {/* Header Hero Area */}
                <div className="relative overflow-hidden flex justify-between items-start pb-4">
              <div className="relative z-10 space-y-1">
                <h1 className="text-3xl md:text-[42px] font-black uppercase tracking-tighter flex items-center gap-2" style={HEADING_STYLE}>
                  COMMUNITY <span className="text-[#55DEE8]">HUB</span>
                </h1>
                <p className="text-[#55DEE8] text-[20px] md:text-[20px] font-bold uppercase tracking-[0.2em]" style={SUBHEADING_STYLE}>
                  CONNECT, SHARE, AND PLAY
                </p>
              </div>
            </div>

            {/* Stories Section */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5">
              <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-center pb-2">
                
                {/* Add Story */}
                <div 
                  onClick={() => gateInteraction(() => setShowStoryModal(true))}
                  className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
                >
                  <div className="w-[68px] h-[68px] rounded-full border border-dashed border-white/30 flex items-center justify-center group-hover:border-[#55DEE8]/50 transition-all relative p-0.5">
                    <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden border border-white/10">
                      <img src={user?.profilePicture || "/default-avatar.png"} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-[22px] h-[22px] bg-[#55DEE8] rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                      <Plus size={12} strokeWidth={4} className="text-black" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">Your story</span>
                </div>

                {/* Render Stories */}
                {stories.map((group, idx) => (
                  <div 
                    key={group._id} 
                    onClick={() => { setSelectedStoryGroup(group); }}
                    className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
                  >
                    <div className={`w-[68px] h-[68px] rounded-full p-[2px] relative hover:scale-105 transition-transform ${idx === 0 ? 'bg-[#55DEE8]' : 'bg-white/20'}`}>
                      <div className="w-full h-full rounded-full bg-[#0A0A0A] p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#111]">
                          {group.stories[0].mediaUrl ? (
                            <img 
                              src={group.stories[0].thumbnailUrl || group.stories[0].mediaUrl} 
                              alt="" 
                              className={`w-full h-full object-cover ${(group.stories.some(s => s.status === 'pending' || s.status === 'processing')) ? 'blur-sm opacity-50' : ''}`} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-[#55DEE8] font-bold bg-[#111]">
                               {group.stories[0].content?.slice(0, 15)}
                            </div>
                          )}
                        </div>
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-[2px] bg-red-500 rounded flex items-center text-[7px] font-black uppercase text-white shadow-lg tracking-wider border border-[#0A0A0A]">
                          LIVE
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white/80 group-hover:text-[#55DEE8] transition-colors truncate max-w-[68px]">
                      {group.user?.name?.split(' ')[0] || "Player"}
                    </span>
                  </div>
                ))}

                {/* Dummy stories for design parity if feed is empty */}
                {stories.length < 5 && [
                  { name: 'simran.s', live: false },
                  { name: 'rohit45', live: false },
                  { name: 'vikash07', live: false },
                  { name: 'katta_18', live: false },
                  { name: 'aman.singh', live: false }
                ].map((dummy, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2.5 shrink-0 cursor-default opacity-40">
                    <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-[#55DEE8]">
                      <div className="w-full h-full rounded-full bg-[#0A0A0A] p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                          <UserIcon size={24} className="text-white/20" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/60 truncate max-w-[68px]">{dummy.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
               {["All", "Following", "Reels", "Highlights", "Match Moments", "Announcements"].map((filter) => (
                 <button 
                   key={filter}
                   onClick={() => setActiveFilter(filter)}
                   className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                     activeFilter === filter 
                     ? 'bg-[#55DEE8] text-black border-[#55DEE8] hover:brightness-110' 
                     : 'bg-transparent text-white/70 border-white/10 hover:bg-white/5 hover:text-white'
                   }`}
                 >
                   {filter}
                 </button>
               ))}
               <div className="ml-auto flex shrink-0">
                  <button className="px-3 py-2 rounded-full bg-transparent border border-white/10 text-white/70 hover:bg-white/5 text-[11px] font-bold flex items-center gap-1.5">
                    Latest <ChevronDown size={12} />
                  </button>
               </div>
            </div>
            </div>
            )}

            {/* Main Feed Posts / Reels */}
            {activeFilter === "Reels" ? (
              <div className="flex justify-center h-[calc(100vh-180px)] bg-black/40 rounded-[24px]">
                <div
                  className="w-[380px] h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-[24px]"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollTop / el.clientHeight);
                    setActiveReelIndex(idx);
                    if (reels.length > 0 && idx >= reels.length - 2 && !reelsFetching && reelsData?.nextCursor) {
                      setReelCursor(reelsData.nextCursor);
                    }
                  }}
                >
                  {reelsLoading ? (
                    <div className="h-full flex items-center justify-center bg-black">
                      <Loader2 size={36} className="text-[#55DEE8] animate-spin" />
                    </div>
                  ) : reels.length > 0 ? reels.map((reel, index) => (
                    <div key={reel._id} className="w-full h-full snap-start snap-always relative bg-black overflow-hidden flex-shrink-0">
                      {Math.abs(index - activeReelIndex) <= 2 ? (
                        <ReelItem reel={reel} isVisible={index === activeReelIndex} />
                      ) : (
                        <div className="w-full h-full bg-black" />
                      )}
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-white/40 bg-black">
                      <PlaySquare size={48} className="opacity-50" />
                      <div className="font-bold uppercase tracking-widest text-[13px]">No reels yet</div>
                    </div>
                  )}
                  {reelsFetching && (
                    <div className="h-20 flex items-center justify-center snap-start">
                      <Loader2 size={24} className="text-[#55DEE8] animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            ) : loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="text-[#55DEE8] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-16 text-center text-white/30 font-bold uppercase tracking-widest text-sm">
                No posts found
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <div key={post._id} className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 space-y-4">
                    {/* Post Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={post.adminId?.profilePicture || "/default-avatar.png"} 
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold">{post.adminId?.name || "Player"}</span>
                            <ShieldCheck size={14} className="text-[#55DEE8]" />
                          </div>
                          <div className="text-[11px] font-bold text-white/40 mt-0.5">
                             2h ago
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {(isAdmin || (user?._id && (post.adminId?._id === user._id || post.user?._id === user._id || post.userId?._id === user._id || post.adminId === user._id || post.user === user._id || post.userId === user._id))) && (
                           <button 
                             onClick={() => handleDeletePost(post._id)}
                             className="text-white/40 hover:text-red-500 transition-colors"
                             title="Delete Post"
                           >
                             <Trash2 size={18} />
                           </button>
                         )}
                         <button className="text-white/40 hover:text-white transition-colors">
                           <MoreVertical size={18} />
                         </button>
                      </div>
                    </div>

                    {(post.image || post.imageUrl || post.mediaUrl) && (
                      <div className="relative rounded-[16px] overflow-hidden group border border-white/5 bg-[#111]">
                        <img 
                          src={post.image || post.imageUrl || post.thumbnailUrl} 
                          className={`w-full object-cover max-h-[500px] transition-all duration-500 ${(post.status === 'pending' || post.status === 'processing') ? 'blur-xl scale-110 opacity-50' : ''}`} 
                        />
                        
                        {/* Progress Overlay for Pending/Processing Posts */}
                        {(post.status === 'pending' || post.status === 'processing') && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                            <div className="w-24 h-24 relative flex items-center justify-center">
                              {/* Circular Progress (SVG) */}
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="6"
                                  fill="transparent"
                                  className="text-white/10"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="#55DEE8"
                                  strokeWidth="6"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 40}
                                  strokeDashoffset={2 * Math.PI * 40 * (1 - (post.processingProgress || 0) / 100)}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[14px] font-black text-white">{post.processingProgress || 0}%</span>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col items-center gap-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#55DEE8] animate-pulse">
                                {post.status === 'processing' ? 'Optimizing Media' : 'Preparing Upload'}
                              </span>
                              <div className="flex gap-1">
                                <span className="w-1 h-1 bg-[#55DEE8] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 bg-[#55DEE8] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 bg-[#55DEE8] rounded-full animate-bounce"></span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Video Icon for processed videos */}
                        {post.mediaType === 'video' && post.status === 'ready' && (
                          <div className="absolute top-4 right-4 p-1.5 bg-black/60 backdrop-blur-md rounded">
                             <Video size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-5">
                         <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 group">
                            <Heart size={20} className={`transition-colors ${post.likes?.some(l => (l._id || l) === user?._id) ? 'fill-[#55DEE8] text-[#55DEE8]' : 'text-white/70 group-hover:text-red-500'}`} />
                            <span className="text-[12px] font-bold text-white">{post.likes?.length || 0}</span>
                         </button>
                         <button className="flex items-center gap-2 group">
                            <MessageCircle size={20} className="text-white/70 group-hover:text-white transition-colors" />
                            <span className="text-[12px] font-bold text-white">{post.comments?.length || 0}</span>
                         </button>
                         <button onClick={() => handleShareToPlatform('copy', post._id)} className="flex items-center gap-2 group">
                            <Send size={18} className="text-white/70 group-hover:text-white transition-colors" />
                            <span className="text-[12px] font-bold text-white">Share</span>
                         </button>
                      </div>
                      <button>
                        <Bookmark size={20} className="text-white/70 hover:text-white transition-colors" />
                      </button>
                    </div>

                    {/* Caption & Likes List */}
                    <div className="space-y-2">
                       <div className="text-[12px] font-medium leading-relaxed">
                         {post.title && <span className="font-bold mr-2">{post.title}</span>}
                         <span className="text-white/90 whitespace-pre-wrap">{post.content}</span>
                       </div>
                       
                       {post.likes?.length > 0 && (
                         <div className="flex items-center gap-2 text-[11px] font-medium text-white/50 pt-1">
                            <div className="flex -space-x-1.5">
                               {[1,2,3].slice(0, Math.min(3, post.likes.length)).map((_,i) => (
                                 <div key={i} className="w-5 h-5 rounded-full bg-white/20 border border-[#0A0A0A] overflow-hidden">
                                   <UserIcon size={18} className="text-white/50" />
                                 </div>
                               ))}
                            </div>
                            <p>Liked by <span className="font-bold text-white">simran.s</span>, <span className="font-bold text-white">deepak_29</span> and <span className="font-bold text-white">{Math.max(0, post.likes?.length - 2)} others</span></p>
                         </div>
                       )}
                    </div>

                    {/* Comment Input */}
                    <div className="flex items-center gap-3 pt-3">
                      <img src={user?.profilePicture || "/default-avatar.png"} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="flex-1 bg-transparent text-[12px] font-medium outline-none text-white placeholder:text-white/40"
                        value={commentInputs[post._id] || ""}
                        onChange={(e) => setCommentInputs({...commentInputs, [post._id]: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post._id);
                        }}
                      />
                      <button className="text-white/40 hover:text-white">
                        <Smile size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN (WIDGETS) ================= */}
          <div className={`lg:col-span-4 ${activePanel ? 'xl:col-span-3' : 'xl:col-span-4'} transition-all duration-300 space-y-6`}>
            
            {/* New Post Button */}
            <div className="flex justify-end pt-1">
              <button 
                onClick={() => gateInteraction(() => setShowPostModal(true))}
                className="w-full md:w-auto px-6 py-3 bg-[#55DEE8] text-black rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(85,222,232,0.15)] hover:brightness-110 transition-all"
              >
                <Plus size={14} strokeWidth={3} /> NEW POST
              </button>
            </div>

            <div className="sticky top-[80px] space-y-6">
              {/* YOUR STATS */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <BarChart3 size={16} className="text-[#55DEE8]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em]" style={HEADING_STYLE}>YOUR STATS</h3>
                  </div>
                  <button className="text-[10px] font-bold text-[#55DEE8] hover:underline">View all</button>
                </div>

                <div className="grid grid-cols-3 gap-y-5 gap-x-2">
                  {[
                    { label: "Members", value: statsData?.stats?.members || "12.4K", icon: Users },
                    { label: "Posts", value: statsData?.stats?.posts || "1.2K", icon: FileText },
                    { label: "Online Now", value: "326", icon: Circle, fill: true },
                    { label: "Comments", value: statsData?.stats?.comments || "2.1K", icon: MessageCircle },
                    { label: "Likes", value: statsData?.stats?.likes || "8.7K", icon: Heart },
                    { label: "Tournaments", value: "48", icon: Trophy }
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <s.icon size={10} className={s.fill ? "text-[#55DEE8]" : ""} fill={s.fill ? "currentColor" : "none"} />
                        <span className="text-[9px] font-bold leading-none">{s.label}</span>
                      </div>
                      <div className="text-[14px] font-black">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRENDING TOPICS */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <MonitorPlay size={16} className="text-[#55DEE8]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em]" style={HEADING_STYLE}>TRENDING TOPICS</h3>
                  </div>
                  <button className="text-[10px] font-bold text-[#55DEE8] hover:underline">View all</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["#Cricket", "#MatchDay", "#Football", "#TeamSpirit", "#RoadToVictory", "#Tournaments"].map((tag, i) => (
                    <button key={i} className="px-3 py-1.5 bg-transparent border border-white/10 hover:bg-white/5 rounded-lg text-[10px] font-bold transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUGGESTED FOR YOU */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Zap size={16} className="text-[#55DEE8]" fill="currentColor" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em]" style={HEADING_STYLE}>SUGGESTED FOR YOU</h3>
                  </div>
                  <button className="text-[10px] font-bold text-[#55DEE8] hover:underline">View all</button>
                </div>

                <div className="space-y-5">
                  {[
                    { name: "virat.kohli18", mutual: "2 mutual friends", verified: true },
                    { name: "msdhoni07", mutual: "3 mutual friends", verified: true },
                    { name: "jasprit.bumrah93", mutual: "1 mutual friend", verified: true },
                    { name: "rohit45", mutual: "2 mutual friends", verified: false }
                  ].map((u, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold group-hover:text-[#55DEE8] transition-colors">{u.name}</span>
                            {u.verified && <ShieldCheck size={10} className="text-[#55DEE8]" />}
                          </div>
                          <div className="text-[9px] font-bold text-white/40">{u.mutual}</div>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-transparent border border-[#55DEE8] text-[#55DEE8] rounded-full text-[9px] font-bold hover:bg-[#55DEE8] hover:text-black transition-all uppercase tracking-widest">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

      <AnimatePresence>
        {/* Post Modal */}
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePostModal} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden">
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
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-12 px-4 text-white text-sm outline-none transition-all"
                />
                <textarea 
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Share the update with the community..."
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl min-h-[120px] p-4 text-white text-sm outline-none transition-all resize-none"
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
                    <button type="button" className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-white/40 hover:text-[#55DEE8] hover:bg-[#55DEE8]/5 transition-all flex items-center gap-2">
                      <ImageIcon size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{postImagePreview ? 'Change' : 'Add Image'}</span>
                    </button>
                    <input type="file" onChange={handlePostImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  </div>

                  <button 
                    type="submit"
                    disabled={isPublishing}
                    className="bg-[#55DEE8] text-black px-8 h-12 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                    {isPublishing ? "Saving..." : (editingPost ? "Update" : "Publish")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Story Modal */}
        {showStoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStoryModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden">
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
                  className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-24 p-4 text-white text-sm outline-none transition-all resize-none"
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
                    <button type="button" className="w-full p-3 bg-white/[0.03] border border-white/5 rounded-xl text-white/40 hover:text-[#55DEE8] hover:bg-[#55DEE8]/5 transition-all flex items-center justify-center gap-2">
                      <ImageIcon size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{storyMediaPreviews.length > 0 ? 'Add More' : 'Add Photo/Video'}</span>
                    </button>
                    <input type="file" multiple onChange={handleStoryMediaChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                  </div>

                  <div className="relative flex-1 min-w-[140px]">
                    <select 
                      value={newStory.durationDays}
                      onChange={(e) => setNewStory({...newStory, durationDays: parseInt(e.target.value)})}
                      className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-12 px-4 text-white text-[10px] font-bold uppercase tracking-widest outline-none transition-all appearance-none text-center"
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
                    className="w-full bg-[#55DEE8] text-black h-14 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                    {isPublishing ? "Posting..." : "Post Story"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {selectedStoryGroup && (
        <StoryViewer 
          storyGroup={selectedStoryGroup} 
          onClose={() => setSelectedStoryGroup(null)}
          onDelete={handleDeleteStory}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default Community;
