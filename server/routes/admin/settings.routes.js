import { Router } from "express";
import { getPayoutSettings, updatePayoutSettings } from "../../modules/admin/settings.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const settingsRouter = Router();

settingsRouter.get("/payout", verifyAdminToken, getPayoutSettings);
settingsRouter.put("/payout", verifyAdminToken, updatePayoutSettings);

export default settingsRouter;
