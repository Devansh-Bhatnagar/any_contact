import { Router } from "express";
import * as media from "../controllers/media.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, upload.single("file"), asyncHandler(media.upload));
router.get("/", asyncHandler(media.list));
router.delete("/:mediaId", requireAuth, asyncHandler(media.remove));

export default router;
