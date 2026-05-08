import { Router } from "express";
import userRouter from "./user/user.routes.js";
import ownerRouter from "./owner/owner.routes.js";
import adminRouter from "./admin/admin.routes.js";
import featureRouter from "./feature.routes.js";
import hostedGameRouter from "../modules/hostedGame/hostedGame.routes.js";
import professionalRouter from "../modules/professional/professional.routes.js";
import chatRouter from "../modules/chat/chat.routes.js";

const rootRouter = Router();

rootRouter.use("/features", featureRouter);
rootRouter.use("/user", userRouter);
rootRouter.use("/owner", ownerRouter);
rootRouter.use("/admin", adminRouter);
rootRouter.use("/hosted-game", hostedGameRouter);
rootRouter.use("/professional", professionalRouter);
rootRouter.use("/chat", chatRouter);

export default rootRouter;
