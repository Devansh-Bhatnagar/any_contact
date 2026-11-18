import { Router } from "express";
import { searchBusinesses } from "../controllers/search.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/businesses", asyncHandler(searchBusinesses));

export default router;
