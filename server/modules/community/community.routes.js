import express from 'express';
import { 
  createPost, 
  getPosts, 
  updatePost, 
  deletePost,
  likePost,
  addComment,
  updateComment,
  deleteComment,
  getMyActivity,
  getUserPosts,
  getUserStories
} from './community.controller.js';
import adminAuth from '../../middleware/jwt/admin.middleware.js';
import userAuth from '../../middleware/jwt/user.middleware.js';
import upload from '../../middleware/uploads/upload.middleware.js';

const router = express.Router();

// Public/User route
router.get('/', getPosts);
router.get('/my-activity', userAuth, getMyActivity);
router.get('/user-posts/:userId?', getUserPosts);
router.get('/user-stories/:userId?', getUserStories);
router.post('/:id/like', userAuth, likePost);
router.post('/:id/comment', userAuth, addComment);
router.put('/:id/comment/:commentId', userAuth, updateComment);
router.delete('/:id/comment/:commentId', userAuth, deleteComment);

// User/Admin routes (Admin can do everything, user can manage their own)
router.post('/', userAuth, upload.single('image'), createPost);
router.put('/:id', userAuth, upload.single('image'), updatePost);
router.delete('/:id', userAuth, deletePost);

export default router;
