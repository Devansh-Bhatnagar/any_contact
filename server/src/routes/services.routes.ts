import { Router } from "express";
import * as services from "../controllers/services.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Nested under /businesses/:businessId/services
const router = Router({ mergeParams: true });

router.post("/", requireAuth, asyncHandler(services.create));
router.get("/", asyncHandler(services.list));

export default router;
