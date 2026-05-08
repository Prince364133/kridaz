import { Router } from "express";
import authRouter from "./auth.routes.js"
import turfRouter from "./turf.routes.js"
import bookingRouter from "./booking.routes.js"
import reviewRouter from "./review.routes.js"
import blogRouter from "./blog.routes.js"
import playerRouter from "../../modules/player/player.routes.js"
import storyRouter from "../../modules/story/story.routes.js"
import communityRouter from "../../modules/community/community.routes.js"
import walletRouter from "./wallet.routes.js";
import { getPublicPlayers } from "../../modules/player/player.controller.js"

const userRouter = Router();

userRouter.use("/auth", authRouter);
userRouter.use("/turf", turfRouter);
userRouter.use("/booking", bookingRouter);
userRouter.use("/review", reviewRouter);
userRouter.use("/blogs", blogRouter);
// Public — no auth required, safe public fields only
userRouter.get("/players", getPublicPlayers);

userRouter.use("/players", playerRouter);
userRouter.use("/stories", storyRouter);
userRouter.use("/community", communityRouter);
userRouter.use("/wallet", walletRouter);

export default userRouter;