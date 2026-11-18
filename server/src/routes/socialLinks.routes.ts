import { Router } from "express";
import * as socialLinks from "../controllers/socialLinks.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router({ mergeParams: true });

router.put("/", requireAuth, asyncHandler(socialLinks.upsert));
router.get("/", asyncHandler(socialLinks.list));

export default router;
