import { Router } from "express";
import * as promotions from "../controllers/promotions.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Nested under /businesses/:businessId/promotions
const router = Router({ mergeParams: true });

router.post("/", requireAuth, asyncHandler(promotions.create));
router.get("/", asyncHandler(promotions.list));

export default router;
