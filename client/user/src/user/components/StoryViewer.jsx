import React, { useState, useEffect } from 'react';
import { X, Trash2, Eye, Calendar, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const StoryViewer = ({ storyGroup, onClose, onDelete, currentUser, isAdmin, initialIndex = 0 }) => {
 const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
 const [showViewers, setShowViewers] = useState(false);

 useEffect(() => {
 if (!storyGroup || showViewers) return;
 
 const timer = setTimeout(() => {
 if (currentStoryIndex < storyGroup.stories.length - 1) {
 setCurrentStoryIndex(currentStoryIndex + 1);
 } else {
 onClose();
 }
 }, 5000);

 return () => clearTimeout(timer);
 }, [currentStoryIndex, storyGroup, onClose, showViewers]);

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
 className={`h-full bg-[#55DEE8] transition-all duration-300 ${idx < currentStoryIndex ? 'w-full' : idx === currentStoryIndex ? 'w-full animate-progress' : 'w-0'}`}
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
 className="w-10 h-10 rounded-full border-2 border-[#55DEE8] overflow-hidden hover:opacity-80 transition-opacity shrink-0"
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
 <p className="text-[10px] text-[#55DEE8] font-bold uppercase tracking-widest truncate">@{storyGroup.user.username}</p>
 </Link>
 </div>
 <div className="flex flex-col items-end gap-2">
 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end">
 <div className="flex items-center gap-1.5 text-white/40 mb-1">
 <Calendar size={10} />
 <span className="text-[9px] font-bold uppercase tracking-widest">
 {new Date(currentStory.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
 </span>
 </div>
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setShowViewers(true);
 }}
 className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group"
 >
 <Eye size={12} className="text-[#55DEE8]" />
 <span className="text-[10px] font-black text-white group-hover:text-[#55DEE8]">
 {currentStory.viewers?.length || 0} Views
 </span>
 </button>
 </div>

 {(isAdmin || isOwner) && onDelete && (
 <button 
 onClick={(e) => {
 e.stopPropagation();
 onDelete(currentStory._id);
 }}
 className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all shrink-0 border border-red-500/20"
 >
 <Trash2 size={18} />
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Viewers List Overlay */}
 {showViewers && (
 <div 
 className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-xl animate-in slide-in-from-bottom duration-300 flex flex-col"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[#55DEE8]/10 flex items-center justify-center">
 <Eye size={16} className="text-[#55DEE8]" />
 </div>
 <div>
 <h3 className="text-sm font-black uppercase tracking-tighter text-white">Story Insights</h3>
 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{currentStory.viewers?.length || 0} Total Viewers</p>
 </div>
 </div>
 <button 
 onClick={() => setShowViewers(false)}
 className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
 >
 <X size={20} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
 {currentStory.viewers && currentStory.viewers.length > 0 ? (
 <div className="space-y-2">
 {currentStory.viewers.map((viewer) => (
 <Link
 key={viewer._id}
 to={`/profile/${viewer._id}`}
 onClick={() => onClose()}
 className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
 >
 <div className="relative">
 <div className="w-12 h-12 rounded-full border-2 border-[#2D2D2D] group-hover:border-[#55DEE8] overflow-hidden transition-colors">
 <img 
 src={viewer.profilePicture || "/default-avatar.png"} 
 alt="" 
 className="w-full h-full object-cover"
 />
 </div>
 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#111] border border-white/10 rounded-full flex items-center justify-center">
 <UserIcon size={10} className="text-[#55DEE8]" />
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-white truncate group-hover:text-[#55DEE8] transition-colors">{viewer.name}</p>
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">@{viewer.username}</p>
 </div>
 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#55DEE8]/20 transition-all opacity-0 group-hover:opacity-100">
 <Eye size={14} className="text-[#55DEE8]" />
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
 <Eye size={48} className="mb-4 text-gray-600" />
 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">No viewers yet</p>
 </div>
 )}
 </div>
 </div>
 )}
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

