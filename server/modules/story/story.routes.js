import express from 'express';
import { 
  createStory, 
  getStories, 
  deleteStory, 
  viewStory,
  updateStory,
  getAllStoriesAdmin 
} from './story.controller.js';
import userAuth from '../../middleware/jwt/user.middleware.js';
import adminAuth from '../../middleware/jwt/admin.middleware.js';
import upload from '../../middleware/uploads/upload.middleware.js';

const router = express.Router();

router.post('/', userAuth, upload.array('media', 10), createStory);
router.get('/feed', userAuth, getStories);
router.post('/:id/view', userAuth, viewStory);
router.put('/:id', userAuth, upload.single('media'), updateStory);
router.delete('/:id', userAuth, deleteStory);

// Admin routes
router.get('/admin/all', adminAuth, getAllStoriesAdmin);
router.delete('/admin/:id', adminAuth, deleteStory);

export default router;
