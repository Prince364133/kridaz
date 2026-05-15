import express from 'express';
import { 
  searchPlayers, 
  followPlayer, 
  unfollowPlayer, 
  getNetwork,
  getPlayerProfile,
  getNetworkById,
  getNearbyPlayers,
  updateUserLocation
} from './player.controller.js';
import userAuth from "../../middleware/jwt/user.middleware.js";

const router = express.Router();

router.get('/search', searchPlayers);
router.get('/nearby', userAuth, getNearbyPlayers);
router.post('/location', userAuth, updateUserLocation);
router.get('/network', userAuth, getNetwork);
router.get('/:id', getPlayerProfile);

router.use(userAuth); // Protect social/network routes

router.post('/:id/follow', followPlayer);
router.post('/:id/unfollow', unfollowPlayer);
router.get('/:id/network', getNetworkById);

export default router;
