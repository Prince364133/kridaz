import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowLeft, X } from "lucide-react";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import { useLazyGetCommunityFeedQuery } from "@redux/api/communityApi";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [triggerSearchPlayers, { data: playersData, isFetching: playersLoading }] = useLazySearchPlayersQuery();
  const [triggerGetFeed, { data: feedData, isFetching: postsLoading }] = useLazyGetCommunityFeedQuery();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      triggerSearchPlayers({ query: debouncedQuery, page: 1, limit: 10 });
      triggerGetFeed({ searchTerm: debouncedQuery, page: 1, limit: 10 });
    }
  }, [debouncedQuery, triggerSearchPlayers, triggerGetFeed]);

  const loadedPlayers = playersData?.players || [];
  const loadedPosts = feedData?.posts || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 px-4 md:px-8 font-inter">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              autoFocus
              placeholder="Search community posts or players..."
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-[8px] py-3 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-[#55DEE8]/50 focus:ring-1 focus:ring-[#55DEE8]/20 transition-all placeholder:text-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {debouncedQuery.trim() !== "" && (
          <div className="space-y-6 animate-fade-in">
            {/* Players Search Results */}
            <div className="flex flex-col gap-3 bg-[#0A0A0A] border border-white/5 rounded-[8px] p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#55DEE8]" style={HEADING_STYLE}>
                  PLAYERS MATCHING "{debouncedQuery}"
                </h3>
                {playersLoading && <Loader2 size={16} className="text-[#55DEE8] animate-spin" />}
              </div>

              {loadedPlayers.length === 0 && !playersLoading ? (
                <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                  No players found
                </div>
              ) : (
                <div
                  className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scroll-smooth"
                  style={{ maxHeight: "240px", minHeight: loadedPlayers.length > 1 ? "180px" : "90px" }}
                >
                  {loadedPlayers.map(player => (
                    <div
                      key={player.id || player._id}
                      onClick={() => navigate(`/profile/${player.id || player._id}`)}
                      className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-[#55DEE8]/30 p-3 rounded-[8px] cursor-pointer transition-all min-w-[220px] max-w-[280px] group shrink-0"
                    >
                      <div className="w-[42px] h-[42px] rounded-full bg-[#111] border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-white group-hover:text-[#55DEE8] transition-colors truncate">
                          {player.name}
                        </div>
                        <div className="text-[11px] font-medium text-white/40 truncate">
                          @{player.username || player.name.toLowerCase().replace(/\s+/g, '')}
                        </div>
                        {(player.city || player.state) && (
                          <div className="text-[9px] font-semibold text-[#55DEE8] mt-0.5 uppercase tracking-wider truncate">
                            {player.city}{player.city && player.state ? ', ' : ''}{player.state}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posts Matching Heading */}
            <div className="pt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#55DEE8]" style={HEADING_STYLE}>
                POSTS MATCHING "{debouncedQuery}"
              </h3>
            </div>

            {/* Posts Results */}
            {postsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="text-[#55DEE8] animate-spin" />
              </div>
            ) : loadedPosts.length === 0 ? (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-16 text-center text-white/30 font-bold uppercase tracking-widest text-sm">
                No posts found
              </div>
            ) : (
              <div className="space-y-6">
                {loadedPosts.map(post => {
                  const authorId = post.adminId?.id || post.adminId?._id || post.author?.id || post.author?._id || post.authorId;
                  const authorName = post.adminId?.name || post.author?.name || "Player";
                  const authorPic = post.adminId?.profilePicture || post.author?.profilePicture || "/default-avatar.png";

                  return (
                    <div key={post._id || post.id} className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <Link to={`/profile/${authorId}`} className="flex items-center gap-3 group">
                          <img
                            src={authorPic}
                            className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#55DEE8]/50 transition-colors"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold text-white transition-colors">{authorName}</span>
                            </div>
                            <div className="text-[11px] font-bold text-white/40 mt-0.5">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>
                      </div>

                      {(post.title || post.content) && (
                        <div className="text-[12px] font-medium leading-relaxed">
                          {post.title && <span className="font-bold mr-2">{post.title}</span>}
                          <span className="text-white/90 whitespace-pre-wrap">{post.content}</span>
                        </div>
                      )}

                      {post.media?.length > 0 && (
                        <div className="rounded-[8px] overflow-hidden">
                          {post.media[0].type === "video" ? (
                            <video src={post.media[0].url} className="w-full object-cover" controls />
                          ) : (
                            <img src={post.media[0].url} className="w-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
