import { Router } from "express";
import { getAuthUrl, oauthCallback, createLiveStream } from "./youtube.controller.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";

const router = Router();

router.get("/auth-url", verifyAuth, getAuthUrl);
router.get("/callback", oauthCallback);
router.post("/create-stream", verifyAuth, createLiveStream);

export default router;
