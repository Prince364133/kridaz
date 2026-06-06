import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { gsap } from "gsap";

const PRI = "#BFF367";

export const AdBannerSection = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const bannerDuration = 7000; // Increase slightly for videos to 7 seconds

  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
    }
    return () => stopTimer();
  }, [currentIndex, banners]);

  useEffect(() => {
    // Reset video control states when changing slides
    setIsMuted(true);
    setIsPlaying(true);
  }, [currentIndex]);

  const startTimer = () => {
    stopTimer();
    
    // Reset and animate progress bar
    gsap.set(progressRef.current, { width: "0%" });
    gsap.to(progressRef.current, {
      width: "100%",
      duration: bannerDuration / 1000,
      ease: "none",
      onComplete: nextSlide
    });
  };

  const stopTimer = () => {
    gsap.killTweensOf(progressRef.current);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        stopTimer();
      } else {
        videoRef.current.play();
        startTimer();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const isVideo = !!currentBanner.videoUrl;

  return (
    <section className="relative w-full overflow-hidden bg-black py-1 md:py-2">
      <div className="w-full px-1 md:px-2">
        <div className="relative group aspect-[16/9] rounded-[8px] md:rounded-[8px] overflow-hidden border border-white/10 shadow-2xl">


          {/* Banner Media Container (Horizontal Slides) */}
          <div 
            className="flex h-full w-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, idx) => {
              const isBannerVideo = !!banner.videoUrl;
              const isCurrent = idx === currentIndex;
              return (
                <div key={idx} className="relative w-full h-full shrink-0">
                  {isBannerVideo ? (
                    <video
                      ref={isCurrent ? videoRef : null}
                      src={banner.videoUrl}
                      className="w-full h-full object-cover opacity-90"
                      autoPlay={isCurrent}
                      muted={isMuted}
                      loop
                      playsInline
                    />
                  ) : (
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-transparent" />

                  {/* Content per slide */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-20">
                    <div className="max-w-2xl space-y-3">
                      <h2 className="font-display text-3xl md:text-5xl lg:text-6xl uppercase leading-none text-white tracking-tight">
                        {banner.title}
                      </h2>
                      {banner.description && (
                        <p className="text-white/80 text-xs md:text-sm line-clamp-2 max-w-xl font-medium leading-relaxed">
                          {banner.description}
                        </p>
                      )}
                      {banner.targetUrl && (
                        <a 
                          href={banner.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-[6px] font-bold hover:bg-[#BFF367] hover:scale-105 transition-all text-xs group"
                        >
                          Explore Now <ExternalLink size={12} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Video Control Overlays */}
          {isVideo && (
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white hover:fill-black" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button 
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button 
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-6 right-8 flex gap-2 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all ${ idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40" }`}
                style={idx === currentIndex ? { backgroundColor: PRI } : {}}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
