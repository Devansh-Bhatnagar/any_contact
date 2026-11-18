import { Router } from "express";
import * as admin from "../controllers/admin.controller";
import * as adminVerification from "../controllers/adminVerification.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard/stats", asyncHandler(admin.dashboardStats));

router.get("/businesses", asyncHandler(admin.listBusinesses));
router.get("/businesses/:id", asyncHandler(admin.getBusiness));
router.patch("/businesses/:id/approve", asyncHandler(admin.approveBusiness));
router.patch("/businesses/:id/reject", asyncHandler(admin.rejectBusiness));

router.get("/promotions", asyncHandler(admin.listPromotions));
router.patch("/promotions/:id/approve", asyncHandler(admin.approvePromotion));
router.patch("/promotions/:id/reject", asyncHandler(admin.rejectPromotion));

router.get("/users", asyncHandler(admin.listUsers));
router.patch("/users/:id/status", asyncHandler(admin.setUserStatus));

// Business Contacts verification workflows
router.get("/business-contacts/verifications", asyncHandler(adminVerification.listPendingVerifications));
router.patch("/business-contacts/:id/verify", asyncHandler(adminVerification.verifyBusiness));

export default router;
