import React, { useState, useEffect, useRef } from 'react';
import { useGetReelsFeedQuery, reelsApi } from '@redux/api/reelsApi';
import ReelItem from '@features/reels/components/ReelItem';
import { ChevronLeft, Camera } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '@context/SocketContext';
import { useDispatch } from 'react-redux';

const ReelsFeed = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { id: initialId } = useParams();
  const [cursor, setCursor] = useState(null);
  const { data, isLoading, isFetching } = useGetReelsFeedQuery({ cursor, initialId });
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef(null);
  const isInitialScrollDone = useRef(false);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('reel_liked', ({ reelId, likes }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', { cursor, initialId }, (draft) => {
          const reel = draft.reels.find((r) => r._id === reelId);
          if (reel) {
            reel.stats.likes = likes;
          }
        })
      );
    });

    socket.on('reel_commented', ({ reelId }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', { cursor, initialId }, (draft) => {
          const reel = draft.reels.find((r) => r._id === reelId);
          if (reel) {
            reel.stats.comments += 1;
          }
        })
      );
    });

    socket.on('reel_deleted', ({ reelId }) => {
      dispatch(
        reelsApi.util.updateQueryData('getReelsFeed', { cursor, initialId }, (draft) => {
          draft.reels = draft.reels.filter((r) => r._id !== reelId);
        })
      );
    });

    return () => {
      socket.off('reel_liked');
      socket.off('reel_commented');
      socket.off('reel_deleted');
    };
  }, [socket, dispatch, cursor, initialId]);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const scrollPos = feedRef.current.scrollTop;
    const itemHeight = feedRef.current.clientHeight;
    const index = Math.round(scrollPos / itemHeight);
    
    if (index !== activeIndex) {
      setActiveIndex(index);
      
      // Mask URL like YouTube Shorts
      const currentReel = data?.reels[index];
      if (currentReel) {
        window.history.replaceState(null, '', `/shorts/${currentReel._id}`);
      }
    }

    // Load more when reaching near the end
    if (data?.reels && index >= data.reels.length - 2 && !isFetching && data.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  // Ensure we are at the top if initialId is provided
  useEffect(() => {
    if (data?.reels && !isInitialScrollDone.current) {
      isInitialScrollDone.current = true;
      // If we are on /shorts/:id, the backend already put it at index 0
      // so we just need to ensure URL is correct and active index is 0
      if (initialId) {
        setActiveIndex(0);
        window.history.replaceState(null, '', `/shorts/${initialId}`);
      }
    }
  }, [data, initialId]);

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
        onScroll={handleScroll}
        className="reels-feed-container scrollbar-hide"
      >
        {data?.reels.map((reel, index) => {
          const isNear = Math.abs(index - activeIndex) <= 2;
          
          return (
            <div key={reel._id} className="reels-item">
              {isNear ? (
                <ReelItem 
                  reel={reel} 
                  isVisible={index === activeIndex} 
                />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          );
        })}
        
        {isFetching && (
          <div className="h-full w-full flex items-center justify-center snap-start">
            <div className="w-8 h-8 border-3 border-[#84CC16] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {data?.reels.length === 0 && !isLoading && (
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
