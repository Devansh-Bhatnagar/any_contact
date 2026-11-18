import { Router } from "express";
import * as businesses from "../controllers/businesses.controller";
import { searchBusinesses } from "../controllers/search.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import mediaRouter from "./media.routes";
import socialLinksRouter from "./socialLinks.routes";
import servicesRouter from "./services.routes";
import productsRouter from "./products.routes";
import promotionsRouter from "./promotions.routes";

const router = Router();

router.get("/", asyncHandler(searchBusinesses));
router.post("/", requireAuth, requireRole("BUSINESS_OWNER"), asyncHandler(businesses.create));
router.get("/me", requireAuth, requireRole("BUSINESS_OWNER"), asyncHandler(businesses.getMine));
router.get("/:id", asyncHandler(businesses.getPublic));
router.patch("/:id", requireAuth, asyncHandler(businesses.update));
router.post("/:id/submit", requireAuth, asyncHandler(businesses.submit));
router.delete("/:id", requireAuth, asyncHandler(businesses.remove));

router.use("/:businessId/media", mediaRouter);
router.use("/:businessId/social-links", socialLinksRouter);
router.use("/:businessId/services", servicesRouter);
router.use("/:businessId/products", productsRouter);
router.use("/:businessId/promotions", promotionsRouter);

export default router;
