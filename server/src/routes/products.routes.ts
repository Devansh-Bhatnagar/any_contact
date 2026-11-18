import { Router } from "express";
import * as products from "../controllers/products.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Nested under /businesses/:businessId/products
const router = Router({ mergeParams: true });

router.post("/", requireAuth, asyncHandler(products.create));
router.get("/", asyncHandler(products.list));

export default router;
