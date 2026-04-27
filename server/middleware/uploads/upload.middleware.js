import multer from "multer";

// Use memory storage instead of disk storage.
// Render's filesystem is ephemeral and files written to disk
// will be lost on restarts/redeploys. Files are immediately
// streamed to Cloudinary so no disk persistence is needed.
const upload = multer({ storage: multer.memoryStorage() });

export default upload;