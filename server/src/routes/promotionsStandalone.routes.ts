import { Router } from "express";
import * as promotions from "../controllers/promotions.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Mounted at /promotions — operates on a single promotion by id
const router = Router();

router.get("/:id", asyncHandler(promotions.getOne));
router.patch("/:id", requireAuth, asyncHandler(promotions.update));
router.delete("/:id", requireAuth, asyncHandler(promotions.remove));

export default router;
