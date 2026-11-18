import { Router } from "express";
import * as uploads from "../controllers/uploads.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/", requireAuth, upload.single("file"), asyncHandler(uploads.uploadFile));

export default router;
