import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, AlertCircle, Hash, Globe, MapPin, Video, Music } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { startUpload } from '@redux/slices/mediaUploadSlice';

const UploadReel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [privacy, setPrivacy] = useState('Public');
  const [locationName, setLocationName] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('File size too large. Max 100MB.');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Dispatch global background upload
    dispatch(startUpload({
      id: `reel-${Date.now()}`,
      file,
      previewUrl: preview,
      metadata: {
        caption,
        hashtags: hashtags.split(' ').filter(t => t.startsWith('#')).map(t => t.slice(1)) || []
      }
    }));

    toast.success('Upload started in background');
    navigate('/reels');
  };

  const clearForm = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setHashtags('');
    setLocationName('');
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const state = data.address?.state || "";
          setLocationName(city && state ? `${city}, ${state}` : city || state || "Unknown");
        } catch {
          toast.error("Failed to fetch location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Location permission denied");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      {/* Dynamic Background Blur (When preview exists) */}
      <AnimatePresence>
        {preview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/80 z-10 backdrop-blur-3xl" />
            <video src={preview} className="w-full h-full object-cover opacity-30 blur-3xl scale-110" muted loop autoPlay />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {!preview && (
        <div className="relative z-10 px-4 md:px-8 h-20 flex items-center gap-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black tracking-tight">Upload Short</h1>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {!preview ? (
          /* Step 1: Upload Zone */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <label className="cursor-pointer group relative flex flex-col items-center justify-center w-full max-w-2xl aspect-[4/3] md:aspect-[21/9] border-2 border-dashed border-white/10 hover:border-[#BFF367]/50 rounded-[24px] bg-white/5 hover:bg-[#BFF367]/5 transition-all overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BFF367]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-[#BFF367]/20 rounded-full text-[#BFF367] mb-6 shadow-[0_0_30px_rgba(191,243,103,0.2)]"
              >
                <Upload size={40} strokeWidth={2} />
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Select video to upload</h3>
              <p className="text-white/50 text-sm md:text-base mb-6">Or drag and drop a file</p>
              
              <div className="flex gap-4 text-xs font-bold text-white/40 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Video size={14} /> MP4 or WebM</span>
                <span className="flex items-center gap-1.5">•</span>
                <span>Up to 100MB</span>
              </div>
              
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </motion.div>
        ) : (
          /* Step 2: Details & Preview */
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col bg-[#0F0F0F] absolute inset-0 z-50"
          >
            {/* Header */}
            <div className="flex items-center gap-6 px-4 py-4">
              <button onClick={clearForm} className="text-white shrink-0 hover:bg-white/10 p-1.5 rounded-full transition-colors -ml-1.5">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-white">Add details</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
              
              {/* Top Section: Thumbnail + Caption */}
              <div className="flex gap-4 p-4 items-start">
                {/* Left: Thumbnail */}
                <div className="w-[84px] aspect-[9/16] shrink-0 relative rounded-[8px] overflow-hidden bg-black border border-white/10">
                  <video src={preview} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline />
                </div>
                {/* Right: Caption Input */}
                <div className="flex-1 h-full min-h-[149px]">
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption your Short"
                    className="w-full h-full min-h-[149px] bg-transparent text-white placeholder:text-gray-400 text-[15px] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/10 my-1" />

              {/* List Items */}
              
              {/* Hashtags Row */}
              <div className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors cursor-text">
                <div className="w-6 shrink-0 flex justify-center">
                  <Hash size={20} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <input 
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="e.g. #sports #kridaz"
                    className="w-full bg-transparent text-white placeholder:text-gray-400 text-[15px] outline-none"
                  />
                </div>
              </div>

              {/* Visibility Row */}
              <div className="relative flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-6 shrink-0 flex justify-center">
                    <Globe size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-gray-400">Visibility</span>
                    <span className="text-[15px] text-white font-medium">{privacy}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 shrink-0" />
                <select 
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>

              {/* Location Row */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group" onClick={!locationName ? fetchLocation : undefined}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-6 shrink-0 flex justify-center">
                    <MapPin size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] text-gray-400">Location</span>
                    <span className="text-[15px] text-white font-medium truncate">
                      {locationName ? locationName : (isLocating ? 'Locating...' : 'Add location')}
                    </span>
                  </div>
                </div>
                {locationName ? (
                   <button 
                     onClick={(e) => { e.stopPropagation(); setLocationName(''); }} 
                     className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                   >
                     <X size={18} />
                   </button>
                ) : (
                  <ChevronRight size={20} className="text-gray-400 shrink-0" />
                )}
              </div>

            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0F0F0F] border-t border-white/5">
              <button 
                onClick={handleUpload}
                disabled={!file || isPreparing}
                className="w-full py-3.5 bg-[#BFF367] text-black font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a6d855] transition-colors text-[15px]"
              >
                {isPreparing ? 'Preparing...' : 'Upload Short'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadReel;
