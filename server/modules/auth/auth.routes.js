import express from "express";
import { 
  registerUser, 
  registerOwner, 
  login, 
  logout,
  ownerRequest,
  checkUsername
} from "./auth.controller.js";
import { 
  userRegisterSchema, 
  userLoginSchema,
  ownerRegisterSchema,
  ownerRequestSchema
} from "./auth.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.post("/user/register", validate(userRegisterSchema), registerUser);
router.post("/owner/register", validate(ownerRegisterSchema), registerOwner);
router.post("/login", validate(userLoginSchema), login);
router.post("/logout", logout);
router.post("/owner/request", validate(ownerRequestSchema), ownerRequest);
router.get("/check-username", checkUsername);

export default router;
