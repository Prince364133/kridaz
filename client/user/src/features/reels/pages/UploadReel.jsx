import React, { useState } from 'react';
import { ChevronLeft, Upload, X, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { startUpload } from '@redux/slices/mediaUploadSlice';
const UploadReel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold">New Reel</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Video Preview / Upload Area */}
        <div className="relative aspect-[9/16] w-full max-w-sm mx-auto bg-white/5 rounded-[8px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden group">
          {preview ? (
            <>
              <video src={preview} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors z-10"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-4 p-12 text-center w-full h-full justify-center">
              <div className="p-4 bg-[#55DEE8]/20 rounded-full text-[#55DEE8]">
                <Upload size={40} />
              </div>
              <div>
                <p className="font-bold text-lg">Select vertical video</p>
                <p className="text-sm text-gray-400 mt-1">MP4 or WebM (Max 100MB)</p>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
          <div>
            <label className="text-sm font-semibold text-gray-400 mb-1 block">Caption</label>
            <textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a catchy caption..."
              className="w-full bg-white/5 border border-white/10 rounded-[8px] p-4 focus:outline-none focus:border-[#55DEE8] transition-colors resize-none h-24"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-400 mb-1 block">Hashtags</label>
            <input 
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#sports #kridaz #goals"
              className="w-full bg-white/5 border border-white/10 rounded-[8px] p-4 focus:outline-none focus:border-[#55DEE8] transition-colors"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-[8px] p-4 flex gap-3">
            <AlertCircle size={20} className="text-blue-400 shrink-0" />
            <p className="text-xs text-blue-100 leading-relaxed">
              Your video will be automatically optimized for mobile streaming. This might take a few minutes.
            </p>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isPreparing}
            className="w-full py-4 bg-[#55DEE8] text-black font-bold rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#74b314] transition-colors mt-4"
          >
            {isPreparing ? 'Preparing...' : 'Share Reel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadReel;
