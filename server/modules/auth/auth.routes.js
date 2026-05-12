import express from "express";
import { 
  registerUser, 
  registerOwner, 
  login, 
  logout,
  ownerRequest,
  checkUsername,
  getUmpireInviteDetails,
  requestUpgrade
} from "./auth.controller.js";
import { 
  userRegisterSchema, 
  userLoginSchema,
  ownerRegisterSchema,
  ownerRequestSchema
} from "./auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/user/register", validate(userRegisterSchema), registerUser);
router.post("/owner/register", validate(ownerRegisterSchema), registerOwner);
router.post("/login", validate(userLoginSchema), login);
router.post("/logout", logout);
router.post("/owner/request", validate(ownerRequestSchema), ownerRequest);
router.post("/request-upgrade", protect, requestUpgrade);
router.get("/check-username", checkUsername);
router.get("/umpire-invite-details", getUmpireInviteDetails);

export default router;
