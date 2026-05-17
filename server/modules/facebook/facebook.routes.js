import express from 'express';
import verifyAuth from '../../middleware/jwt/auth.middleware.js';
import * as controller from './facebook.controller.js';

const router = express.Router();

/**
 * @swagger
 * /facebook/oauth/start:
 *   get:
 *     summary: Initialize Facebook OAuth flow
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to Facebook Login
 */
router.get('/oauth/start', verifyAuth, controller.startOAuth);

/**
 * @swagger
 * /facebook/accounts:
 *   get:
 *     summary: List connected Facebook pages/accounts
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of accessible pages
 */
router.get('/accounts', verifyAuth, controller.getAccounts);

/**
 * @swagger
 * /facebook/save-page:
 *   post:
 *     summary: Save specific Facebook page for streaming
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Page connected
 */
router.post('/save-page', verifyAuth, controller.savePage);

/**
 * @swagger
 * /facebook/account/{accountId}:
 *   delete:
 *     summary: Disconnect Facebook account
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account disconnected
 */
router.delete('/account/:accountId', verifyAuth, controller.removeAccount);

router.get('/oauth/callback', controller.handleCallback);

export default router;
