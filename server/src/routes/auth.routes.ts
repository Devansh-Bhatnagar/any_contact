import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(auth.register));
router.post("/login", asyncHandler(auth.login));
router.post("/refresh", asyncHandler(auth.refresh));
router.post("/logout", requireAuth, asyncHandler(auth.logout));
router.get("/me", requireAuth, asyncHandler(auth.me));
router.post("/forgot-password", asyncHandler(auth.forgotPassword));
router.post("/reset-password", asyncHandler(auth.resetPassword));

export default router;
