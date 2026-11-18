"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businesses = __importStar(require("../controllers/businesses.controller"));
const search_controller_1 = require("../controllers/search.controller");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const media_routes_1 = __importDefault(require("./media.routes"));
const socialLinks_routes_1 = __importDefault(require("./socialLinks.routes"));
const services_routes_1 = __importDefault(require("./services.routes"));
const products_routes_1 = __importDefault(require("./products.routes"));
const promotions_routes_1 = __importDefault(require("./promotions.routes"));
const router = (0, express_1.Router)();
router.get("/", (0, asyncHandler_1.asyncHandler)(search_controller_1.searchBusinesses));
router.post("/", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER"), (0, asyncHandler_1.asyncHandler)(businesses.create));
router.get("/me", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER"), (0, asyncHandler_1.asyncHandler)(businesses.getMine));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(businesses.getPublic));
router.patch("/:id", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(businesses.update));
router.post("/:id/submit", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(businesses.submit));
router.delete("/:id", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(businesses.remove));
router.use("/:businessId/media", media_routes_1.default);
router.use("/:businessId/social-links", socialLinks_routes_1.default);
router.use("/:businessId/services", services_routes_1.default);
router.use("/:businessId/products", products_routes_1.default);
router.use("/:businessId/promotions", promotions_routes_1.default);
exports.default = router;
