import { Router } from "express";
import userRouter from "./user/user.routes.js";
import ownerRouter from "./owner/owner.routes.js";
import adminRouter from "./admin/admin.routes.js";
import featureRouter from "./feature.routes.js";

const rootRouter = Router();

rootRouter.use("/features", featureRouter);
rootRouter.use("/user", userRouter);
rootRouter.use("/owner", ownerRouter)
rootRouter.use("/admin", adminRouter)

export default rootRouter;
