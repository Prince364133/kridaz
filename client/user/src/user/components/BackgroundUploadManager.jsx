import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
import { uploadFileToR2 } from '../../utils/mediaUpload';
import toast from 'react-hot-toast';

const BackgroundUploadManager = () => {
  const dispatch = useDispatch();
  const { activeUpload } = useSelector(state => state.mediaUpload);
  const [getUploadUrl] = useLazyGetReelUploadUrlQuery();
  const [confirmUpload] = useConfirmReelUploadMutation();
  
  // Track if we are currently processing the active upload to avoid double triggers
  const processingId = useRef(null);

  useEffect(() => {
    if (activeUpload && activeUpload.status === 'uploading' && processingId.current !== activeUpload.id) {
      processUpload(activeUpload);
    }
  }, [activeUpload]);

  const processUpload = async (upload) => {
    processingId.current = upload.id;
    
    try {
      // 1. Get Pre-signed URL
      const { data: uploadData, error: urlError } = await getUploadUrl({
        contentType: upload.file.type,
        fileName: upload.file.name
      });

      if (urlError || !uploadData?.success) {
        throw new Error(urlError?.data?.message || 'Failed to get upload authorization');
      }

      const { uploadUrl, key, reelId } = uploadData;

      // 2. Upload Direct to R2
      await uploadFileToR2(uploadUrl, upload.file, (progress) => {
        dispatch(updateProgress(progress));
        if (progress === 100) {
          dispatch(updateStatus('finalizing'));
        }
      });

      // 3. Confirm Upload with Metadata
      await confirmUpload({
        reelId,
        key,
        caption: upload.metadata.caption,
        hashtags: upload.metadata.hashtags
      }).unwrap();

      dispatch(updateStatus('success'));
      toast.success('Reel uploaded successfully!');
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        dispatch(clearUpload());
      }, 3000);

    } catch (error) {
      console.error('[BACKGROUND_UPLOAD_FAILED]', error);
      dispatch(setUploadError(error.message || 'Upload failed'));
      toast.error('Reel upload failed. Check your connection.');
    } finally {
      processingId.current = null;
    }
  };

  if (!activeUpload) return null;

  const { progress, status, error } = activeUpload;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl max-w-md mx-auto pointer-events-auto flex items-center gap-4"
        >
          {/* Preview Thumbnail (Optimistic) */}
          <div className="w-12 h-16 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
            {activeUpload.previewUrl ? (
              <video src={activeUpload.previewUrl} className="w-full h-full object-cover" muted />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white truncate">
                {status === 'uploading' && 'Uploading Reel...'}
                {status === 'finalizing' && 'Finalizing...'}
                {status === 'success' && 'Shared Successfully!'}
                {status === 'error' && 'Upload Failed'}
              </p>
              <span className="text-xs font-medium text-gray-400">
                {status === 'uploading' && `${progress}%`}
              </span>
            </div>

            {/* Progress Bar */}
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
                Do not close or refresh the app
              </p>
            )}
            
            {status === 'error' && (
              <p className="text-[10px] text-red-500 mt-1 truncate">{error}</p>
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
