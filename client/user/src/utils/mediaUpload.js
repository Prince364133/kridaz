/**
 * Uploads a file directly to R2 using a pre-signed URL
 * @param {string} uploadUrl - The pre-signed URL from the backend
 * @param {File} file - The file object to upload
 * @param {Function} onProgress - Callback for upload progress (simulated with fetch)
 * @returns {Promise<void>}
 */
export const uploadFileToR2 = async (uploadUrl, file, onProgress) => {
  try {
    // We use native fetch for the direct R2 upload to avoid 
    // global axios interceptors (which add Auth headers that R2 rejects)
    // Note: Native fetch doesn't support progress, but we can simulate it for UX
    // or use XMLHttpRequest if progress is critical.
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[R2_UPLOAD_ERROR_RESPONSE]', errorText);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    // Since fetch doesn't have progress, we trigger 100% on completion
    if (onProgress) onProgress(100);

  } catch (error) {
    console.error('[R2_UPLOAD_ERROR]', error);
    throw new Error('Direct cloud upload failed. Please check your connection and CORS settings.');
  }
};
