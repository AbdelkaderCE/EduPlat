import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pdfsRouter from "./pdfs";
import adminRouter from "./admin";
import eduRouter from "./edu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(pdfsRouter);
router.use(adminRouter);
router.use(eduRouter);

export default router;
