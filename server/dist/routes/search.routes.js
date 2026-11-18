"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("../controllers/search.controller");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get("/businesses", (0, asyncHandler_1.asyncHandler)(search_controller_1.searchBusinesses));
exports.default = router;
