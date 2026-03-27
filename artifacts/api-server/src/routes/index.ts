import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import listingsRouter from "./listings.js";
import requestsRouter from "./requests.js";
import conversationsRouter from "./conversations.js";
import reviewsRouter from "./reviews.js";
import notificationsRouter from "./notifications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(listingsRouter);
router.use(requestsRouter);
router.use(conversationsRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);

export default router;
