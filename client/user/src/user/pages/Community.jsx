import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
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
  Link as LinkIcon,
  Eye,
  ChevronDown,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Zap,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Mail,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StoryViewer from "../components/StoryViewer";
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
  useDeleteCommentMutation,
  useUploadStoryMutation,
  useDeleteStoryMutation
} from "../../redux/api/communityApi";
import { useSocket } from "@context/SocketContext";

const PRI = "#84CC16";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif" };

const Community = () => {
  const { user, role, isLoggedIn, followingIds } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
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
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadStory] = useUploadStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();

  const { socket } = useSocket();

  const posts = communityData?.posts || [];
  const stories = storiesData?.stories || [];
  const loading = feedLoading;

  // Socket Listeners for Real-time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          if (!draft.posts.find(p => p._id === newPost._id)) {
            draft.posts.unshift(newPost);
          }
        })
      );
      // Update global stats
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = (parseInt(draft.stats.posts) + 1).toString();
        })
      );
    };

    const handlePostLiked = ({ postId, likes, likesCount }) => {
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === postId);
          if (post) {
            post.likes = likes;
          }
        })
      );
      // Optional: Update global likes stat if needed
    };

    const handlePostCommented = ({ postId, comments }) => {
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          const post = draft.posts.find(p => p._id === postId);
          if (post) {
            post.comments = comments;
          }
        })
      );
      // Update global stats
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.comments = (parseInt(draft.stats.comments) + 1).toString();
        })
      );
    };

    const handlePostDeleted = (postId) => {
      dispatch(
        communityApi.util.updateQueryData('getCommunityFeed', undefined, (draft) => {
          draft.posts = draft.posts.filter(p => p._id !== postId);
        })
      );
      // Update global stats
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = Math.max(0, parseInt(draft.stats.posts) - 1).toString();
        })
      );
    };

    socket.on('new_community_post', handleNewPost);
    socket.on('community_post_liked', handlePostLiked);
    socket.on('community_post_commented', handlePostCommented);
    socket.on('community_post_deleted', handlePostDeleted);

    return () => {
      socket.off('new_community_post', handleNewPost);
      socket.off('community_post_liked', handlePostLiked);
      socket.off('community_post_commented', handlePostCommented);
      socket.off('community_post_deleted', handlePostDeleted);
    };
  }, [socket, dispatch]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [viewingLikes, setViewingLikes] = useState([]);
  
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null });
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStory, setNewStory] = useState({ content: '', mediaFiles: [], durationDays: 1 });
  const [storyMediaPreviews, setStoryMediaPreviews] = useState([]);
  
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const [activeDiscussion, setActiveDiscussion] = useState(null); 
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null); 
  const [optimisticPosts, setOptimisticPosts] = useState([]);
  const [optimisticStories, setOptimisticStories] = useState([]);
  const [shareModalOpen, setShareModalOpen] = useState(null);
  const [highlightedPost, setHighlightedPost] = useState(null);

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
        await updatePost({ postId: editingPost._id, formData }).unwrap();
        toast.success("Post updated successfully!");
      } else {
        await createPost(formData).unwrap();
        toast.success("Post created successfully!");
      }
      closePostModal();
    } catch (error) {
      toast.error(error.data?.message || "Failed to save post");
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
    if (files.length > 10) return toast.error("Max 10 media files");
    setNewStory({ ...newStory, mediaFiles: files });
    setStoryMediaPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleUploadStory = async (e) => {
    e.preventDefault();
    if (!newStory.content && newStory.mediaFiles.length === 0) return toast.error("Story must have content or media");

    const formData = new FormData();
    formData.append('content', newStory.content);
    formData.append('durationDays', newStory.durationDays);
    newStory.mediaFiles.forEach((file) => formData.append('media', file));

    setIsPublishing(true);
    try {
      await uploadStory(formData).unwrap();
      toast.success("Story uploaded!");
      setShowStoryModal(false);
      setNewStory({ content: '', mediaFiles: [], durationDays: 1 });
      setStoryMediaPreviews([]);
    } catch (error) {
      toast.error("Failed to upload story");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(postId).unwrap();
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Delete this story?")) return;
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
      if (!commentText.trim()) return;
      setIsSubmittingComment(true);
      try {
        await addComment({ postId, text: commentText }).unwrap();
        setCommentText("");
        toast.success("Comment added!");
      } catch (error) {
        toast.error("Failed to add comment");
      } finally {
        setIsSubmittingComment(false);
      }
    }, {
      title: "Join the Discussion",
      message: "Sign in to leave a comment on this post."
    });
  };

  const handleLike = async (postId) => {
    gateInteraction(async () => {
      try {
        await likePost(postId).unwrap();
      } catch (error) {
        toast.error("Failed to like post");
      }
    }, {
      title: "Show Some Love",
      message: "Sign in to like this post and support the creator."
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
      title: "Follow Players",
      message: "Sign in to follow players and stay updated."
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
    <div className="min-h-screen bg-black text-white pt-4 pb-12 px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        
        {/* Header Hero Area - Compact Open Design */}
        <div className="relative mb-6 py-8 overflow-hidden rounded-[32px]">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2105&auto=format&fit=crop" 
              alt="" 
              className="w-full h-full object-cover opacity-20 grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={HEADING_STYLE}>
                Community <span className="text-[#84CC16]">Hub</span>
              </h1>
              <p className="text-[#84CC16] text-[16px] md:text-[20px] font-black uppercase tracking-[0.2em]" style={SUBHEADING_STYLE}>
                Connect, Share, and Play
              </p>
            </div>
            <button 
              onClick={() => gateInteraction(() => setShowPostModal(true))}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-[#84CC16] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-[0_5px_25px_rgba(132,204,22,0.2)] active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> New Post
            </button>
          </div>
        </div>

        {/* Stories Horizontal Strip - Compact */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-5 mb-6">
           <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-1 bg-[#84CC16] rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Live Stories</h2>
           </div>
           
           <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              <div 
                onClick={() => gateInteraction(() => setShowStoryModal(true))}
                className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-[#84CC16]/50 transition-all relative">
                   <div className="w-[56px] h-[56px] rounded-full bg-white/5 flex items-center justify-center">
                      <Plus size={20} className="text-white/20 group-hover:text-[#84CC16] transition-colors" />
                   </div>
                   <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#84CC16] rounded-full flex items-center justify-center border-2 border-black">
                      <Plus size={10} strokeWidth={3} className="text-black" />
                   </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">Add Story</span>
              </div>

              {stories.map((group) => (
                <div 
                  key={group._id} 
                  onClick={() => { setSelectedStoryGroup(group); setCurrentStoryIndex(0); }}
                  className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
                >
                   <div className="w-16 h-16 rounded-full border-2 border-[#84CC16] p-0.5 relative hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full bg-[#111] overflow-hidden border border-white/5">
                         {group.stories[0].mediaUrl ? (
                           <img src={group.stories[0].mediaUrl} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <div className="p-1.5 text-[5px] text-center line-clamp-3 text-[#84CC16] font-black uppercase leading-tight">{group.stories[0].content}</div>
                         )}
                      </div>
                      <div className="absolute -top-0.5 -left-0.5 px-1 py-0.5 bg-red-600 rounded-full text-[5px] font-black uppercase tracking-widest shadow-lg">Live</div>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-tight text-white group-hover:text-[#84CC16] transition-colors">{group.user?.name?.split(' ')[0] || "Player"}</p>
                      <p className="text-[7px] font-black text-white/10 uppercase tracking-widest mt-0.5">2h ago</p>
                   </div>
                </div>
              ))}
              
              {stories.length < 5 && [
                { name: 'Rohit', time: '4h ago' },
                { name: 'Simran', time: '6h ago' },
                { name: 'Vikash', time: '10h ago' },
                { name: 'Katta', time: '12h ago' }
              ].map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-2.5 shrink-0 cursor-default opacity-30">
                   <div className="w-16 h-16 rounded-full border border-white/5 p-0.5">
                      <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                         <UserIcon size={24} className="text-white/5" />
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-tight text-white/40">{m.name}</p>
                      <p className="text-[7px] font-black text-white/10 uppercase tracking-widest mt-0.5">{m.time}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Main Feed Grid - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Feed Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/5 rounded-lg">
                    <TrendingUp size={14} className="text-[#84CC16]" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Community Feed</h2>
               </div>
               <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                 <Clock size={10} /> Most Recent <ChevronDown size={10} />
               </button>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 size={32} className="text-[#84CC16] animate-spin" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Scanning Hub...</p>
              </div>
            ) : (posts.length === 0 && optimisticPosts.length === 0) ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-16 text-center space-y-4">
                <MessageCircle size={40} className="mx-auto text-white/5" />
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Be the first to start the conversation.</p>
              </div>
            ) : (
              [...optimisticPosts, ...posts].map((post) => (
                <div key={post._id} className="bg-[#0A0A0A] border border-white/5 rounded-[24px] overflow-hidden group hover:border-white/10 transition-all relative">
                  {post.isOptimistic && (
                    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                       <Loader2 size={20} className="text-[#84CC16] animate-spin" />
                    </div>
                  )}
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black border border-white/5 p-0.5 overflow-hidden">
                        <div className="w-full h-full rounded-lg bg-[#111] flex items-center justify-center overflow-hidden">
                          <img 
                            src={post.adminId?.profilePicture || "/default-avatar.png"} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                           <h3 className="text-[10px] font-black uppercase tracking-tight text-white">{post.adminId?.name || "Player"}</h3>
                           <div className="w-3 h-3 bg-[#84CC16] rounded-full flex items-center justify-center">
                              <ShieldCheck size={8} className="text-black" />
                           </div>
                        </div>
                        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                           <Calendar size={8} className="text-[#84CC16]" /> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {isLoggedIn && user?._id !== (post.adminId?._id || post.adminId) && (
                         <button 
                           onClick={() => handleFollowToggle(post.adminId?._id || post.adminId)}
                           className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                             followingIds.includes(post.adminId?._id || post.adminId)
                             ? 'bg-white/5 text-white/20'
                             : 'bg-[#84CC16] text-black hover:brightness-110 shadow-[0_5px_15px_rgba(132,204,22,0.1)]'
                           }`}
                         >
                           {followingIds.includes(post.adminId?._id || post.adminId) ? 'Followed' : 'Follow'}
                         </button>
                       )}
                       {(isAdmin || user?._id === (post.adminId?._id || post.adminId)) && (
                         <button onClick={() => handleDeletePost(post._id)} className="text-white/20 hover:text-red-500 transition-colors p-2">
                            <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      {post.title && <h4 className="text-xl font-black uppercase tracking-tighter" style={HEADING_STYLE}>{post.title}</h4>}
                      <p className="text-white/60 text-[11px] leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {(post.image || post.imageUrl) && (
                      <div className="relative rounded-[16px] overflow-hidden border border-white/5">
                         <img 
                          src={post.image || post.imageUrl} 
                          alt="" 
                          className="w-full object-cover max-h-[400px] group-hover:scale-105 transition-transform duration-1000" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={() => handleLike(post._id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#84CC16] hover:bg-white/10 transition-all"
                        >
                           <Heart size={12} fill={post.likes?.some(l => (l._id || l) === user?._id) ? "#84CC16" : "none"} /> {post.likes?.length || 0}
                        </button>
                        <button className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">
                           <MessageCircle size={16} /> {post.comments?.length || 0}
                        </button>
                     </div>
                     <button 
                        onClick={() => handleShareToPlatform('copy', post._id)}
                        className="flex items-center gap-1.5 text-[#84CC16] text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                     >
                        <Share2 size={14} /> Share
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Column - Compact & Sticky */}
          <div className="lg:col-span-4">
            <div className="sticky top-[80px] space-y-4">
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-6 space-y-5">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white/5 rounded-lg">
                      <BarChart3 size={14} className="text-[#84CC16]" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#84CC16]">Your Stats</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Members', value: statsData?.stats?.members || '0', icon: Users },
                      { label: 'Posts', value: statsData?.stats?.posts || '0', icon: MessageCircle },
                      { label: 'Comments', value: statsData?.stats?.comments || '0', icon: Target },
                      { label: 'Likes', value: statsData?.stats?.likes || '0', icon: Heart }
                    ].map((s, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 group hover:border-[#84CC16]/20 transition-all">
                         <div className="flex items-center gap-1.5 text-[#84CC16]">
                            <s.icon size={10} />
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/20">{s.label}</span>
                         </div>
                         <p className="text-lg font-black text-white">{s.value}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-[#0A0A0A] border border-white/5 rounded-[24px] p-6 space-y-5">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white/5 rounded-lg">
                      <Zap size={14} className="text-[#84CC16]" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Popular Topics</h3>
                 </div>

                 <div className="space-y-1.5">
                    {[
                      { tag: '# Cricket', count: 542 },
                      { tag: '# Matchday', count: 328 },
                      { tag: '# TeamSDCBN', count: 276 },
                      { tag: '# Tournaments', count: 184 },
                      { tag: '# Players', count: 142 }
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.03] rounded-lg border border-white/5 transition-all group cursor-pointer">
                         <span className="text-[9px] font-black uppercase tracking-tight text-white group-hover:text-[#84CC16] transition-colors">{t.tag}</span>
                         <span className="text-[8px] font-black text-white/10">{t.count}</span>
                      </div>
                    ))}
                 </div>
                 
                 <button className="w-full flex items-center justify-center gap-2 text-[#84CC16] text-[8px] font-black uppercase tracking-[0.2em] pt-2 group">
                    View All Topics <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                 </button>
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
