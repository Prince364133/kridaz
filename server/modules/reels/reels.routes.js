import { Router } from 'express';
import * as reelsController from './reels.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import multer from 'multer';

import fs from 'fs';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'uploads/reels';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reels');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for raw uploads
  }
});

// Public Routes
router.get('/feed', reelsController.getReelsFeed);
router.get('/recommended', reelsController.getRecommendedReels);

// Protected Routes
router.post('/upload', protect, upload.single('video'), reelsController.uploadReel);
router.post('/:reelId/interact', protect, reelsController.interactWithReel);
router.post('/:reelId/comment', protect, reelsController.addComment);
router.post('/:reelId/heartbeat', reelsController.trackWatchTime);
router.get('/analytics', protect, reelsController.getCreatorAnalytics);
router.delete('/:reelId', protect, reelsController.deleteReel);

export default router;
