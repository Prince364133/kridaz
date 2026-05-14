import React, { useState } from 'react';
import { ChevronLeft, Upload, X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@hooks/useAxiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

const UploadReel = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, finalizing, success

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

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('caption', caption);
    formData.append('hashtags', hashtags);

    try {
      await axiosInstance.post('/api/reels/upload', formData, {
        timeout: 0, // Disable timeout for large uploads
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          if (progress === 100) {
            setUploadStatus('finalizing');
          }
        }
      });

      setUploadStatus('success');
      toast.success('Reel uploaded! Optimization starting in background.');
      
      // Short delay to show success state before redirect
      setTimeout(() => {
        navigate('/reels');
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadStatus('idle');
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
    }
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
        <div className="relative aspect-[9/16] w-full max-w-sm mx-auto bg-white/5 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden group">
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
              <div className="p-4 bg-[#84CC16]/20 rounded-full text-[#84CC16]">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-[#84CC16] transition-colors resize-none h-24"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-400 mb-1 block">Hashtags</label>
            <input 
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#sports #kridaz #goals"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-[#84CC16] transition-colors"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-blue-400 shrink-0" />
            <p className="text-xs text-blue-100 leading-relaxed">
              Your video will be automatically optimized for mobile streaming. This might take a few minutes.
            </p>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-4 bg-[#84CC16] text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#74b314] transition-colors mt-4"
          >
            Share Reel
          </button>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-full max-w-xs">
              {uploadStatus === 'success' ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 bg-[#84CC16] rounded-full flex items-center justify-center text-black">
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#84CC16]">Upload Complete!</h2>
                  <p className="text-gray-400">Taking you to the feed...</p>
                </motion.div>
              ) : (
                <>
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    {/* Radial Progress */}
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="364.4"
                        initial={{ strokeDashoffset: 364.4 }}
                        animate={{ strokeDashoffset: 364.4 - (364.4 * uploadProgress) / 100 }}
                        className="text-[#84CC16]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold">{uploadProgress}%</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold mb-2">
                    {uploadStatus === 'uploading' ? 'Uploading Reel...' : 'Finalizing...'}
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    {uploadStatus === 'uploading' 
                      ? 'Please don\'t close the app or refresh the page.' 
                      : 'We\'re preparing your video for background processing.'}
                  </p>

                  {/* Linear Progress Bar as backup visual */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-[#84CC16]"
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadReel;
