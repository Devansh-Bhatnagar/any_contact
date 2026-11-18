import { Router } from "express";
import * as notifications from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(notifications.list));
router.patch("/read-all", asyncHandler(notifications.markAllRead));
router.patch("/:id/read", asyncHandler(notifications.markRead));

export default router;
