import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  ThumbsUp, MessageCircle, Share2, Plus, Image as ImageIcon, X, MoreVertical, Send,
  Loader2, Trash2, Clock, User as UserIcon, Trophy, Edit, Edit3, Twitter, Facebook,
  Eye, ChevronDown, TrendingUp, Target, BarChart3, Users, Zap,
  ChevronRight, ShieldCheck, Calendar, Mail, ArrowRight, MonitorPlay, FileText,
  Circle, Bookmark, Smile, Search, Play, Video, Home, PlaySquare, Globe, Hash, Music, ArrowLeft,
  Instagram, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StoryViewer from "@features/networking/components/StoryViewer";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import useGuestLocation from "@hooks/useGuestLocation";
import {
  communityApi,
  useGetCommunityFeedQuery,
  useLazyGetCommunityFeedQuery,
  useGetStoriesFeedQuery,
  useGetCommunityStatsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useAddPostCommentMutation,
  useDeleteCommentMutation,
  useUploadStoryMutation,
  useDeleteStoryMutation,
  useLazyGetCommunityUploadUrlQuery,
  useConfirmCommunityPostMutation,
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation
} from "@redux/api/communityApi";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import ReelItem from "@features/reels/components/ReelItem";
import { useSocket } from "@context/SocketContext";
import { uploadFileToR2 } from "@utils/mediaUpload";

const PRI = "#BFF367";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const getPostShareId = (post) => post?._id || post?.id;
const getPostId = (post) => post?._id || post?.id;

const sharePlatforms = [
  { id: "native", name: "More", icon: Share2 },
  { id: "copy", name: "Copy Link", icon: Copy },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "facebook", name: "Facebook", icon: Facebook },
];

const Community = ({ children, onSearchActive }) => {
  const { user, role, isLoggedIn, followingIds } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'BMSP_ADMIN';

  // RTK Query Hooks
  const { location } = useGuestLocation();
  const [triggerGetFeed] = useLazyGetCommunityFeedQuery();
  const [triggerSearchPlayers] = useLazySearchPlayersQuery();
  const { data: storiesData } = useGetStoriesFeedQuery({
    ...(location ? { lat: location.lat, lng: location.lng } : {})
  }, { skip: !isLoggedIn });
  const stories = storiesData?.stories || [];
  
  const currentUserId = user?._id || user?.id;
  const myStoryGroup = currentUserId ? stories.find(group => (group.user?._id || group.user?.id) === currentUserId) : null;
  const otherStories = currentUserId ? stories.filter(group => (group.user?._id || group.user?.id) !== currentUserId) : stories;
  const { data: statsData } = useGetCommunityStatsQuery();

  const [createPost] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [likePost] = useLikePostMutation();
  const [addPostComment] = useAddPostCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadStory] = useUploadStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();

  const [getCommunityUploadUrl] = useLazyGetCommunityUploadUrlQuery();
  const [confirmCommunityPost] = useConfirmCommunityPostMutation();
  const [getStoryUploadUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStoryUpload] = useConfirmStoryUploadMutation();

  // Filter / panel state â€” declared early because reels hook depends on activeFilter
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "shots" ? "Reels" : "All";
  const [activeFilter, setActiveFilter] = useState(initialTab);
  const [activeSportFilter, setActiveSportFilter] = useState("");
  const [activePanel, setActivePanel] = useState(null); // 'messages' | 'notifications' | null
  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  // Sync activeFilter if URL changes (e.g. from Home page click)
  useEffect(() => {
    if (searchParams.get("tab") === "shots") {
      setActiveFilter("Reels");
    } else if (activeFilter === "Reels") {
      setActiveFilter("All");
    }
  }, [searchParams.get("tab")]);

  // Sync URL when Shots/Reels view is toggled (also puts the reel id in the URL)
  const handleSetActiveFilter = (filter) => {
    setActiveFilter(filter);
    if (filter === "Reels") {
      searchParams.set("tab", "shots");
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete("tab");
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Disable body scroll when viewing Reels
  useEffect(() => {
    if (activeFilter === "Reels") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeFilter]);


  // Reels (Shots) hook â€” cursor-based infinite scroll
  const [reelCursor, setReelCursor] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const {
    data: reelsData,
    isLoading: reelsLoading,
    isFetching: reelsFetching,
  } = useGetReelsFeedQuery(reelCursor ? { cursor: reelCursor } : undefined, {
    skip: activeFilter !== "Reels",
  });
  const reels = reelsData?.reels || [];

  const reelsContainerRef = useRef(null);
  const initialReelScrolled = useRef(false);

  // Keep ?id= in sync with whichever reel is currently visible
  useEffect(() => {
    if (activeFilter !== "Reels" || reels.length === 0 || !initialReelScrolled.current) return;
    const currentReel = reels[activeReelIndex];
    if (currentReel?.id || currentReel?._id) {
      const id = currentReel.id || currentReel._id;
      if (searchParams.get("id") !== id) {
        setSearchParams({ tab: "shots", id }, { replace: true });
      }
    }
  }, [activeReelIndex, activeFilter, reels.length, searchParams, setSearchParams]);

  // Initial scroll to reel specified in URL
  useEffect(() => {
    if (activeFilter === "Reels" && reels.length > 0 && !initialReelScrolled.current) {
      const urlId = searchParams.get("id");
      if (urlId) {
        const index = reels.findIndex(r => r.id === urlId || r._id === urlId);
        if (index > 0) {
          setActiveReelIndex(index);
          // Scroll the container to the correct item instantly to avoid onScroll resetting it
          if (reelsContainerRef.current) {
            const reelElement = reelsContainerRef.current.children[index];
            if (reelElement) {
              reelElement.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }
        }
      }
      initialReelScrolled.current = true;
    }
  }, [activeFilter, reels, searchParams]);

  const { socket, onlineCount } = useSocket();

  // (activeFilter, activeSportFilter, activePanel are declared above â€” before the reels hook)

  // Search state
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Notify parent of search state
  useEffect(() => {
    if (onSearchActive) {
      onSearchActive(debouncedSearchQuery.trim() !== "");
    }
  }, [debouncedSearchQuery, onSearchActive]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(feedSearchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [feedSearchQuery]);

  // Pagination states
  const [postsPage, setPostsPage] = useState(1);
  const [loadedPosts, setLoadedPosts] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [playersPage, setPlayersPage] = useState(1);
  const [loadedPlayers, setLoadedPlayers] = useState([]);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(false);

  // Reset lists and page numbers when search query or filters change
  useEffect(() => {
    setLoadedPosts([]);
    setPostsPage(1);
    setHasMorePosts(true);

    setLoadedPlayers([]);
    setPlayersPage(1);
    setHasMorePlayers(true);
  }, [debouncedSearchQuery, activeFilter, activeSportFilter]);

  // Fetch function for posts feed
  const fetchPosts = async (pageNumber, isSearch) => {
    if (postsLoading) return;
    setPostsLoading(true);

    try {
      const params = {
        page: pageNumber,
        limit: 10,
      };

      if (isSearch) {
        params.search = debouncedSearchQuery;
      } else {
        if (activeFilter === "Following") {
          params.following = "true";
        }
        if (location) {
          params.lat = location.lat;
          params.lng = location.lng;
        }
      }

      const res = await triggerGetFeed(params).unwrap();
      const newPosts = res?.posts || [];

      setLoadedPosts(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const filtered = newPosts.filter(p => !existingIds.has(p._id));
        return pageNumber === 1 ? newPosts : [...prev, ...filtered];
      });

      if (newPosts.length < 10) {
        setHasMorePosts(false);
      } else {
        setHasMorePosts(true);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch function for search players
  const fetchPlayers = async (pageNumber) => {
    if (!debouncedSearchQuery.trim()) return;
    if (playersLoading) return;
    setPlayersLoading(true);

    try {
      const res = await triggerSearchPlayers({
        query: debouncedSearchQuery,
        page: pageNumber,
        limit: 10
      }).unwrap();
      const newPlayers = res?.players || [];

      setLoadedPlayers(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = newPlayers.filter(p => !existingIds.has(p.id));
        return pageNumber === 1 ? newPlayers : [...prev, ...filtered];
      });

      if (newPlayers.length < 10) {
        setHasMorePlayers(false);
      } else {
        setHasMorePlayers(true);
      }
    } catch (err) {
      console.error("Error searching players:", err);
    } finally {
      setPlayersLoading(false);
    }
  };

  // Effects to handle page loading
  useEffect(() => {
    if (postsPage === 1) {
      fetchPosts(1, !!debouncedSearchQuery.trim());
    }
  }, [postsPage, debouncedSearchQuery, activeFilter, activeSportFilter]);

  useEffect(() => {
    if (postsPage > 1) {
      fetchPosts(postsPage, !!debouncedSearchQuery.trim());
    }
  }, [postsPage]);

  useEffect(() => {
    if (playersPage === 1 && debouncedSearchQuery.trim()) {
      fetchPlayers(1);
    }
  }, [playersPage, debouncedSearchQuery]);

  useEffect(() => {
    if (playersPage > 1 && debouncedSearchQuery.trim()) {
      fetchPlayers(playersPage);
    }
  }, [playersPage]);

  // Window scroll listener for posts infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (activeFilter === "Reels") return;
      if (postsLoading || !hasMorePosts) return;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        setPostsPage(prev => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [postsLoading, hasMorePosts, activeFilter]);

  // Horizontal scroll listener for players search results pagination
  const handlePlayersHorizontalScroll = (e) => {
    if (playersLoading || !hasMorePlayers) return;

    const target = e.currentTarget;
    if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 100) {
      setPlayersPage(prev => prev + 1);
    }
  };

  // Socket Listeners for Real-time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      const formatted = {
        ...newPost,
        _id: newPost.id || newPost._id, // Guarantee _id exists
        adminId: newPost.author,
        mediaUrl: newPost.mediaUrls?.[0],
        image: newPost.mediaType === 'image' ? newPost.mediaUrls?.[0] : null,
        videoUrl: newPost.mediaType === 'video' ? newPost.mediaUrls?.[0] : null,
        likesCount: newPost.likes?.length || 0,
        totalComments: newPost.comments?.length || 0,
        comments: newPost.comments?.map(c => ({
          ...c,
          userId: c.user
        })) || []
      };

      setLoadedPosts(prev => {
        if (prev.find(p => (p._id || p.id) === (formatted._id || formatted.id))) return prev;
        return [formatted, ...prev];
      });

      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = (parseInt(draft.stats.posts) + 1).toString();
        })
      );
    };

    const handlePostLiked = ({ postId, likes, likesCount }) => {
      setLoadedPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            likes,
            likesCount: likesCount !== undefined ? likesCount : likes.length
          };
        }
        return post;
      }));
    };

    const handlePostCommented = ({ postId, comments }) => {
      setLoadedPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: comments.map(c => ({ ...c, userId: c.user })),
            totalComments: comments.length
          };
        }
        return post;
      }));
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.comments = (parseInt(draft.stats.comments) + 1).toString();
        })
      );
    };

    const handlePostDeleted = (postId) => {
      setLoadedPosts(prev => prev.filter(post => post._id !== postId));
      dispatch(
        communityApi.util.updateQueryData('getCommunityStats', undefined, (draft) => {
          if (draft.stats) draft.stats.posts = Math.max(0, parseInt(draft.stats.posts) - 1).toString();
        })
      );
    };

    const handleMediaProgress = ({ mediaId, progress, status }) => {
      setLoadedPosts(prev => prev.map(post => {
        if (post._id === mediaId) {
          return {
            ...post,
            status: 'pending',
            processingProgress: progress
          };
        }
        return post;
      }));
    };

    const handleMediaComplete = ({ mediaId, hlsUrl, thumbnailUrl }) => {
      setLoadedPosts(prev => prev.map(post => {
        if (post._id === mediaId) {
          return {
            ...post,
            status: 'ready',
            mediaUrl: hlsUrl,
            image: thumbnailUrl,
            processingProgress: 100
          };
        }
        return post;
      }));
      dispatch(communityApi.util.invalidateTags(['Stories']));
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
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null, sport: '' });
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [editingPost, setEditingPost] = useState(null);


  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStory, setNewStory] = useState({ content: '', mediaFiles: [], durationDays: 1 });
  const [storyMediaPreviews, setStoryMediaPreviews] = useState([]);

  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [sharePostId, setSharePostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check URL params for creating a post (e.g. from Team Profile share)
  useEffect(() => {
    if (searchParams.get('createPost') === 'true') {
      const text = searchParams.get('text');
      if (text) {
        setNewPost(prev => ({ ...prev, content: text }));
      }
      setShowPostModal(true);

      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('createPost');
      newParams.delete('text');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
              content: newPost.content || '',
              sport: newPost.sport || ''
            }
          }));
        } else {
          // Plain text post (unlikely with current UI but handled)
          await createPost({ title: newPost.title, content: newPost.content, sport: newPost.sport }).unwrap();
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
    setNewPost({ title: '', content: '', image: null, sport: '' });
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
          content: '',
          durationDays: newStory.durationDays
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
      toast.error(error?.data?.message || error.message || "Failed to delete post");
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteStory(storyId).unwrap();
      toast.success("Story deleted");
      setSelectedStoryGroup(null);
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to delete story");
    }
  };

  const handleAddComment = async (postId) => {
    gateInteraction(async () => {
      const text = commentInputs[postId];
      if (!text || !text.trim()) return;

      // Optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        _id: `temp-${Date.now()}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        userId: {
          id: user?.id,
          _id: user?.id,
          name: user?.name || 'You',
          username: user?.username || '',
          profilePicture: user?.profilePicture || null
        }
      };

      // Immediately add to local state
      setLoadedPosts(prev => prev.map(post => {
        if ((post._id || post.id) === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), optimisticComment],
          };
        }
        return post;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));

      try {
        const res = await addPostComment({ postId, text: text.trim() }).unwrap();
        // Replace optimistic comment with server response if available
        if (res?.comment) {
          setLoadedPosts(prev => prev.map(post => {
            if ((post._id || post.id) === postId) {
              return {
                ...post,
                comments: (post.comments || []).map(c =>
                  c.id === optimisticComment.id ? { ...res.comment, userId: res.comment.user || res.comment.userId } : c
                ),
              };
            }
            return post;
          }));
        }
        toast.success("Comment added!");
      } catch (error) {
        // Rollback optimistic comment
        setLoadedPosts(prev => prev.map(post => {
          if ((post._id || post.id) === postId) {
            return {
              ...post,
              comments: (post.comments || []).filter(c => c.id !== optimisticComment.id),
            };
          }
          return post;
        }));
        const errorMsg = error?.data?.errors?.[0]?.message || error?.data?.message || error.message || "Failed to add comment";
        toast.error(errorMsg);
      }
    }, {
      title: "Join the Discussion",
      message: "Sign in to leave a comment."
    });
  };

  const handleLike = async (postId) => {
    gateInteraction(async () => {
      // Optimistic like toggle with real user details
      const userId = user?.id || user?._id;
      setLoadedPosts(prev => prev.map(post => {
        if ((post._id || post.id) === postId) {
          const alreadyLiked = post.likes?.some(l => (l.id || l._id || l) === userId);
          return {
            ...post,
            likes: alreadyLiked
              ? (post.likes || []).filter(l => (l.id || l._id || l) !== userId)
              : [...(post.likes || []), {
                id: userId,
                _id: userId,
                name: user?.name,
                username: user?.username,
                profilePicture: user?.profilePicture
              }],
          };
        }
        return post;
      }));

      try {
        const res = await likePost(postId).unwrap();
        if (res.likes) {
          setLoadedPosts(prev => prev.map(post => {
            if ((post._id || post.id) === postId) {
              return {
                ...post,
                likes: res.likes,
                likesCount: res.likes.length
              };
            }
            return post;
          }));
        }
      } catch (error) {
        // Rollback
        setLoadedPosts(prev => prev.map(post => {
          if ((post._id || post.id) === postId) {
            const wasLiked = post.likes?.some(l => (l.id || l._id || l) === userId);
            return {
              ...post,
              likes: wasLiked
                ? (post.likes || []).filter(l => (l.id || l._id || l) !== userId)
                : [...(post.likes || []), {
                  id: userId,
                  _id: userId,
                  name: user?.name,
                  username: user?.username,
                  profilePicture: user?.profilePicture
                }],
            };
          }
          return post;
        }));
        toast.error(error?.data?.message || error.message || "Failed to like post");
      }
    });
  };

  const handleFollowToggle = async (targetUserId) => {
    gateInteraction(async () => {
      const isFollowing = followingIds.includes(targetUserId);
      
      // Optimistic update
      if (isFollowing) {
        dispatch(unfollowUser(targetUserId));
      } else {
        dispatch(followUser(targetUserId));
      }

      try {
        const endpoint = isFollowing
          ? `/api/user/players/${targetUserId}/unfollow`
          : `/api/user/players/${targetUserId}/follow`;

        await axiosInstance.post(endpoint);
      } catch (error) {
        // Revert on error
        if (isFollowing) {
          dispatch(followUser(targetUserId));
        } else {
          dispatch(unfollowUser(targetUserId));
        }
        toast.error("Failed to update follow status");
      }
    });
  };

  const copyShareLink = async (url, label = "Link copied!") => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(label);
    } catch (error) {
      toast.error("Unable to copy link");
    }
  };

  const handleShareToPlatform = async (platform, postId) => {
    const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    const text = "Check out this post on Kridaz!";
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const encodedTextWithUrl = encodeURIComponent(`${text} ${url}`);
    const openShare = (shareUrl) => window.open(shareUrl, "_blank", "noopener,noreferrer");

    if (platform === "native") {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Kridaz Community", text, url });
          setSharePostId(null);
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }
      await copyShareLink(url);
      setSharePostId(null);
      return;
    }

    if (platform === "copy") {
      await copyShareLink(url);
    } else if (platform === "twitter") {
      openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`);
    } else if (platform === "facebook") {
      openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    } else if (platform === "whatsapp") {
      openShare(`https://api.whatsapp.com/send?text=${encodedTextWithUrl}`);
    } else if (platform === "linkedin") {
      openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
    } else if (platform === "telegram") {
      openShare(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`);
    } else if (platform === "threads") {
      openShare(`https://www.threads.net/intent/post?text=${encodedTextWithUrl}`);
    } else if (platform === "reddit") {
      openShare(`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`);
    } else if (platform === "pinterest") {
      openShare(`https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`);
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent("Kridaz Community Post")}&body=${encodedTextWithUrl}`;
    } else if (platform === "sms") {
      window.location.href = `sms:?&body=${encodedTextWithUrl}`;
    } else if (platform === "messenger") {
      await copyShareLink(url, "Link copied for Messenger");
      openShare("https://www.messenger.com/");
    } else if (platform === "instagram") {
      await copyShareLink(url, "Link copied for Instagram");
      openShare("https://www.instagram.com/");
    } else if (platform === "snapchat") {
      await copyShareLink(url, "Link copied for Snapchat");
      openShare("https://www.snapchat.com/");
    } else if (platform === "tiktok") {
      await copyShareLink(url, "Link copied for TikTok");
      openShare("https://www.tiktok.com/");
    }

    setSharePostId(null);
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-white pt-4 pb-12 ${activeFilter === 'Reels' ? 'px-0 md:px-3' : 'px-1 md:px-3'} font-sans relative`}>



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
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[#111]">
                <Search size={20} className="text-[#BFF367]" />
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
                    <Loader2 size={32} className="text-[#BFF367] animate-spin" />
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
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-[8px] cursor-pointer transition-all group"
                      >
                        <div className="w-[46px] h-[46px] rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-white group-hover:text-[#BFF367] transition-colors truncate">{player.name}</div>
                          <div className="text-[12px] font-medium text-white/40 truncate">@{player.username || player.name.toLowerCase().replace(/\s+/g, '')}</div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/50 group-hover:border-[#BFF367] group-hover:text-[#BFF367] transition-all">
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
        <div className="grid grid-cols-1 gap-6">




          {/* ================= FEED (centered, full-width on desktop) ================= */}
          <div className={`max-w-3xl mx-auto w-full transition-all duration-300 ${activeFilter === 'Reels' ? 'h-[100dvh] sticky top-0 max-w-none' : 'space-y-2'}`}>

            {activeFilter !== "Reels" && (
              <div className="space-y-3 mb-2">




                {/* Stories Section */}
                {!debouncedSearchQuery.trim() && (
                  <div className="py-2 px-1">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-center pb-2">

                      {/* Add/View Your Story */}
                      <div className="flex flex-col items-center gap-2.5 shrink-0 group relative">
                        <div 
                          className={`w-[68px] h-[68px] rounded-full relative transition-transform ${myStoryGroup ? 'p-[2px] bg-gradient-to-r from-[#BFF367] to-[#BFF367]' : 'border border-dashed border-white/30 group-hover:border-[#BFF367]/50 p-0.5'}`}
                        >
                          <div 
                            onClick={() => {
                              if (myStoryGroup) {
                                setSelectedStoryGroup(myStoryGroup);
                                setCurrentStoryIndex(0);
                              } else {
                                gateInteraction(() => setShowStoryModal(true));
                              }
                            }}
                            className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[#111] cursor-pointer ${myStoryGroup ? 'border-2 border-[#0A0A0A]' : 'border border-white/10'}`}
                          >
                            {myStoryGroup && myStoryGroup.stories[0].mediaUrl ? (
                               <img 
                                 src={myStoryGroup.stories[0].thumbnailUrl || myStoryGroup.stories[0].mediaUrl} 
                                 className={`w-full h-full object-cover ${(myStoryGroup.stories.some(s => s.status === 'pending' || s.status === 'processing')) ? 'blur-sm opacity-50' : ''}`} 
                                 alt="Your story"
                               />
                            ) : myStoryGroup && myStoryGroup.stories[0].content ? (
                               <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-[#BFF367] font-bold bg-[#111]">
                                 {myStoryGroup.stories[0].content?.slice(0, 15)}
                               </div>
                            ) : (
                               <img 
                                 src={user?.profilePicture || user?.profileImage || "/default-avatar.png"} 
                                 className="w-full h-full object-cover opacity-60" 
                                 alt="Profile"
                               />
                            )}
                          </div>
                          <div 
                            onClick={(e) => {
                               e.stopPropagation();
                               gateInteraction(() => setShowStoryModal(true));
                            }}
                            className="absolute bottom-0 right-0 w-[22px] h-[22px] bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-full flex items-center justify-center border-2 border-[#0A0A0A] cursor-pointer hover:scale-110 transition-transform z-10"
                          >
                            <Plus size={12} strokeWidth={4} className="text-black" />
                          </div>
                        </div>
                        <span 
                          onClick={() => {
                            if (myStoryGroup) {
                              setSelectedStoryGroup(myStoryGroup);
                              setCurrentStoryIndex(0);
                            } else {
                              gateInteraction(() => setShowStoryModal(true));
                            }
                          }}
                          className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors cursor-pointer"
                        >
                          Your story
                        </span>
                      </div>

                      {/* Render Other Stories */}
                      {otherStories.map((group, idx) => (
                        <div
                          key={group._id}
                          onClick={() => { setSelectedStoryGroup(group); setCurrentStoryIndex(0); }}
                          className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
                        >
                          <div className={`w-[68px] h-[68px] rounded-full p-[2px] relative hover:scale-105 transition-transform ${idx === 0 ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367]' : 'bg-white/20'}`}>
                            <div className="w-full h-full rounded-full bg-[#0A0A0A] p-[2px]">
                              <div className="w-full h-full rounded-full overflow-hidden bg-[#111]">
                                {group.stories[0].mediaUrl ? (
                                  <img
                                    src={group.stories[0].thumbnailUrl || group.stories[0].mediaUrl}
                                    alt=""
                                    className={`w-full h-full object-cover ${(group.stories.some(s => s.status === 'pending' || s.status === 'processing')) ? 'blur-sm opacity-50' : ''}`}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-[#BFF367] font-bold bg-[#111]">
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
                          <span className="text-[10px] font-bold text-white/80 group-hover:text-[#BFF367] transition-colors truncate max-w-[68px]">
                            {group.user?.name?.split(' ')[0] || "Player"}
                          </span>
                        </div>
                      ))}


                    </div>
                  </div>
                )}

                {!debouncedSearchQuery.trim() && children}

                {/* Filters Row */}
                {!debouncedSearchQuery.trim() && (
                  <div>
                    {/* Desktop View Filters Row */}
                    <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar items-center">
                      {["All", "Following", "Reels", "Highlights", "Match Moments", "Announcements"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleSetActiveFilter(filter)}
                          className={`px-4 py-2 rounded-[6px] text-[11px] font-bold whitespace-nowrap transition-all border ${activeFilter === filter ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black border-transparent hover:brightness-110' : 'bg-transparent text-white/70 border-white/10 hover:bg-white/5 hover:text-white'}`}
                        >
                          {filter}
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        {/* Categories Dropdown â€” desktop */}
                        <div className="relative">
                          <select
                            className="bg-neutral-900 border border-white/10 rounded-full py-2 pl-3 pr-7 text-white text-[11px] font-bold focus:outline-none focus:border-[#BFF367]/40 transition-all appearance-none cursor-pointer"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            value={activeSportFilter}
                            onChange={(e) => setActiveSportFilter(e.target.value)}
                          >
                            <option value="" className="bg-neutral-950 text-white">All Categories</option>
                            {["Cricket", "Football", "Rugby", "Baseball", "Hockey", "Athletics"].map(s => (
                              <option key={s} value={s.toLowerCase()} className="bg-neutral-950 text-white">{s}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40">
                            <ChevronDown size={11} />
                          </div>
                        </div>
                        {/* Sort: Latest */}
                        <button className="px-3 py-2 rounded-[6px] bg-transparent border border-white/10 text-white/70 hover:bg-white/5 text-[11px] font-bold flex items-center gap-1.5">
                          Latest <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile View Filters Dropdowns */}
                    <div className="flex md:hidden gap-2.5 items-center justify-start">
                      {/* Mobile Reels Button */}
                      <button
                        onClick={() => handleSetActiveFilter(activeFilter === "Reels" ? "All" : "Reels")}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 z-10 group ${activeFilter === 'Reels' ? 'text-[#BFF367] bg-[#BFF367]/10' : 'text-white/70 hover:text-white'}`}
                      >
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[-1]">
                          <defs>
                            <linearGradient id="mob-reels-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop stopColor="#BFF367" offset="0%" />
                              <stop stopColor="#BFF367" offset="100%" />
                            </linearGradient>
                          </defs>
                          <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="14" fill="none" stroke="url(#mob-reels-grad)" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" className={`transition-opacity ${activeFilter === 'Reels' ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                        </svg>
                        <PlaySquare size={12} className={activeFilter === 'Reels' ? 'text-[#BFF367]' : 'text-white/70 group-hover:text-white transition-colors'} />
                        Reels
                      </button>

                      {/* Features Dropdown */}
                      <div className="relative w-[115px]">
                        <select
                          className="w-full bg-neutral-900 border border-white/10 rounded-[8px] py-1.5 pl-2.5 pr-6 text-white text-[10px] font-bold focus:outline-none focus:border-[#BFF367]/40 transition-all appearance-none cursor-pointer"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          value={activeFilter}
                          onChange={(e) => handleSetActiveFilter(e.target.value)}
                        >
                          {["All", "Following", "Reels", "Highlights", "Match Moments", "Announcements"].map(filter => (
                            <option key={filter} value={filter} className="bg-neutral-950 text-white">{filter}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                          <ChevronDown size={10} />
                        </div>
                      </div>

                      {/* Categories Dropdown */}
                      <div className="relative w-[115px]">
                        <select
                          className="w-full border border-transparent rounded-[8px] py-1.5 pl-2.5 pr-6 text-white text-[10px] font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-[0_0_15px_rgba(85,222,232,0.1)]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            backgroundImage: "linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), linear-gradient(to right, #BFF367, #BFF367)",
                            backgroundOrigin: "border-box",
                            backgroundClip: "padding-box, border-box"
                          }}
                          value={activeSportFilter}
                          onChange={(e) => setActiveSportFilter(e.target.value)}
                        >
                          <option value="" className="bg-neutral-950 text-white">Categories</option>
                          {["Cricket", "Football", "Rugby", "Baseball", "Hockey", "Athletics"].map(s => (
                            <option key={s} value={s.toLowerCase()} className="bg-neutral-950 text-white">{s}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                          <ChevronDown size={10} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Players Search Results Section */}
                {debouncedSearchQuery.trim() !== "" && (
                  <div className="flex flex-col gap-3 bg-[#0A0A0A] border border-white/5 rounded-[8px] p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#BFF367]" style={HEADING_STYLE}>
                        PLAYERS MATCHING "{debouncedSearchQuery}"
                      </h3>
                      {playersLoading && <Loader2 size={16} className="text-[#BFF367] animate-spin" />}
                    </div>

                    {loadedPlayers.length === 0 && !playersLoading ? (
                      <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                        No players found
                      </div>
                    ) : (
                      <div
                        className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scroll-smooth"
                        style={{ maxHeight: "240px", minHeight: loadedPlayers.length > 1 ? "180px" : "90px" }}
                        onScroll={handlePlayersHorizontalScroll}
                      >
                        {loadedPlayers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => navigate(`/profile/${player.id}`)}
                            className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-[#BFF367]/30 p-3 rounded-[8px] cursor-pointer transition-all min-w-[220px] max-w-[280px] group shrink-0"
                          >
                            <div className="w-[42px] h-[42px] rounded-full bg-[#111] border border-white/10 overflow-hidden shrink-0">
                              <img
                                src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-white group-hover:text-[#BFF367] transition-colors truncate">
                                {player.name}
                              </div>
                              <div className="text-[11px] font-medium text-white/40 truncate">
                                @{player.username || player.name.toLowerCase().replace(/\s+/g, '')}
                              </div>
                              {(player.city || player.state) && (
                                <div className="text-[9px] font-semibold text-[#BFF367] mt-0.5 uppercase tracking-wider truncate">
                                  {player.city}{player.city && player.state ? ', ' : ''}{player.state}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {hasMorePlayers && playersLoading && (
                          <div className="flex items-center justify-center px-6 shrink-0 h-full">
                            <Loader2 size={24} className="text-[#BFF367] animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Matching Heading */}
                {debouncedSearchQuery.trim() !== "" && (
                  <div className="pt-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#BFF367]" style={HEADING_STYLE}>
                      POSTS MATCHING "{debouncedSearchQuery}"
                    </h3>
                  </div>
                )}
              </div>
            )}

            {/* Main Feed Posts / Reels */}
            {activeFilter === "Reels" ? (
              <div className="relative flex flex-col items-center justify-center h-[100dvh] bg-black md:rounded-[8px]">
                {/* Back button & header */}
                <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSetActiveFilter("All")}
                      className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 text-white px-3 py-2 rounded-[8px] text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft size={14} strokeWidth={2.5} />
                      <span>Community</span>
                    </button>
                  </div>
                  <button
                    onClick={() => gateInteraction(() => navigate('/reels/upload'))}
                    className="flex items-center gap-1.5 bg-[#BFF367] text-black px-3 py-2 rounded-[8px] text-xs font-black uppercase tracking-widest hover:bg-[#BFF367] transition-colors shadow-lg shadow-[#BFF367]/20"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>Upload</span>
                  </button>
                </div>
                <div
                  ref={reelsContainerRef}
                  className="w-full aspect-[9/16] max-h-[100dvh] md:h-full md:w-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar md:rounded-[8px] bg-black shadow-2xl mx-auto"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollTop / el.clientHeight);
                    if (idx !== activeReelIndex) {
                      setActiveReelIndex(idx);
                    }
                    if (reels.length > 0 && idx >= reels.length - 2 && !reelsFetching && reelsData?.nextCursor) {
                      setReelCursor(reelsData.nextCursor);
                    }
                  }}
                >
                  {reelsLoading ? (
                    <div className="h-full flex items-center justify-center bg-black">
                      <Loader2 size={36} className="text-[#BFF367] animate-spin" />
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
                      <Loader2 size={24} className="text-[#BFF367] animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            ) : postsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="text-[#BFF367] animate-spin" />
              </div>
            ) : loadedPosts.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-16 text-center text-white/30 font-bold uppercase tracking-widest text-sm">
                No posts found
              </div>
            ) : (
              <div className="space-y-6">
                {loadedPosts.map(post => (
                  <div key={getPostId(post)} className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-5 space-y-4">
                    {/* Post Header */}
                    <div className="flex items-center justify-between">
                      <Link to={`/profile/${post.adminId?.id || post.adminId?._id || post.author?.id || post.author?._id || post.authorId}`} className="flex items-center gap-3 group">
                        <img
                          src={post.adminId?.profilePicture || "/default-avatar.png"}
                          className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#BFF367]/50 transition-colors"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-white transition-colors">{post.adminId?.name || "Player"}</span>
                            <ShieldCheck size={14} className="text-[#BFF367]" />
                          </div>
                          <div className="text-[11px] font-bold text-white/40 mt-0.5">
                            2h ago
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === getPostId(post) ? null : getPostId(post))}
                            className="text-white/40 hover:text-white transition-colors p-2"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdownId === getPostId(post) && (
                            <div className="absolute right-0 mt-2 w-32 bg-neutral-900 border border-white/10 rounded-[8px] shadow-lg overflow-hidden z-50">
                              {((post.adminId?.id || post.adminId?._id) === (user?.id || user?._id) || (post.author?.id || post.author?._id) === (user?.id || user?._id) || post.authorId === (user?.id || user?._id)) ? (
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleDeletePost(getPostId(post));
                                  }}
                                  className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-white/5 transition-colors"
                                >
                                  Delete
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setReportPostId(getPostId(post));
                                    setShowReportModal(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-[12px] font-bold text-white hover:bg-white/5 transition-colors"
                                >
                                  Report
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Caption */}
                    {(post.title || post.content) && (
                      <div className="text-[12px] font-medium leading-relaxed">
                        {post.title && <span className="font-bold mr-2">{post.title}</span>}
                        <span className="text-white/90 whitespace-pre-wrap">{post.content}</span>
                      </div>
                    )}

                    {(post.image || post.imageUrl || post.mediaUrl) && (
                      <div className="relative rounded-[8px] overflow-hidden group border border-white/5 bg-[#111]">
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
                                  stroke="#BFF367"
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
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BFF367] animate-pulse">
                                {post.status === 'processing' ? 'Optimizing Media' : 'Preparing Upload'}
                              </span>
                              <div className="flex gap-1">
                                <span className="w-1 h-1 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-full animate-bounce"></span>
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
                        <button onClick={() => handleLike(getPostId(post))} className="flex items-center gap-2 group">
                          <ThumbsUp size={20} className={`transition-colors ${post.likes?.some(l => (l.id || l._id || l) === (user?.id || user?._id)) ? 'fill-[#BFF367] text-[#BFF367]' : 'text-white/70 group-hover:text-[#BFF367]'}`} />
                          <span className="text-[12px] font-bold text-white">{post.likes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [getPostId(post)]: !prev[getPostId(post)] }))}
                          className="flex items-center gap-2 group"
                        >
                          <MessageCircle size={20} className={`transition-colors ${expandedComments[getPostId(post)] ? 'text-[#BFF367]' : 'text-white/70 group-hover:text-[#BFF367]'}`} />
                          <span className="text-[12px] font-bold text-white">{post.comments?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const postId = getPostShareId(post);
                            if (!postId) {
                              toast.error("Unable to share this post");
                              return;
                            }
                            setSharePostId(postId);
                          }}
                          className="flex items-center gap-2 group"
                        >
                          <Send size={18} className="text-white/70 group-hover:text-[#BFF367] transition-colors" />
                          <span className="text-[12px] font-bold text-white">Share</span>
                        </button>
                      </div>
                    </div>

                    {/* Likes Summary */}
                    {post.likes?.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px] font-medium text-white/50 pt-1">
                        <div className="flex -space-x-1.5 shrink-0">
                          {post.likes.slice(0, 3).map((likeUser, i) => (
                            <div key={likeUser.id || likeUser._id || i} className="w-5 h-5 rounded-full bg-zinc-800 border border-[#0A0A0A] overflow-hidden flex items-center justify-center shrink-0">
                              {likeUser.profilePicture ? (
                                <img src={likeUser.profilePicture} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-white text-[8px] font-bold">
                                  {(likeUser.username || likeUser.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-white/50 font-medium">
                          {post.likes.length === 1 && (
                            <span>
                              Liked by{' '}
                              <span className="font-bold text-white">
                                {post.likes[0].username || post.likes[0].name || 'User'}
                              </span>
                            </span>
                          )}
                          {post.likes.length === 2 && (
                            <span>
                              Liked by{' '}
                              <span className="font-bold text-white">
                                {post.likes[0].username || post.likes[0].name || 'User'}
                              </span>{' '}
                              and{' '}
                              <span className="font-bold text-white">
                                {post.likes[1].username || post.likes[1].name || 'User'}
                              </span>
                            </span>
                          )}
                          {post.likes.length > 2 && (
                            <span>
                              Liked by{' '}
                              <span className="font-bold text-white">
                                {post.likes[0].username || post.likes[0].name || 'User'}
                              </span>
                              ,{' '}
                              <span className="font-bold text-white">
                                {post.likes[1].username || post.likes[1].name || 'User'}
                              </span>{' '}
                              and{' '}
                              <span className="font-bold text-white">
                                {post.likes.length - 2} {post.likes.length - 2 === 1 ? 'other' : 'others'}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Expandable Comments Section */}
                    <AnimatePresence>
                      {expandedComments[getPostId(post)] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-2 border-t border-white/5">
                            {/* Scrollable Comments List – max 4 visible */}
                            {post.comments && post.comments.length > 0 && (
                              <div className="max-h-[200px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {post.comments.slice(0, 4).map((comment) => {
                                  const commentUser = comment.userId || comment.user;
                                  return (
                                    <div key={comment.id || comment._id} className="flex items-start gap-2 text-[12px] leading-relaxed">
                                      <Link to={`/profile/${commentUser?.id || commentUser?._id}`} className="font-bold text-white hover:text-[#BFF367] transition-colors shrink-0">
                                        {commentUser?.name || commentUser?.username || "Player"}
                                      </Link>
                                      <span className="text-white/80 break-words">{comment.text}</span>
                                    </div>
                                  );
                                })}
                                {post.comments.length > 4 && (
                                  <button className="text-[11px] text-[#BFF367] font-bold hover:underline">
                                    View all {post.comments.length} comments
                                  </button>
                                )}
                              </div>
                            )}
                            {post.comments?.length === 0 && (
                              <p className="text-[12px] text-white/30 italic">No comments yet. Be the first!</p>
                            )}

                            {/* Comment Input */}
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                              <img src={user?.profilePicture || "/default-avatar.png"} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent text-[12px] font-medium outline-none text-white placeholder:text-white/40"
                                value={commentInputs[getPostId(post)] || ""}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [getPostId(post)]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(getPostId(post));
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(getPostId(post))}
                                disabled={!commentInputs[getPostId(post)]?.trim()}
                                className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-all ${commentInputs[getPostId(post)]?.trim()
                                    ? 'bg-[#BFF367] text-black hover:bg-[#BFF367]/80 cursor-pointer'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                  }`}
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ))}
                {hasMorePosts && postsLoading && (
                  <div className="py-6 flex justify-center">
                    <Loader2 size={24} className="text-[#BFF367] animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>



        </div>
      </div>

      <AnimatePresence>
        {/* Share Modal */}
        {sharePostId && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharePostId(null)}
              className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="relative z-20 w-full max-h-[86vh] overflow-hidden rounded-t-[24px] border border-white/10 bg-neutral-950/95 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:max-w-xl sm:rounded-[8px]"
              style={HEADING_STYLE}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-lg font-black text-white" style={HEADING_STYLE}>Share post</h3>
                  <p className="mt-1 text-[11px] font-medium text-white/45">
                    Choose a platform to send this community post.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSharePostId(null)}
                  className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close share options"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative px-5 py-5 sm:px-6">
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 sm:gap-x-4">
                  {sharePlatforms.map((app) => {
                    const Icon = app.icon;

                    return (
                      <div key={app.id} className="flex min-w-0 flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShareToPlatform(app.id, sharePostId)}
                          className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFF367]/25 bg-gradient-to-br from-[#BFF367]/10 to-[#BFF367]/10 text-white/80 shadow-[0_0_18px_rgba(85,222,232,0.08)] transition-all hover:border-[#BFF367]/50 hover:from-[#BFF367]/20 hover:to-[#BFF367]/20 hover:text-[#BFF367] active:scale-95"
                          aria-label={`Share to ${app.name}`}
                        >
                          <Icon size={23} strokeWidth={2.2} />
                        </button>
                        <span className="w-full truncate text-center text-[10px] font-bold text-white/60">
                          {app.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Post Modal */}
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ perspective: "1200px" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePostModal}
              className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 30, scale: 0.95, rotateX: 5 }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="relative w-full max-w-lg bg-neutral-950/80 border border-white/5 rounded-[8px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            >
              {/* Dual Glowing Spots using the new gradient stops */}
              <div className="absolute -top-24 -left-24 w-52 h-52 bg-[#BFF367]/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#BFF367]/5 blur-[80px] rounded-full pointer-events-none" />

              {/* Redesigned Premium Header */}
              <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-white tracking-wide" style={HEADING_STYLE}>
                    {editingPost ? 'Edit Post' : 'Create Post'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5" style={SUBHEADING_STYLE}>
                    Share something with the community
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Sports Dropdown */}
                  <div className="relative">
                    <select
                      className="border border-transparent rounded-[8px] py-1.5 pl-3 pr-8 text-white text-[10px] font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-[0_0_15px_rgba(85,222,232,0.1)]"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        backgroundImage: "linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), linear-gradient(to right, #BFF367, #BFF367)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box"
                      }}
                      value={newPost.sport}
                      onChange={(e) => setNewPost(prev => ({ ...prev, sport: e.target.value }))}
                    >
                      <option value="" className="bg-neutral-950 text-white">All Sports</option>
                      {["Cricket", "Football", "Rugby", "Baseball", "Hockey", "Athletics"].map(s => (
                        <option key={s} value={s.toUpperCase()} className="bg-neutral-950 text-white">{s}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                      <ChevronDown size={10} />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.08, backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
                    whileTap={{ scale: 0.92 }}
                    onClick={closePostModal}
                    className="p-1.5 rounded-full text-white/40 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              {/* User Profile Section */}
              <div className="flex items-center gap-3 px-5 pt-3.5 pb-1 relative z-10">
                <img
                  src={user?.profilePicture || "/default-avatar.png"}
                  className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-900"
                  alt=""
                />
                <div>
                  <span className="text-xs font-bold text-white block tracking-wide" style={SUBHEADING_STYLE}>
                    {user?.username || user?.name || "Gamer"}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#BFF367] uppercase tracking-wider mt-0.5" style={SUBHEADING_STYLE}>
                    <Globe size={10} />
                    <span>Posting publicly</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="relative px-5 pb-5 pt-3 space-y-3.5 z-10">
                {/* Title Input */}
                <div className="relative group/title">
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Title (Optional)"
                    maxLength={80}
                    style={SUBHEADING_STYLE}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] h-10 px-3.5 text-white text-xs outline-none transition-all duration-300 placeholder:text-white/20"
                  />
                  {newPost.title.length > 0 && (
                    <span className="absolute right-3.5 top-3 text-[9px] font-bold text-neutral-500" style={SUBHEADING_STYLE}>
                      {newPost.title.length}/80
                    </span>
                  )}
                </div>

                {/* Content Input (Redesigned Textarea) */}
                <div className="relative group/content">
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Whatâ€™s happening in your match? Share updates, highlights, or announcementsâ€¦"
                    maxLength={1000}
                    style={SUBHEADING_STYLE}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] min-h-[100px] max-h-[200px] p-3.5 text-white text-xs outline-none transition-all duration-300 resize-none placeholder:text-white/20"
                  />
                  {newPost.content.length > 0 && (
                    <span className="absolute right-3.5 bottom-3.5 text-[9px] font-bold text-neutral-500" style={SUBHEADING_STYLE}>
                      {newPost.content.length}/1000
                    </span>
                  )}
                </div>

                {/* Visual Image Preview */}
                {postImagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -5 }}
                    className="relative h-36 w-full rounded-[8px] overflow-hidden border border-white/5 group shadow-lg"
                  >
                    <img src={postImagePreview} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-white/10" style={SUBHEADING_STYLE}>Image Selected</span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08, backgroundColor: "#ef4444" }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setNewPost({ ...newPost, image: null }); setPostImagePreview(null); }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 rounded-full text-white transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </motion.button>
                  </motion.div>
                )}

                {/* Modern Toolbar & Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  {/* Left Side: Modern Minimal Toolbar */}
                  <div className="flex items-center gap-2">
                    {/* Image Selector Button */}
                    <div className="relative">
                      <motion.button
                        type="button"
                        style={SUBHEADING_STYLE}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(85,222,232,0.08)", border: "1px solid rgba(85,222,232,0.2)", color: "#BFF367" }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 bg-white/[0.02] border border-white/5 rounded-[8px] text-neutral-400 hover:text-[#BFF367] transition-all flex items-center justify-center cursor-pointer"
                        title="Add Image"
                      >
                        <ImageIcon size={16} />
                      </motion.button>
                      <input type="file" onChange={handlePostImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    </div>

                    {/* Image Upload Status capsule */}
                    {newPost.image && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-800 rounded-[8px] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-400"
                        style={SUBHEADING_STYLE}
                      >
                        <ShieldCheck size={12} className="text-[#BFF367]" />
                        <span className="truncate max-w-[80px]">{newPost.image.name || "media.jpg"}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Side: Action Button Clusters */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={closePostModal}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 h-9 rounded-[8px] text-xs font-bold text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={isPublishing || (!newPost.content.trim() && !newPost.image)}
                      style={SUBHEADING_STYLE}
                      whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px rgba(85,222,232,0.18)", filter: "brightness(1.04)" }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black px-5 h-9 rounded-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed text-xs cursor-pointer group/publish"
                    >
                      {isPublishing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={12} className="group-hover/publish:translate-x-0.5 group-hover/publish:-translate-y-0.5 transition-transform duration-300" />
                      )}
                      {isPublishing ? "Saving..." : (editingPost ? "Update" : "Post")}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Story Modal */}
        {showStoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStoryModal(false)}
              className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 30, scale: 0.95, rotateX: 5 }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="relative w-full max-w-lg bg-neutral-950/80 border border-white/5 rounded-[8px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            >
              {/* Dual Glowing Spots using the same brand gradient stops */}
              <div className="absolute -top-24 -left-24 w-52 h-52 bg-[#BFF367]/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#BFF367]/5 blur-[80px] rounded-full pointer-events-none" />

              {/* Premium Header */}
              <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-white tracking-wide" style={HEADING_STYLE}>Create Story</h3>
                  <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5" style={SUBHEADING_STYLE}>
                    Share quick updates with your community
                  </p>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.08, backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowStoryModal(false)}
                  className="p-1.5 rounded-full text-white/40 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* User Profile Section */}
              <div className="flex items-center gap-3 px-5 pt-3.5 pb-1 relative z-10">
                <img
                  src={user?.profilePicture || "/default-avatar.png"}
                  className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-900"
                  alt=""
                />
                <div>
                  <span className="text-xs font-bold text-white block tracking-wide" style={SUBHEADING_STYLE}>
                    {user?.username || user?.name || "Gamer"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleUploadStory} className="relative px-5 pb-5 pt-3 space-y-3.5 z-10">
                {/* Textarea */}
                <div className="relative group/content">
                  <textarea
                    value={newStory.content}
                    onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                    placeholder="Share a quick moment, match update, highlight, or announcement..."
                    style={SUBHEADING_STYLE}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] h-20 p-3 text-white text-xs outline-none transition-all duration-300 resize-none placeholder:text-white/20"
                  />
                </div>

                {/* Expiry Duration Dropdown */}
                <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-[8px]">
                  <span className="text-xs text-neutral-400 font-bold" style={SUBHEADING_STYLE}>Expiry Duration</span>
                  <div className="relative">
                    <select
                      className="border border-transparent rounded-[8px] py-1.5 pl-3 pr-8 text-white text-[10px] font-bold focus:outline-none transition-all appearance-none cursor-pointer"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        backgroundImage: "linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), linear-gradient(to right, #BFF367, #BFF367)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box"
                      }}
                      value={newStory.durationDays}
                      onChange={(e) => setNewStory(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <option key={d} value={d} className="bg-neutral-950 text-white">{d} {d === 1 ? 'Day' : 'Days'}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                      <ChevronDown size={10} />
                    </div>
                  </div>
                </div>

                {/* Aspect 9:16 Live Preview */}
                {storyMediaPreviews.length > 0 && (
                  <div className="flex justify-center py-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-[9/16] h-52 rounded-[8px] overflow-hidden border border-white/5 group shadow-2xl bg-neutral-900"
                    >
                      <img src={storyMediaPreviews[0]} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-all duration-700" />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 px-2.5 py-1.5 rounded-full border border-white/10" style={SUBHEADING_STYLE}>Preview</span>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08, backgroundColor: "#ef4444" }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setNewStory({ ...newStory, mediaFiles: [] });
                          setStoryMediaPreviews([]);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 rounded-full text-white transition-colors cursor-pointer"
                        title="Remove media"
                      >
                        <X size={12} />
                      </motion.button>
                    </motion.div>
                  </div>
                )}


                {/* Toolbar & Submission row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                  {/* Modern Compact Toolbar */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <motion.button
                        type="button"
                        style={SUBHEADING_STYLE}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(85,222,232,0.08)", border: "1px solid rgba(85,222,232,0.2)", color: "#BFF367" }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 bg-white/[0.02] border border-white/5 rounded-[8px] text-neutral-400 hover:text-[#BFF367] transition-all flex items-center justify-center cursor-pointer"
                        title="Upload Photo/Video"
                      >
                        <ImageIcon size={16} />
                      </motion.button>
                      <input type="file" multiple onChange={handleStoryMediaChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                    </div>

                    {storyMediaPreviews.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-800 rounded-[8px] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-400"
                        style={SUBHEADING_STYLE}
                      >
                        <ShieldCheck size={12} className="text-[#BFF367]" />
                        <span>{storyMediaPreviews.length} Selected</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Actions clusters */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => setShowStoryModal(false)}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 h-9 rounded-[8px] text-xs font-bold text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={isPublishing || (!newStory.content.trim() && storyMediaPreviews.length === 0)}
                      style={SUBHEADING_STYLE}
                      whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px rgba(85,222,232,0.18)", filter: "brightness(1.04)" }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black px-5 h-9 rounded-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed text-xs cursor-pointer group/story"
                    >
                      {isPublishing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Plus size={12} className="group-hover/story:scale-110 transition-transform duration-300" />
                      )}
                      {isPublishing ? "Posting..." : "Post Story"}
                    </motion.button>
                  </div>
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
          onNextUser={() => {
            const getUserId = (g) => g?.user?._id || g?.user?.id;
            const isMyStory = myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);
            
            if (isMyStory) {
              setSelectedStoryGroup(null);
              return;
            }

            const displayStories = otherStories;
            const currentIndex = displayStories.findIndex(g => getUserId(g) === getUserId(selectedStoryGroup));
            if (currentIndex !== -1 && currentIndex < displayStories.length - 1) {
               setSelectedStoryGroup(displayStories[currentIndex + 1]);
            } else {
               setSelectedStoryGroup(null);
            }
          }}
          onPrevUser={() => {
            const getUserId = (g) => g?.user?._id || g?.user?.id;
            const isMyStory = myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);
            
            if (isMyStory) return;

            const displayStories = otherStories;
            const currentIndex = displayStories.findIndex(g => getUserId(g) === getUserId(selectedStoryGroup));
            if (currentIndex > 0) {
               setSelectedStoryGroup(displayStories[currentIndex - 1]);
            }
          }}
        />
      )}
    </div>
  );
};

export default Community;
