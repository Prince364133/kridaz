import { Router } from "express";
import userRouter from "./user/user.routes.js";
import ownerRouter from "./owner/owner.routes.js";
import adminRouter from "./admin/admin.routes.js";
import featureRouter from "./feature.routes.js";
import uploadRouter from "./upload.routes.js";
import hostedGameRouter from "../modules/hostedGame/hostedGame.routes.js";
import professionalRouter from "../modules/professional/professional.routes.js";
import chatRouter from "../modules/chat/chat.routes.js";
import scoringRouter from "../modules/scoring/scoring.routes.js";
import scorerRouter from "../modules/scoring/scorer.routes.js";
import youtubeRouter from "../modules/youtube/youtube.routes.js";
import facebookRouter from "../modules/facebook/facebook.routes.js";

import teamRouter from "../modules/team/team.routes.js";

const rootRouter = Router();

rootRouter.use("/team", teamRouter);
rootRouter.use("/features", featureRouter);
rootRouter.use("/user", userRouter);
rootRouter.use("/owner", ownerRouter);
rootRouter.use("/admin", adminRouter);
rootRouter.use("/upload", uploadRouter);
rootRouter.use("/hosted-game", hostedGameRouter);
rootRouter.use("/professional", professionalRouter);
rootRouter.use("/chat", chatRouter);
rootRouter.use("/scoring", scoringRouter);
rootRouter.use("/scorer", scorerRouter);
rootRouter.use("/youtube", youtubeRouter);
rootRouter.use("/facebook", facebookRouter);

export default rootRouter;
