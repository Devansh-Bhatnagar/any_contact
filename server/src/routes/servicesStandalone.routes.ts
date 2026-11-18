import { Router } from "express";
import * as services from "../controllers/services.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Mounted at /services — operates on a single service by id
const router = Router();

router.patch("/:serviceId", requireAuth, asyncHandler(services.update));
router.delete("/:serviceId", requireAuth, asyncHandler(services.remove));

export default router;
