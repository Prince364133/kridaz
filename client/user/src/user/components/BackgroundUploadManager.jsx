import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { 
  updateProgress, 
  updateStatus, 
  setUploadError, 
  clearUpload 
} from '../../redux/slices/mediaUploadSlice';
import { 
  useLazyGetReelUploadUrlQuery, 
  useConfirmReelUploadMutation 
} from '../../redux/api/reelsApi';
import {
  useLazyGetCommunityUploadUrlQuery,
  useConfirmCommunityPostMutation,
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation
} from '../../redux/api/communityApi';
import { uploadFileToR2 } from '../../utils/mediaUpload';
import toast from 'react-hot-toast';

const BackgroundUploadManager = () => {
  const dispatch = useDispatch();
  const { activeUpload } = useSelector(state => state.mediaUpload);
  
  // Reel APIs
  const [getReelUrl] = useLazyGetReelUploadUrlQuery();
  const [confirmReel] = useConfirmReelUploadMutation();
  
  // Community APIs
  const [getPostUrl] = useLazyGetCommunityUploadUrlQuery();
  const [confirmPost] = useConfirmCommunityPostMutation();
  
  // Story APIs
  const [getStoryUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStory] = useConfirmStoryUploadMutation();
  
  const processingId = useRef(null);

  useEffect(() => {
    if (activeUpload && activeUpload.status === 'uploading' && processingId.current !== activeUpload.id) {
      processUpload(activeUpload);
    }
  }, [activeUpload]);

  const processUpload = async (upload) => {
    processingId.current = upload.id;
    
    try {
      let uploadUrl, key, mediaId;

      // 1. Get Pre-signed URL based on type
      if (upload.type === 'REEL') {
        const { data } = await getReelUrl({
          contentType: upload.file.type,
          fileName: upload.file.name
        }).unwrap();
        uploadUrl = data.uploadUrl;
        key = data.key;
        mediaId = data.reelId;
      } 
      else if (upload.type === 'POST') {
        const { data } = await getPostUrl({
          contentType: upload.file.type,
          fileName: upload.file.name
        }).unwrap();
        uploadUrl = data.uploadUrl;
        key = data.key;
        mediaId = data.postId;
      }
      else if (upload.type === 'STORY') {
        const { data } = await getStoryUrl({
          contentType: upload.file.type,
          fileName: upload.file.name
        }).unwrap();
        uploadUrl = data.uploadUrl;
        key = data.key;
        mediaId = data.storyId;
      }

      // 2. Upload Direct to R2
      await uploadFileToR2(uploadUrl, upload.file, (progress) => {
        dispatch(updateProgress(progress));
        if (progress === 100) {
          dispatch(updateStatus('finalizing'));
        }
      });

      // 3. Confirm Upload based on type
      if (upload.type === 'REEL') {
        await confirmReel({
          reelId: mediaId,
          key,
          caption: upload.metadata.caption,
          hashtags: upload.metadata.hashtags
        }).unwrap();
      }
      else if (upload.type === 'POST') {
        await confirmPost({
          postId: mediaId,
          key,
          mediaType: upload.file.type.startsWith('video') ? 'video' : 'image',
          title: upload.metadata.title,
          content: upload.metadata.content
        }).unwrap();
      }
      else if (upload.type === 'STORY') {
        await confirmStory({
          storyId: mediaId,
          key,
          mediaType: upload.file.type.startsWith('video') ? 'video' : 'image',
          content: upload.metadata.content,
          durationDays: upload.metadata.durationDays
        }).unwrap();
      }

      dispatch(updateStatus('success'));
      toast.success(`${upload.type.charAt(0) + upload.type.slice(1).toLowerCase()} uploaded successfully!`);
      
      setTimeout(() => {
        dispatch(clearUpload());
      }, 3000);

    } catch (error) {
      console.error('[BACKGROUND_UPLOAD_FAILED]', error);
      dispatch(setUploadError(error.message || 'Upload failed'));
      toast.error(`${upload.type} upload failed.`);
    } finally {
      processingId.current = null;
    }
  };

  if (!activeUpload) return null;

  const { progress, status, error, type } = activeUpload;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl max-w-md mx-auto pointer-events-auto flex items-center gap-4"
        >
          {/* Preview Thumbnail */}
          <div className="w-12 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 relative">
            {activeUpload.previewUrl ? (
              activeUpload.file.type.startsWith('video') ? (
                <video src={activeUpload.previewUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={activeUpload.previewUrl} className="w-full h-full object-cover" alt="preview" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={20} className="text-gray-500" />
              </div>
            )}
            {status === 'uploading' && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-white" />
               </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white truncate">
                {status === 'uploading' && `Uploading ${type.toLowerCase()}...`}
                {status === 'finalizing' && 'Finalizing...'}
                {status === 'success' && 'Shared Successfully!'}
                {status === 'error' && 'Upload Failed'}
              </p>
              <span className="text-xs font-medium text-gray-400">
                {status === 'uploading' && `${progress}%`}
              </span>
            </div>

            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${status === 'error' ? 'bg-red-500' : 'bg-[#84CC16]'}`}
                initial={{ width: 0 }}
                animate={{ width: `${status === 'error' ? 100 : progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {status !== 'success' && status !== 'error' && (
              <p className="text-[10px] text-yellow-500 mt-2 flex items-center gap-1">
                <AlertTriangle size={10} />
                Do not close the app
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {status === 'uploading' || status === 'finalizing' ? (
              <Loader2 size={24} className="animate-spin text-[#84CC16]" />
            ) : status === 'success' ? (
              <CheckCircle size={24} className="text-[#84CC16]" />
            ) : (
              <button onClick={() => dispatch(clearUpload())}>
                <XCircle size={24} className="text-red-500" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundUploadManager;
