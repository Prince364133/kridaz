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

  // HLS Initialization & Tuning
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Check for HLS support
    const src = finalHlsUrl || hlsUrl;
    if (src && (src.endsWith('.m3u8') || src.includes('.m3u8'))) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: false, // Control manually based on visibility/proximity
          startLevel: 0,        // Start with lowest quality for instant play
          maxBufferLength: 10,   // Small buffer for low memory
          maxMaxBufferLength: 20,
          xhrSetup: (xhr) => {
            xhr.withCredentials = true;
          }
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoaded(true);
          if (isVisible) {
            video.play().catch(() => setIsPlaying(false));
          }
        });

        // Error handling for better stability
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    } else if (src) {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [finalHlsUrl]);

  // Proximity Loading Logic (Preload Next Reel)
  useEffect(() => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      if (hls) hls.startLoad();
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else if (isNext) {
      // PRELOAD NEXT: Load manifest and first few segments
      if (hls) {
        hls.startLoad();
        // We don't play, just buffer
      }
      video.pause();
      setIsPlaying(false);
    } else {
      // FAR AWAY: Stop loading and pause
      video.pause();
      setIsPlaying(false);
      if (hls) hls.stopLoad();
      // Reset to start for clean play next time
      video.currentTime = 0;
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
