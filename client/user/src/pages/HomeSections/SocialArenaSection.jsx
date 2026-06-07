import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import ReelPlayer from "@features/reels/components/ReelPlayer";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

const SocialArenaReelCard = ({ reel, shouldPlay, navigate }) => {
  const hasVideo = !!(reel.hlsUrl || reel.mediaUrl || reel.rawVideoUrl);
  const videoUrl = reel.hlsUrl || reel.mediaUrl || reel.rawVideoUrl;
  const thumbnailUrl = reel.thumbnailUrl || reel.image;

  return (
    <div
      className="w-[180px] md:w-[210px] aspect-[9/16] shrink-0 bg-[#0A0A0A] border rounded-[12px] overflow-hidden snap-start group transition-all relative cursor-pointer"
      style={{ borderColor: BDR }}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/?tab=shots&id=${reel.id || reel._id || ""}`);
      }}
    >
      {hasVideo ? (
        <div className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 absolute top-0 left-0 z-0`}>
          <ReelPlayer 
            reelId={reel.id || reel._id}
            hlsUrl={videoUrl}
            isVisible={shouldPlay}
            poster={thumbnailUrl}
            hideControls={true}
            alwaysMuted={true}
          />
        </div>
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Reel thumbnail"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 absolute top-0 left-0"
        />
      ) : (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white/20 transition-transform duration-700 group-hover:scale-110 absolute top-0 left-0">
          <Play size={24} />
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none z-10"></div>
      
      {/* Views Pill */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
          <Eye size={16} className="text-white" strokeWidth={2.5} />
          <span className="text-white text-xs font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
              typeof reel.views === 'number' ? reel.views : 
              reel.stats?.views || reel.viewsCount || 0
            ).toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function SocialArenaSection({ reelsFeed }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [visibleIndices, setVisibleIndices] = useState(new Set());

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndices((prev) => {
          const newSet = new Set(prev);
          entries.forEach((entry) => {
            const idx = parseInt(entry.target.getAttribute("data-index"), 10);
            if (!isNaN(idx)) {
              if (entry.isIntersecting) {
                newSet.add(idx);
              } else {
                newSet.delete(idx);
              }
            }
          });
          return newSet;
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5, // Item is considered visible when 50% is in view
      }
    );

    // Observe all children
    const children = containerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      observer.observe(children[i]);
    }

    return () => observer.disconnect();
  }, [reelsFeed.length]); // Re-run if feed length changes

  // Determine which reels should play
  let playingCount = 0;

  return (
    <section className="mb-8 w-full overflow-hidden">
      <div className="w-full">
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="relative flex items-center gap-2">
            <h2
              className="text-[18px] md:text-[25px] font-black text-white tracking-tighter leading-none flex items-center gap-2 md:gap-3"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Your{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Social Arena
              </span>
            </h2>
          </div>
        </div>

        {/* Reels Section (Horizontal Mock Data) */}
        <div className="mb-2">
          <div 
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x relative"
          >
            {reelsFeed.length === 0 ? (
              <div className="w-full py-12 flex items-center justify-center border border-white/5 bg-white/5 rounded-[12px]">
                <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
                  No reels available
                </p>
              </div>
            ) : (
              reelsFeed.map((reel, idx) => {
                const isVisible = visibleIndices.has(idx);
                // Allow playing if visible and under max 3
                let shouldPlay = false;
                const hasVideo = !!(reel.hlsUrl || reel.mediaUrl || reel.rawVideoUrl);
                if (isVisible && hasVideo && playingCount < 3) {
                  shouldPlay = true;
                  playingCount++;
                }

                return (
                  <div key={`reel-${idx}`} data-index={idx} className="shrink-0 snap-start">
                    <SocialArenaReelCard 
                      reel={reel} 
                      shouldPlay={shouldPlay} 
                      navigate={navigate} 
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

