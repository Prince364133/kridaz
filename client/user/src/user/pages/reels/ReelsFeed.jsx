import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGetReelsFeedQuery, reelsApi } from '@redux/api/reelsApi';
import ReelItem from '@components/common/ReelItem';
import { ChevronLeft, Camera } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '@context/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';

const ReelsFeed = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { id: initialId } = useParams();
  const [cursor, setCursor] = useState(null);
  const { data, isLoading, isFetching, refetch } = useGetReelsFeedQuery({ cursor, initialId });
  
  // Optimistic UI state
  const { isUploading, activeUpload } = useSelector(state => state.mediaUpload);
  const { user } = useSelector(state => state.auth);

  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef(null);
  const isInitialScrollDone = useRef(false);

  // Combine real reels with optimistic one
  const reels = React.useMemo(() => {
    return data?.reels || [];
  }, [data?.reels]);

  // ── Socket listeners for real-time updates ───────────────────────────────
  // NOTE: Backend uses Prisma UUID `id` field (not Mongo `_id`). All cache
  // lookups MUST use r.id to correctly patch the RTK Query cache.
  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET.REEL_LIKED, ({ reelId, likes }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
          if (!draft?.reels) return;
          const reel = draft.reels.find((r) => r.id === reelId);
          if (reel) reel.stats.likes = likes;
        })
      );
    });

    socket.on(SOCKET.REEL_COMMENTED, ({ reelId }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
          if (!draft?.reels) return;
          const reel = draft.reels.find((r) => r.id === reelId);
          if (reel) reel.stats.comments += 1;
        })
      );
    });

    socket.on(SOCKET.REEL_DELETED, ({ reelId }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
          if (!draft?.reels) return;
          draft.reels = draft.reels.filter((r) => r.id !== reelId);
        })
      );
    });

    socket.on(SOCKET.MEDIA_PROCESSING_PROGRESS, ({ mediaId, mediaType, progress, status }) => {
      if (mediaType !== 'reel') return;
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
          if (!draft?.reels) return;
          // Match on r.id — Prisma returns UUID as `id`, not `_id`
          const reel = draft.reels.find((r) => r.id === mediaId);
          if (reel) {
            reel.status = 'processing';
            reel.processingProgress = progress;
            reel.processingStatus = status;
          }
        })
      );
    });

    socket.on(SOCKET.MEDIA_PROCESSING_COMPLETE, ({ mediaId, mediaType, hlsUrl, thumbnailUrl }) => {
      if (mediaType !== 'reel') return;
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
          if (!draft?.reels) return;
          const reel = draft.reels.find((r) => r.id === mediaId);
          if (reel) {
            reel.status = 'ready';
            reel.hlsUrl = hlsUrl;
            reel.thumbnailUrl = thumbnailUrl;
            reel.processingProgress = 100;
          }
        })
      );
    });

    return () => {
      socket.off(SOCKET.REEL_LIKED);
      socket.off(SOCKET.REEL_COMMENTED);
      socket.off(SOCKET.REEL_DELETED);
      socket.off(SOCKET.MEDIA_PROCESSING_PROGRESS);
      socket.off(SOCKET.MEDIA_PROCESSING_COMPLETE);
    };
  }, [socket, dispatch, cursor, initialId]);

  // ── Polling fallback for pending/processing reels ─────────────────────────
  // If the socket is disconnected OR drops events, pending reels would be stuck
  // forever. Poll every 8 s while any reel is still being processed.
  useEffect(() => {
    const hasPendingReels = reels.some(
      (r) => r.status === 'pending' || r.status === 'processing'
    );

    // Always poll when pending reels exist and socket is down.
    // Also poll when socket is up but as a safety net (stops once all ready).
    if (!hasPendingReels) return;

    // Always poll as a safety net — socket events can be missed if the
    // emitter room name mismatches, or if the user reconnects mid-processing.
    const interval = setInterval(() => {
      refetch();
    }, 6000);

    return () => clearInterval(interval);
  }, [reels, refetch]);

  // IntersectionObserver for active reel tracking
  useEffect(() => {
    if (!reels || reels.length === 0) return;

    const observerOptions = {
      root: feedRef.current,
      threshold: 0.5, // Reel is active when 50% visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          if (index !== activeIndex) {
            setActiveIndex(index);
            
            // Mask URL (only for non-temp reels)
            const currentReel = reels[index];
            if (currentReel && !currentReel.temp) {
              window.history.replaceState(null, '', `/shorts/${currentReel.id}`);
            }

            // Load more trigger
            if (index >= reels.length - 3 && !isFetching && data?.nextCursor) {
              setCursor(data.nextCursor);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = feedRef.current.querySelectorAll('.reels-item-wrapper');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels, activeIndex, isFetching, data?.nextCursor]);

  // Ensure we are at the top if initialId is provided
  useEffect(() => {
    if (reels.length > 0 && !isInitialScrollDone.current) {
      isInitialScrollDone.current = true;
      if (initialId) {
        setActiveIndex(0);
        window.history.replaceState(null, '', `/shorts/${initialId}`);
      }
    }
  }, [reels, initialId]);

  if (isLoading && !data) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#84CC16] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden z-50 flex justify-center">
      {/* Header Overlay */}
      <div className="absolute top-0 w-full max-w-[500px] p-6 flex items-center justify-between z-30 pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 bg-black/30 rounded-full text-white pointer-events-auto backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-white font-bold text-xl tracking-tight pointer-events-auto drop-shadow-md">Shorts</h2>
        <button 
          onClick={() => navigate('/reels/upload')}
          className="p-2.5 bg-black/30 rounded-full text-white pointer-events-auto backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
        >
          <Camera size={24} />
        </button>
      </div>

      {/* Vertical Feed Container */}
      <div 
        ref={feedRef}
        className="reels-feed-container scrollbar-hide snap-y snap-mandatory overflow-y-auto h-full w-full max-w-[500px]"
      >
        {reels.map((reel, index) => {
          // Preload: render actual component if within 2 items of active
          const isNear = Math.abs(index - activeIndex) <= 2;
          const isActive = index === activeIndex;
          
          return (
            <div 
              key={reel.id} 
              data-index={index}
              className="reels-item-wrapper w-full h-full snap-start snap-always"
            >
              {isNear ? (
                <ReelItem 
                  reel={reel} 
                  isVisible={isActive}
                  isNext={index === activeIndex + 1}
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                   {/* Show thumbnail placeholder for far-away items if available */}
                   {reel.thumbnailUrl && (
                     <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
                   )}
                </div>
              )}
            </div>
          );
        })}
        
        {isFetching && (
          <div className="h-full w-full flex items-center justify-center snap-start">
            <div className="w-8 h-8 border-3 border-[#84CC16] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {reels.length === 0 && !isLoading && (
          <div className="h-full w-full flex flex-col items-center justify-center text-white p-8">
            <p className="text-lg font-semibold mb-2">No reels yet</p>
            <p className="text-gray-400 text-center">Be the first one to post a reel!</p>
            <button 
              onClick={() => navigate('/reels/upload')}
              className="mt-6 px-6 py-2 bg-[#84CC16] text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              Create Short
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Simulated or Integrated) */}
      {/* If kridaz has a global bottom nav, it should be visible here or hidden for immersive mode */}
    </div>
  );
};

export default ReelsFeed;
