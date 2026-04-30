import { Router } from "express";
import authRouter from "./auth.routes.js"
import turfRouter from "./turf.routes.js"
import bookingRouter from "./booking.routes.js"
import reviewRouter from "./review.routes.js"
import { getPublicPlayers } from "../../modules/player/player.controller.js"
import blogRouter from "./blog.routes.js"

const userRouter = Router();

userRouter.use("/auth", authRouter);
userRouter.use("/turf", turfRouter);
userRouter.use("/booking", bookingRouter);
userRouter.use("/review", reviewRouter);
userRouter.use("/blogs", blogRouter);

// Public — no auth required, safe public fields only
userRouter.get("/players", getPublicPlayers);

export default userRouter;