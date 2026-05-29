import React, { useState } from 'react';
import { ChevronLeft, Upload, X, AlertCircle, Hash, Globe, MapPin, Video, Music } from 'lucide-react';
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative">
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
      <div className="relative z-10 px-4 md:px-8 h-20 flex items-center gap-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Upload Short</h1>
      </div>

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 p-4 flex flex-col"
          >
            <div className="w-full max-w-4xl mx-auto bg-[#0A0A0A]/80 border border-white/5 rounded-[24px] p-4 md:p-6 shadow-xl backdrop-blur-md flex flex-row gap-4 md:gap-8 flex-1">
              
              {/* Left: Video Thumbnail (Proportional) */}
              <div className="w-[45%] md:w-64 shrink-0 flex flex-col justify-center h-full">
                <div className="relative w-full aspect-[9/16] rounded-[16px] overflow-hidden shadow-2xl border border-white/10 group bg-black">
                  <video src={preview} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                  
                  {/* Remove Button */}
                  <button 
                    onClick={clearForm}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/80 hover:text-white hover:bg-red-500/80 transition-all z-10 backdrop-blur-md"
                    title="Remove video"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Right: Form Details */}
              <div className="flex-1 flex flex-col gap-4">
                
                <h2 className="text-lg md:text-xl font-bold text-white hidden md:block">Short Details</h2>
                
                {/* Caption */}
                <div className="flex-1 min-h-[100px]">
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a catchy caption..."
                    className="w-full h-full bg-black/50 border border-white/10 rounded-[12px] p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#BFF367] focus:ring-1 focus:ring-[#BFF367] transition-all resize-none text-sm md:text-base"
                  />
                </div>

                {/* Hashtags */}
                <div className="relative shrink-0">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BFF367]" />
                  <input 
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="e.g., #sports #kridaz"
                    className="w-full bg-black/50 border border-white/10 rounded-[12px] py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#BFF367] focus:ring-1 focus:ring-[#BFF367] transition-all text-sm md:text-base"
                  />
                </div>
                
                {/* Privacy and Location Row */}
                <div className="flex flex-col xl:flex-row gap-3 shrink-0">
                  <div className="relative shrink-0 xl:w-1/3">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <select 
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="w-full appearance-none bg-black/50 border border-white/10 rounded-[12px] py-3 pl-10 pr-8 text-white focus:outline-none focus:border-[#BFF367] text-sm md:text-base cursor-pointer"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-[12px] px-4 py-3 min-w-0">
                    <MapPin size={16} className="text-white/50 shrink-0 mr-3" />
                    {locationName ? (
                      <div className="flex items-center justify-between w-full min-w-0 gap-2">
                        <span className="text-sm md:text-base text-white truncate">{locationName}</span>
                        <button onClick={() => setLocationName('')} className="shrink-0 text-white/50 hover:text-white">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={fetchLocation} className="text-sm md:text-base text-white/50 hover:text-white truncate text-left w-full">
                        {isLocating ? 'Locating...' : 'Add Location'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-2 shrink-0">
                  <button 
                    onClick={clearForm}
                    className="w-full sm:flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-[12px] transition-colors text-sm md:text-base order-2 sm:order-1"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={!file || isPreparing}
                    className="w-full sm:flex-[2] py-3.5 bg-[#BFF367] text-black font-black uppercase tracking-wider rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a6d855] transition-colors shadow-[0_0_20px_rgba(191,243,103,0.15)] hover:shadow-[0_0_30px_rgba(191,243,103,0.3)] text-sm md:text-base order-1 sm:order-2"
                  >
                    {isPreparing ? 'Preparing...' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadReel;
