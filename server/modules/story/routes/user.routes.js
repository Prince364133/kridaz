import express from 'express';
import { 
  createStory, 
  getStories, 
  deleteStory, 
  viewStory,
  updateStory,
  getUploadUrl,
  confirmStory
} from '../story.controller.js';
import userAuth from '../../../middleware/jwt/user.middleware.js';
import upload from '../../../middleware/uploads/upload.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Story
 *   description: User Stories and Short-lived Media
 */

router.use(userAuth);

/**
 * @swagger
 * /story/upload-url:
 *   get:
 *     summary: Get pre-signed upload URL for story
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.get('/upload-url', getUploadUrl);

/**
 * @swagger
 * /story/confirm-upload:
 *   post:
 *     summary: Confirm story after upload
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.post('/confirm-upload', confirmStory);

/**
 * @swagger
 * /story:
 *   post:
 *     summary: Create a story (direct upload)
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', createStory);

/**
 * @swagger
 * /story/feed:
 *   get:
 *     summary: Get story feed
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.get('/feed', getStories);

/**
 * @swagger
 * /story/{id}/view:
 *   post:
 *     summary: Record story view
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/view', viewStory);

/**
 * @swagger
 * /story/{id}:
 *   put:
 *     summary: Update story metadata
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete a story
 *     tags: [Story]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', upload.single('media'), updateStory);
router.delete('/:id', deleteStory);

export default router;
