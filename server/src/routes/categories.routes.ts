import { Router } from "express";
import * as categories from "../controllers/categories.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(categories.list));
router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(categories.create));
router.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(categories.update));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(categories.remove));

export default router;
