import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pdfsRouter from "./pdfs";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(pdfsRouter);
router.use(adminRouter);

export default router;
