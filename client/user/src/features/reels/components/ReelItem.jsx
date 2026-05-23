import React, { useState } from 'react';
import ReelPlayer from './ReelPlayer';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Music } from 'lucide-react';
import { useInteractWithReelMutation, useDeleteReelMutation, useAddCommentMutation } from '@redux/api/reelsApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const ReelItem = ({ reel, isVisible }) => {
  const { user } = useSelector((state) => state.auth);
  const [interact] = useInteractWithReelMutation();
  const [deleteReel] = useDeleteReelMutation();
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addComment] = useAddCommentMutation();

  const isCreator = user?.id === (reel.creatorId?.id || reel.creatorId?._id) || user?.id === reel.creatorId;

  const handleLike = () => {
    setIsLiked(!isLiked);
    interact({ reelId: reel.id || reel._id, type: 'like' });
    if (!isLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Kridaz Shorts',
      text: reel.caption,
      url: `${window.location.origin}/shorts/${reel.id || reel._id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
      interact({ reelId: reel.id || reel._id, type: 'share' });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this short?')) {
      try {
        await deleteReel(reel.id || reel._id).unwrap();
        toast.success('Short deleted');
      } catch (err) {
        toast.error('Failed to delete short');
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addComment({ reelId: reel.id || reel._id, text: commentText }).unwrap();
      setCommentText('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  // If we have a playable URL, just play it. Otherwise, show processing.
  const isProcessing = (reel.status === 'pending' || reel.status === 'processing') && !reel.temp && !reel.hlsUrl && !reel.rawVideoUrl && !reel.mediaUrl;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      <div className="h-full w-full" onDoubleClick={!isProcessing ? handleDoubleTap : undefined}>
        {isProcessing ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Blurred Placeholder */}
            {reel.thumbnailUrl ? (
              <img 
                src={reel.thumbnailUrl} 
                className="w-full h-full object-cover blur-2xl scale-110 opacity-50"
                alt="Processing..."
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}
            
            {/* Processing Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-[#55DEE8] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#55DEE8] font-bold text-lg">Optimizing Reel...</p>
              <p className="text-white/60 text-sm mt-2">{reel.processingProgress || 0}% Complete</p>
              
              {/* Progress Bar */}
              <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${reel.processingProgress || 0}%` }}
                  className="h-full bg-[#55DEE8]"
                />
              </div>
            </div>
          </div>
        ) : (
          <ReelPlayer 
            reelId={reel.id || reel._id}
            hlsUrl={reel.hlsUrl || reel.rawVideoUrl || reel.mediaUrl} 
            isVisible={isVisible} 
            poster={reel.thumbnailUrl}
          />
        )}
      </div>

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart size={100} fill="#ef4444" className="text-[#ef4444] drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1.5" onClick={handleLike}>
          <button className={`p-2.5 transition-all duration-300 active:scale-150 ${isLiked ? 'text-red-500 scale-110' : 'text-white'}`}>
            <Heart size={40} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </button>
          <span className="text-white text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{reel.stats.likes || 0}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <button 
            className="p-2.5 text-white active:scale-125 transition-all duration-300"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={40} strokeWidth={2.5} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </button>
          <span className="text-white text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{reel.stats.comments || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button className="p-2.5 text-white active:scale-125 transition-all duration-300" onClick={handleShare}>
            <Share2 size={38} strokeWidth={2.5} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-tight">Share</span>
        </div>

        <button className="p-2.5 text-white active:scale-125 transition-all duration-300">
          <Bookmark size={38} strokeWidth={2.5} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
        </button>

        <div className="relative">
          <button 
            className="p-2.5 text-white active:bg-white/20 rounded-full transition-all duration-300"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={32} strokeWidth={2.5} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className="absolute right-0 bottom-0 mb-14 w-48 bg-zinc-950 border border-white/20 rounded-2xl overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                >
                  {isCreator ? (
                    <button 
                      onClick={() => { handleDelete(); setShowMenu(false); }}
                      className="w-full px-5 py-4 text-left text-red-500 hover:bg-red-500/10 font-bold text-sm flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Heart size={16} fill="currentColor" />
                      </div>
                      Delete Reel
                    </button>
                  ) : (
                    <button 
                      onClick={() => { toast.success('Reported'); setShowMenu(false); }}
                      className="w-full px-5 py-4 text-left text-white hover:bg-white/10 font-bold text-sm flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Share2 size={16} />
                      </div>
                      Report
                    </button>
                  )}
                  <div className="h-[1px] bg-white/10 mx-4" />
                  <button className="w-full px-5 py-4 text-left text-white/60 hover:bg-white/10 font-bold text-sm transition-colors">
                    Cancel
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-12 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden shadow-lg">
            <img 
              src={reel.creatorId?.profilePicture || `https://avatar.vercel.sh/${reel.creatorId?.id || reel.creatorId?._id || 'kridaz'}`} 
              alt={reel.creatorId?.username} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-[15px]">@{reel.creatorId?.username || 'kridaz_user'}</h3>
              <span className="text-white/40 text-xs">G��</span>
              <button className="text-white border border-white/40 px-3 py-0.5 rounded-md text-[11px] font-bold hover:bg-white/10 transition-colors">
                Follow
              </button>
            </div>
          </div>
        </div>

        <p className="text-white text-[14px] line-clamp-2 mb-4 leading-snug font-medium pr-10">
          {reel.caption}
          {reel.hashtags?.map(tag => (
            <span key={tag} className="text-white font-bold ml-1">#{tag}</span>
          ))}
        </p>

        <div className="flex items-center gap-2 bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
          <Music size={12} className="text-white animate-spin-slow" />
          <div className="overflow-hidden w-32">
            <p className="text-white text-[11px] font-semibold whitespace-nowrap animate-marquee">
              Original Audio G�� {reel.creatorId?.name || 'Kridaz Audio'}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Overlay */}
      <AnimatePresence>
        {showComments && (
          <>
            <div 
              className="absolute inset-0 bg-black/40 z-40 backdrop-blur-sm" 
              onClick={() => setShowComments(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-zinc-900 rounded-t-[32px] z-50 flex flex-col p-6 shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">Comments</h3>
                <span className="text-white/60 text-sm font-medium">{reel.stats.comments || 0}</span>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
                {/* Simplified comment list - in real app would fetch comments */}
                <div className="flex flex-col gap-6">
                  <div className="text-white/40 text-center py-10">
                    <MessageCircle size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium italic">Join the conversation...</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddComment} className="relative mt-auto">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#55DEE8] transition-colors pr-14"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55DEE8] font-bold text-sm px-3 py-2 disabled:opacity-30 transition-opacity"
                >
                  Post
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelItem;
