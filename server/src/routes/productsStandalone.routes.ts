import { Router } from "express";
import * as products from "../controllers/products.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Mounted at /products — operates on a single product by id
const router = Router();

router.patch("/:productId", requireAuth, asyncHandler(products.update));
router.delete("/:productId", requireAuth, asyncHandler(products.remove));

export default router;
