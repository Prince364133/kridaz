import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useTrackHeartbeatMutation } from '../../redux/api/reelsApi';
import Hls from 'hls.js';

const ReelPlayer = ({ reelId, hlsUrl, isVisible, isNext, poster }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trackHeartbeat] = useTrackHeartbeatMutation();
  const watchTimeRef = useRef(0);
  
  // CORS Proxy for local development
  const finalHlsUrl = React.useMemo(() => {
    if (!hlsUrl) return hlsUrl;
    const cdnUrl = import.meta.env.VITE_REELS_CDN_URL;
    if (import.meta.env.DEV && cdnUrl && hlsUrl.startsWith(cdnUrl)) {
      return hlsUrl.replace(cdnUrl, '/r2-reels');
    }
    return hlsUrl;
  }, [hlsUrl]);

  // Heartbeat tracking
  useEffect(() => {
    let interval;
    if (isVisible && videoRef.current && isLoaded) {
      interval = setInterval(() => {
        if (!videoRef.current.paused) {
          watchTimeRef.current += 1;
          if (watchTimeRef.current % 5 === 0) {
            trackHeartbeat({ 
              reelId, 
              watchTime: 5, 
              completed: videoRef.current.ended 
            });
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (watchTimeRef.current > 0) {
        trackHeartbeat({ 
          reelId, 
          watchTime: watchTimeRef.current % 5 || 5, 
          completed: videoRef.current?.ended 
        });
      }
      watchTimeRef.current = 0;
    };
  }, [isVisible, reelId, trackHeartbeat, isLoaded]);

  // Unified HLS Lifecycle & Visibility Effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    const src = finalHlsUrl || hlsUrl;
    if (!src) return;

    const isHls = src.endsWith('.m3u8') || src.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: false, 
        startLevel: -1, // Auto
        // Instagram-like aggressive buffering
        maxBufferLength: isVisible ? 30 : 10, 
        maxMaxBufferLength: isVisible ? 60 : 20,
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false; // CDN assets are public
        }
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoaded(true);
        if (isVisible) {
          video.play().catch(e => console.warn('[REEL_PLAYER] Auto-play blocked:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`[REEL_PLAYER] [HLS_ERROR] [${reelId}]:`, data.type, data.details, data.fatal);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('[REEL_PLAYER] Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('[REEL_PLAYER] Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[REEL_PLAYER] Fatal error, destroying instance');
              hls.destroy();
              break;
          }
        }
      });

      // Aggressive Preloading Logic
      if (isVisible) {
        hls.startLoad(); // Load and play
      } else if (isNext) {
        // Pre-fetch manifest AND fragments for the next reel
        hls.startLoad(); 
      }

    } else {
      // Native HLS (Safari) or raw MP4
      video.src = src;
      if (isVisible) {
        video.play().catch(e => console.log('Auto-play blocked'));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [finalHlsUrl, hlsUrl, isVisible, isNext]);

  // Handle Play/Pause based on isVisible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      if (hlsRef.current) {
        hlsRef.current.startLoad();
        // High priority for current video
        hlsRef.current.config.maxBufferLength = 40; 
      }
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
      if (isNext && hlsRef.current) {
        // Medium priority for next video: load enough to play instantly but don't hog bandwidth
        hlsRef.current.startLoad();
        hlsRef.current.config.maxBufferLength = 10;
      } else if (hlsRef.current) {
        hlsRef.current.stopLoad();
      }
      
      if (!isNext) {
        video.currentTime = 0;
      }
    }
  }, [isVisible, isNext]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };


  const toggleMute = (e) => {
    e.stopPropagation();
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center" onClick={togglePlay}>
      <video
        ref={videoRef}
        poster={poster}
        crossOrigin="anonymous"
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        onCanPlay={() => setIsLoaded(true)}
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Indicator Overlay (Mobile Style) */}
      {!isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Play size={64} className="text-white/80" fill="currentColor" />
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button 
        onClick={toggleMute}
        className="absolute bottom-4 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm z-10"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Loading Spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ReelPlayer;
