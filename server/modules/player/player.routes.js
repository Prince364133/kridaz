import express from 'express';
import { 
  searchPlayers, 
  followPlayer, 
  unfollowPlayer, 
  getNetwork,
  getPlayerProfile,
  getNetworkById
} from './player.controller.js';
import userAuth from "../../middleware/jwt/user.middleware.js";

const router = express.Router();

router.use(userAuth); // Protect all player routes

router.get('/search', searchPlayers);
router.post('/:id/follow', followPlayer);
router.post('/:id/unfollow', unfollowPlayer);
router.get('/network', getNetwork);
router.get('/:id/network', getNetworkById);
router.get('/:id', getPlayerProfile);

export default router;
