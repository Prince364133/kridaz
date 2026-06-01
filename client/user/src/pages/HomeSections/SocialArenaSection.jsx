/* eslint-disable react/prop-types */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Info, Play, Heart, MessageSquare } from "lucide-react";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function SocialArenaSection({ reelsFeed }) {
  const navigate = useNavigate();

  return (
    <section className="pt-4 pb-1 mb-2 w-full overflow-hidden">
      <div className="w-full">
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6 lg:mb-10 border-b border-white/5 pb-4">
          <div className="relative flex items-center gap-2">
            <h2
              className="text-[18px] md:text-[30px] font-black text-white uppercase tracking-tighter leading-none flex items-center gap-2 md:gap-3"
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
          <button
            onClick={() => {}}
            className="flex items-center gap-1 font-semibold text-[10px] md:text-[15px] transition-all hover:text-[#BFF367] text-[#888] whitespace-nowrap"
          >
            View More
          </button>
        </div>

        {/* Reels Section (Horizontal Mock Data) */}
        <div className="mb-2">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {reelsFeed.length === 0 ? (
              <div className="w-full py-12 flex items-center justify-center border border-white/5 bg-white/5 rounded-[12px]">
                <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
                  No reels available
                </p>
              </div>
            ) : (
              reelsFeed.map((reel, idx) => (
                <div
                  key={`reel-${idx}`}
                  className="w-[180px] md:w-[210px] aspect-[9/16] shrink-0 bg-[#0A0A0A] border rounded-[12px] overflow-hidden snap-start group transition-all relative cursor-pointer"
                  style={{ borderColor: BDR }}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/?tab=shots&id=${reel.id || reel._id || ""}`);
                  }}
                >
                  {reel.thumbnailUrl || reel.image ? (
                    <img
                      src={reel.thumbnailUrl || reel.image}
                      alt="Reel thumbnail"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : reel.mediaUrl || reel.rawVideoUrl ? (
                    <video
                      src={reel.mediaUrl || reel.rawVideoUrl}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white/20 transition-transform duration-700 group-hover:scale-110">
                      <Play size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                      <Play size={16} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

