import express from 'express';
import verifyAuth from '../../middleware/jwt/auth.middleware.js';
import * as controller from './facebook.controller.js';

const router = express.Router();

// OAuth flow
router.get('/oauth/start', verifyAuth, controller.startOAuth);
router.get('/oauth/callback', controller.handleCallback);

// Account management
router.get('/accounts', verifyAuth, controller.getAccounts);
router.post('/save-page', verifyAuth, controller.savePage);
router.delete('/account/:accountId', verifyAuth, controller.removeAccount);

export default router;
