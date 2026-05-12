import express from "express";
import { 
  registerUser, 
  login,
  sendOtp,
  loginStep1,
  googleAuth,
  upgradeRequest,
  requestUpgrade,
  getMe,
  logout,
  updateProfilePicture,
  updateInterests,
  updateProfile,
  forgotPasswordOtp,
  resetPassword
} from "../../modules/auth/auth.controller.js";
import { 
  userRegisterSchema, 
  userLoginSchema,
  sendOtpSchema,
  loginStep1Schema
} from "../../modules/auth/auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

import userAuth from "../../middleware/jwt/user.middleware.js";
import upload from "../../middleware/uploads/upload.middleware.js";

const router = express.Router();

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/register", validate(userRegisterSchema), registerUser);
router.post("/login-step1", validate(loginStep1Schema), loginStep1);
router.post("/login", validate(userLoginSchema), login);
router.post("/google-auth", googleAuth);
router.post("/upgrade-request", userAuth, upload.array("documents", 10), upgradeRequest);
router.post("/request-upgrade", userAuth, requestUpgrade);
router.get("/getMe", userAuth, getMe);
router.post("/logout", logout);
router.post("/profile-picture", userAuth, upload.single("profilePicture"), updateProfilePicture);
router.post("/update-interests", userAuth, updateInterests);
router.put("/updateProfile", userAuth, updateProfile);
router.post("/forgot-password-otp", forgotPasswordOtp);
router.post("/reset-password", resetPassword);

export default router;
