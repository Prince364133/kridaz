import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeUpload: null, // { id, progress, status, previewUrl, metadata, type: 'REEL' | 'POST' | 'STORY' }
  recentUploads: [],
};

const mediaUploadSlice = createSlice({
  name: 'mediaUpload',
  initialState,
  reducers: {
    startUpload: (state, action) => {
      state.activeUpload = {
        id: action.payload.id || Date.now().toString(),
        progress: 0,
        status: 'uploading',
        previewUrl: action.payload.previewUrl,
        metadata: action.payload.metadata,
        file: action.payload.file,
        type: action.payload.type || 'REEL', // Default to REEL for backward compatibility
      };
    },
    updateProgress: (state, action) => {
      if (state.activeUpload) {
        state.activeUpload.progress = action.payload;
      }
    },
    updateStatus: (state, action) => {
      if (state.activeUpload) {
        state.activeUpload.status = action.payload;
      }
    },
    clearUpload: (state) => {
      if (state.activeUpload && state.activeUpload.status === 'success') {
        state.recentUploads.unshift(state.activeUpload);
      }
      state.activeUpload = null;
    },
    setUploadError: (state, action) => {
      if (state.activeUpload) {
        state.activeUpload.status = 'error';
        state.activeUpload.error = action.payload;
      }
    }
  },
});

export const { startUpload, updateProgress, updateStatus, clearUpload, setUploadError } = mediaUploadSlice.actions;
export default mediaUploadSlice.reducer;
