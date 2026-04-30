import express from "express";
import { 
  registerOwner, 
  login,
  ownerRequest 
} from "../../modules/auth/auth.controller.js";
import { 
  ownerRegisterSchema, 
  userLoginSchema,
  ownerRequestSchema 
} from "../../modules/auth/auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.post("/register", validate(ownerRegisterSchema), registerOwner);
router.post("/login", validate(userLoginSchema), login);
router.post("/ownerRequest", validate(ownerRequestSchema), ownerRequest);

export default router;
