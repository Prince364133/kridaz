import express from "express";
import { 
  registerUser, 
  login 
} from "../../modules/auth/auth.controller.js";
import { 
  userRegisterSchema, 
  userLoginSchema 
} from "../../modules/auth/auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.post("/register", validate(userRegisterSchema), registerUser);
router.post("/login", validate(userLoginSchema), login);

export default router;
