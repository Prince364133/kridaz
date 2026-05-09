import { Router } from "express"
import authRouter from "./auth.routes.js"
import turfRouter from "./turf.routes.js"
import reviewsRouter from "./reviews.routes.js"
import bookingsRouter from "./bookings.routes.js"
import dashboardRouter from "./dashboard.routes.js"
import promotionRouter from "./promotion.routes.js"

const ownerRouter = Router()

ownerRouter.use("/auth",authRouter);
ownerRouter.use("/turf",turfRouter);
ownerRouter.use("/reviews",reviewsRouter);
ownerRouter.use("/bookings",bookingsRouter);
ownerRouter.use("/dashboard", dashboardRouter);
ownerRouter.use("/promotions", promotionRouter);

export default ownerRouter;