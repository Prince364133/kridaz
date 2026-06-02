/* eslint-disable react/prop-types */
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Play, Heart, MessageSquare, Edit3, Plus, Camera, Image, Film } from "lucide-react";
import { useSelector } from "react-redux";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { motion, AnimatePresence } from "framer-motion";
import CreatePostModal from "../../features/networking/components/CreatePostModal";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function SocialArenaSection({ reelsFeed }) {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();

  const [showPostModal, setShowPostModal] = useState(false);
  const [showDesktopInlinePost, setShowDesktopInlinePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  return (
    <section className="mb-8 w-full overflow-hidden">
      <div className="w-full">
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6 lg:mb-8">
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

        {/* Create Post unified trigger / input mock */}
        {isLoggedIn && (
          <div className="mb-6">
            <AnimatePresence mode="wait">
              {!showDesktopInlinePost ? (
                <motion.div
                  key="trigger"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0A0A0A] border border-white/5 rounded-[12px] p-3 md:p-4 flex flex-col gap-3 md:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img src={user?.profilePicture || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                    <button
                      onClick={() => gateInteraction(() => {
                        if (window.innerWidth >= 768) setShowDesktopInlinePost(true);
                        else setShowPostModal(true);
                      })}
                      className="flex-1 bg-[#111] hover:bg-[#1A1A1A] rounded-full h-11 px-5 text-left text-[13px] font-bold text-white/40 border border-white/10 transition-all cursor-text"
                    >
                      Start a post
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-around pt-1 md:pt-2 border-t border-white/5">
                    <button 
                      onClick={() => gateInteraction(() => {
                        window.dispatchEvent(new CustomEvent('openCreateStory'));
                      })}
                      className="flex items-center justify-center flex-1 gap-2 text-white/60 hover:text-white hover:bg-white/5 py-2 md:py-2.5 rounded-[8px] transition-colors text-[11px] md:text-[13px] font-bold"
                    >
                      <Camera size={18} className="text-[#3b82f6]" />
                      <span className="hidden md:inline">Story</span>
                    </button>
                    <button 
                      onClick={() => gateInteraction(() => {
                        if (window.innerWidth >= 768) setShowDesktopInlinePost(true);
                        else setShowPostModal(true);
                      })}
                      className="flex items-center justify-center flex-1 gap-2 text-white/60 hover:text-white hover:bg-white/5 py-2 md:py-2.5 rounded-[8px] transition-colors text-[11px] md:text-[13px] font-bold"
                    >
                      <Image size={18} className="text-[#BFF367]" />
                      <span className="hidden md:inline">Post</span>
                    </button>
                    <button 
                      onClick={() => gateInteraction(() => navigate("/reels/upload"))}
                      className="flex items-center justify-center flex-1 gap-2 text-white/60 hover:text-white hover:bg-white/5 py-2 md:py-2.5 rounded-[8px] transition-colors text-[11px] md:text-[13px] font-bold"
                    >
                      <Film size={18} className="text-[#ef4444]" />
                      <span className="hidden md:inline">Reel</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" className="hidden md:block">
                  <CreatePostModal
                    isOpen={true}
                    onClose={() => {
                      setShowDesktopInlinePost(false);
                      setEditingPost(null);
                    }}
                    editingPost={editingPost}
                    user={user}
                    isInline={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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

