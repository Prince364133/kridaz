import React, { useState, useEffect } from 'react';
import { X, Trash2, MessageCircle, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const StoryViewer = ({ storyGroup, onClose, onDelete, currentUser, isAdmin }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  useEffect(() => {
    if (!storyGroup) return;
    
    const timer = setTimeout(() => {
      if (currentStoryIndex < storyGroup.stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentStoryIndex, storyGroup, onClose]);

  if (!storyGroup) return null;

  const currentStory = storyGroup.stories[currentStoryIndex];
  const isOwner = currentUser && (storyGroup.user._id === currentUser._id || storyGroup.user === currentUser._id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-lg md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-black">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-md"
        >
          <X size={24} />
        </button>

        {/* Progress Bars */}
        <div className="absolute top-4 left-6 right-6 z-[110] flex gap-1">
          {storyGroup.stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-[#84CC16] transition-all duration-300 ${idx < currentStoryIndex ? 'w-full' : idx === currentStoryIndex ? 'w-full animate-progress' : 'w-0'}`}
                style={{ animationDuration: '5s' }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaUrl ? (
            <img 
              src={currentStory.mediaUrl} 
              alt="" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="p-12 text-center w-full">
              <p className="text-2xl md:text-3xl font-bold leading-relaxed text-white">{currentStory.content}</p>
            </div>
          )}

          {/* Caption Overlay */}
          {currentStory.mediaUrl && currentStory.content && (
            <div className="absolute bottom-24 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-sm font-medium text-center text-white/90 leading-relaxed">{currentStory.content}</p>
            </div>
          )}

          {/* Navigation Overlay */}
          <div className="absolute inset-0 flex">
            <div 
              className="w-1/3 h-full cursor-pointer pointer-events-auto" 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1));
              }}
            />
            <div className="w-1/3 h-full" />
            <div 
              className="w-1/3 h-full cursor-pointer pointer-events-auto" 
              onClick={(e) => {
                e.stopPropagation();
                if (currentStoryIndex < storyGroup.stories.length - 1) {
                  setCurrentStoryIndex(currentStoryIndex + 1);
                } else {
                  onClose();
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex items-center gap-4 z-[110]">
          <Link 
            to={`/profile/${storyGroup.user._id}`} 
            className="w-10 h-10 rounded-full border-2 border-[#84CC16] overflow-hidden hover:opacity-80 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={storyGroup.user.profilePicture || "/default-avatar.png"} alt="" className="w-full h-full object-cover" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              to={`/profile/${storyGroup.user._id}`} 
              className="hover:opacity-80 transition-opacity inline-block max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-white truncate">{storyGroup.user.name}</p>
              <p className="text-[10px] text-[#84CC16] font-bold uppercase tracking-widest truncate">@{storyGroup.user.username}</p>
            </Link>
          </div>
          {(isAdmin || isOwner) && onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(currentStory._id);
              }}
              className="p-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all shrink-0"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-progress {
          animation-name: progress;
          animation-timing-function: linear;
        }
      `}} />
    </div>
  );
};

export default StoryViewer;
