import express from "express";
import { 
  registerOwner, 
  login,
  loginStep1,
  sendOtp,
  googleAuth,
  ownerRequest,
  getMe 
} from "../../modules/auth/auth.controller.js";
import { 
  ownerRegisterSchema, 
  userLoginSchema,
  sendOtpSchema,
  loginStep1Schema,
  ownerRequestSchema 
} from "../../modules/auth/auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";
import ownerAuth from "../../middleware/jwt/owner.middleware.js";

const router = express.Router();

router.post("/register", validate(ownerRegisterSchema), registerOwner);
router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/login-step1", validate(loginStep1Schema), loginStep1);
router.post("/login", validate(userLoginSchema), login);
router.post("/google-auth", googleAuth);
router.post("/ownerRequest", validate(ownerRequestSchema), ownerRequest);
router.get("/getMe", ownerAuth, getMe);

export default router;
