import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ChevronDown, PlaySquare, Loader2, Edit3 } from "lucide-react";
import { useLazyGetCommunityFeedQuery, useDeletePostMutation } from "@redux/api/communityApi";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import { useSocket } from "@context/SocketContext";
import PostItem from "./PostItem";
import CreatePostModal from "./CreatePostModal";
import ShareModal from "./ShareModal";
import ReportModal from "./ReportModal";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const CommunityFeed = ({ user, isLoggedIn, isAdmin, gateInteraction, activeFilter, handleSetActiveFilter, activeSportFilter, setActiveSportFilter, debouncedSearchQuery, children }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);
  const { socket } = useSocket();

  const [triggerGetFeed] = useLazyGetCommunityFeedQuery();
  const [triggerSearchPlayers] = useLazySearchPlayersQuery();
  const [deletePost] = useDeletePostMutation();

  // Pagination & lists state
  const [postsPage, setPostsPage] = useState(1);
  const [loadedPosts, setLoadedPosts] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showDesktopInlinePost, setShowDesktopInlinePost] = useState(false);
  const [sortOrder, setSortOrder] = useState("latest");

  const [playersPage, setPlayersPage] = useState(1);
  const [loadedPlayers, setLoadedPlayers] = useState([]);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(false);

  // Modals / actions states
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [sharePostId, setSharePostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);

  // Check URL params for creating a post (e.g. from Team Profile share)
  useEffect(() => {
    if (searchParams.get("createPost") === "true") {
      const text = searchParams.get("text");
      if (text) {
        setEditingPost({ content: text, isPrefill: true });
      } else {
        setEditingPost(null);
      }
      setShowPostModal(true);

      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("createPost");
      newParams.delete("text");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Reset lists and page numbers when search query or filters change
  useEffect(() => {
    setLoadedPosts([]);
    setPostsPage(1);
    setHasMorePosts(true);

    setLoadedPlayers([]);
    setPlayersPage(1);
    setHasMorePlayers(true);
  }, [debouncedSearchQuery, activeFilter, activeSportFilter, sortOrder]);

  // Fetch function for posts feed
  const fetchPosts = async (pageNumber, isSearch) => {
    if (postsLoading) return;
    setPostsLoading(true);

    try {
      const params = {
        page: pageNumber,
        limit: 10,
        sort: sortOrder,
      };

      if (isSearch) {
        params.search = debouncedSearchQuery;
      } else {
        if (activeFilter === "Following") {
          params.following = "true";
        }
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }
      }

      const res = await triggerGetFeed(params).unwrap();
      const newPosts = res?.posts || [];

      setLoadedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id || p.id));
        const filtered = newPosts.filter((p) => !existingIds.has(p._id || p.id));
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
        limit: 10,
      }).unwrap();
      const newPlayers = res?.players || [];

      setLoadedPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id || p._id));
        const filtered = newPlayers.filter((p) => !existingIds.has(p.id || p._id));
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

  // Effects to trigger data fetches
  useEffect(() => {
    if (locationStatus === "detecting") return;
    if (postsPage === 1) {
      fetchPosts(1, !!debouncedSearchQuery.trim());
    }
  }, [postsPage, debouncedSearchQuery, activeFilter, activeSportFilter, sortOrder, userLocation, locationStatus]);

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
      if (postsLoading || !hasMorePosts) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        setPostsPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [postsLoading, hasMorePosts]);

  // Horizontal scroll listener for players search results pagination
  const handlePlayersHorizontalScroll = (e) => {
    if (playersLoading || !hasMorePlayers) return;
    const target = e.currentTarget;
    if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 100) {
      setPlayersPage((prev) => prev + 1);
    }
  };

  // Socket.io updates for reactive feed lists
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      const formatted = {
        ...newPost,
        _id: newPost.id || newPost._id,
        adminId: newPost.author,
        mediaUrl: newPost.mediaUrls?.[0],
        image: newPost.mediaType === "image" ? newPost.mediaUrls?.[0] : null,
        videoUrl: newPost.mediaType === "video" ? newPost.mediaUrls?.[0] : null,
        likesCount: newPost.likes?.length || 0,
        totalComments: newPost.comments?.length || 0,
        comments:
          newPost.comments?.map((c) => ({
            ...c,
            userId: c.user,
          })) || [],
      };

      setLoadedPosts((prev) => {
        if (prev.find((p) => (p._id || p.id) === (formatted._id || formatted.id))) return prev;
        return [formatted, ...prev];
      });
    };

    const handlePostLiked = ({ postId, likes, likesCount }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              likes,
              likesCount: likesCount !== undefined ? likesCount : likes.length,
            };
          }
          return post;
        })
      );
    };

    const handlePostCommented = ({ postId, comments }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              comments: comments.map((c) => ({ ...c, userId: c.user })),
              totalComments: comments.length,
            };
          }
          return post;
        })
      );
    };

    const handlePostDeleted = (postId) => {
      setLoadedPosts((prev) => prev.filter((post) => post._id !== postId && post.id !== postId));
    };

    const handleMediaProgress = ({ mediaId, progress }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === mediaId || post.id === mediaId) {
            return {
              ...post,
              status: "pending",
              processingProgress: progress,
            };
          }
          return post;
        })
      );
    };

    const handleMediaComplete = ({ mediaId, hlsUrl, thumbnailUrl }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === mediaId || post.id === mediaId) {
            return {
              ...post,
              status: "ready",
              mediaUrl: hlsUrl,
              image: thumbnailUrl,
              processingProgress: 100,
            };
          }
          return post;
        })
      );
    };

    socket.on("new_community_post", handleNewPost);
    socket.on("community_post_liked", handlePostLiked);
    socket.on("community_post_commented", handlePostCommented);
    socket.on("community_post_deleted", handlePostDeleted);
    socket.on("MEDIA_PROCESSING_PROGRESS", handleMediaProgress);
    socket.on("MEDIA_PROCESSING_COMPLETE", handleMediaComplete);

    return () => {
      socket.off("new_community_post", handleNewPost);
      socket.off("community_post_liked", handlePostLiked);
      socket.off("community_post_commented", handlePostCommented);
      socket.off("community_post_deleted", handlePostDeleted);
      socket.off("MEDIA_PROCESSING_PROGRESS", handleMediaProgress);
      socket.off("MEDIA_PROCESSING_COMPLETE", handleMediaComplete);
    };
  }, [socket]);

  // Handle post card update callbacks (optimistic updates/mutation updates)
  const handleUpdatePost = (postId, updaterFn) => {
    setLoadedPosts((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) {
          return updaterFn(p);
        }
        return p;
      })
    );
  };

  // Handle post card deletion callbacks
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId).unwrap();
      toast.success("Post deleted");
      setLoadedPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete post");
    }
  };

  return (
    <div className="space-y-6 mb-4">
      {/* Search overlay/children placeholder */}
      {!debouncedSearchQuery.trim() && children}

      {/* Filters Row */}
      {!debouncedSearchQuery.trim() && (
        <div className="mb-6">
          {/* Unified View Filters Dropdowns */}
          <div className="grid grid-cols-3 md:flex gap-2 items-center w-full pb-1">
            {/* Reels Toggle */}
            <button
              onClick={() => handleSetActiveFilter(activeFilter === "Reels" ? "All" : "Reels")}
              className={`flex items-center justify-center gap-1 px-1 py-2 rounded-[8px] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 min-w-0 ${
                activeFilter === "Reels" 
                  ? "bg-[#BFF367] text-black shadow-[0_0_10px_rgba(191,243,103,0.3)] border-transparent" 
                  : "bg-[#111] text-white/70 hover:bg-[#1A1A1A] hover:text-white border border-white/10"
              }`}
            >
              <PlaySquare size={13} className={`shrink-0 ${activeFilter === "Reels" ? "text-black" : "text-white/70"}`} />
              <span className="truncate">Reels</span>
            </button>

            {/* Post Type Filter */}
            <div className="relative min-w-0">
              <select
                className="w-full bg-[#111] border border-white/10 rounded-[8px] py-2 pl-2 pr-5 sm:pl-4 sm:pr-8 text-white text-[10px] sm:text-[11px] font-bold focus:outline-none focus:border-[#BFF367]/50 transition-all appearance-none cursor-pointer hover:bg-[#1A1A1A] truncate"
                value={activeFilter}
                onChange={(e) => handleSetActiveFilter(e.target.value)}
              >
                {["All", "Following", "Highlights", "Match Moments", "Announcements"].map((filter) => (
                  <option key={filter} value={filter} className="bg-neutral-900 text-white">
                    {filter}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDown size={12} />
              </div>
            </div>

            {/* Sport Category Filter */}
            <div className="relative min-w-0">
              <select
                className="w-full bg-[#111] border border-white/10 rounded-[8px] py-2 pl-2 pr-5 sm:pl-4 sm:pr-8 text-white text-[10px] sm:text-[11px] font-bold focus:outline-none focus:border-[#BFF367]/50 transition-all appearance-none cursor-pointer hover:bg-[#1A1A1A] truncate"
                value={activeSportFilter}
                onChange={(e) => setActiveSportFilter(e.target.value)}
              >
                <option value="" className="bg-neutral-900 text-white">All Categories</option>
                {["Cricket", "Football", "Rugby", "Baseball", "Hockey", "Athletics"].map((s) => (
                  <option key={s} value={s.toLowerCase()} className="bg-neutral-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDown size={12} />
              </div>
            </div>
            
            <div className="ml-auto hidden md:flex shrink-0 pl-2">
              <div className="relative">
                <select
                  className="bg-[#111] border border-white/10 rounded-[8px] py-2 pl-4 pr-8 text-white text-[11px] font-bold focus:outline-none focus:border-[#BFF367]/50 transition-all appearance-none cursor-pointer hover:bg-[#1A1A1A]"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="latest" className="bg-neutral-900 text-white">Latest</option>
                  <option value="top" className="bg-neutral-900 text-white">Top Posts</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players Matching Section */}
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
              {loadedPlayers.map((player) => (
                <div
                  key={player.id || player._id}
                  onClick={() => navigate(`/profile/${player.id || player._id}`)}
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
                      @{player.username || player.name.toLowerCase().replace(/\s+/g, "")}
                    </div>
                    {(player.city || player.state) && (
                      <div className="text-[9px] font-semibold text-[#BFF367] mt-0.5 uppercase tracking-wider truncate">
                        {player.city}
                        {player.city && player.state ? ", " : ""}
                        {player.state}
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

      {/* Posts Heading if searching */}
      {debouncedSearchQuery.trim() !== "" && (
        <div className="pt-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#BFF367]" style={HEADING_STYLE}>
            POSTS MATCHING "{debouncedSearchQuery}"
          </h3>
        </div>
      )}



      {/* Feed list */}
      {postsLoading && loadedPosts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-[#BFF367] animate-spin" />
        </div>
      ) : loadedPosts.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-16 text-center text-white/30 font-bold uppercase tracking-widest text-sm">
          No posts found
        </div>
      ) : (
        <div className="space-y-6">
          {loadedPosts.map((post) => (
            <PostItem
              key={post._id || post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              gateInteraction={gateInteraction}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onSharePost={(id) => setSharePostId(id)}
              onReportPost={(id) => setReportPostId(id)}
            />
          ))}
          {hasMorePosts && postsLoading && (
            <div className="py-6 flex justify-center">
              <Loader2 size={24} className="text-[#BFF367] animate-spin" />
            </div>
          )}
        </div>
      )}

      <CreatePostModal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setEditingPost(null);
        }}
        editingPost={editingPost}
        user={user}
      />

      <AnimatePresence>
        {sharePostId && (
          <ShareModal postId={sharePostId} onClose={() => setSharePostId(null)} />
        )}
        {reportPostId && (
          <ReportModal postId={reportPostId} onClose={() => setReportPostId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityFeed;

