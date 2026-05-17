import express from "express";
import { 
  registerUser, 
  login,
  sendOtp,
  loginStep1,
  googleAuth,
  getMe,
  logout,
  refreshToken,
  updateProfile,
  checkUsername,
  generateRecoveryTokens,
  loginWithRecoveryToken
} from "../auth.controller.js";
import { 
  userRegisterSchema, 
  userLoginSchema,
  sendOtpSchema,
  loginStep1Schema
} from "../auth.validator.js";
import { validate } from "../../../middleware/validate.middleware.js";
import userAuth from "../../../middleware/jwt/user.middleware.js";
import {
  authLimiter,
  otpLimiter,
} from "../../../middleware/rateLimiter.middleware.js";
import { validateTurnstile } from "../../../middleware/turnstile.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and profile management
 */

// ── Public Routes (Registration / Login) ────────────────────────────────────

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 */
router.post("/send-otp", otpLimiter, validateTurnstile, validate(sendOtpSchema), sendOtp);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post("/register", authLimiter, validateTurnstile, validate(userRegisterSchema), registerUser);

/**
 * @swagger
 * /auth/login-step1:
 *   post:
 *     summary: Login Step 1 - Password verification
 *     tags: [Auth]
 */
router.post("/login-step1", otpLimiter, validateTurnstile, validate(loginStep1Schema), loginStep1);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login Step 2 - Complete login
 *     tags: [Auth]
 */
router.post("/login", authLimiter, validateTurnstile, validate(userLoginSchema), login);

/**
 * @swagger
 * /auth/google-auth:
 *   post:
 *     summary: Google OAuth Login/Register
 *     tags: [Auth]
 */
router.post("/google-auth", authLimiter, googleAuth);

/**
 * @swagger
 * /auth/check-username:
 *   get:
 *     summary: Check username availability
 *     tags: [Auth]
 */
router.get("/check-username", checkUsername);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/recovery/login:
 *   post:
 *     summary: Login using a recovery token
 *     tags: [Auth]
 */
router.post("/recovery/login", loginWithRecoveryToken);

// ── Authenticated Routes (Profile / Session) ────────────────────────────────

/**
 * @swagger
 * /auth/getMe:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.get("/getMe", userAuth, getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/updateProfile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.put("/updateProfile", userAuth, updateProfile);

/**
 * @swagger
 * /auth/recovery/generate:
 *   post:
 *     summary: Generate backup recovery tokens
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.post("/recovery/generate", userAuth, generateRecoveryTokens);

export default router;
