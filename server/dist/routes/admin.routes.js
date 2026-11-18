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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin = __importStar(require("../controllers/admin.controller"));
const adminVerification = __importStar(require("../controllers/adminVerification.controller"));
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, (0, auth_1.requireRole)("ADMIN"));
router.get("/dashboard/stats", (0, asyncHandler_1.asyncHandler)(admin.dashboardStats));
router.get("/businesses", (0, asyncHandler_1.asyncHandler)(admin.listBusinesses));
router.get("/businesses/:id", (0, asyncHandler_1.asyncHandler)(admin.getBusiness));
router.patch("/businesses/:id/approve", (0, asyncHandler_1.asyncHandler)(admin.approveBusiness));
router.patch("/businesses/:id/reject", (0, asyncHandler_1.asyncHandler)(admin.rejectBusiness));
router.get("/promotions", (0, asyncHandler_1.asyncHandler)(admin.listPromotions));
router.patch("/promotions/:id/approve", (0, asyncHandler_1.asyncHandler)(admin.approvePromotion));
router.patch("/promotions/:id/reject", (0, asyncHandler_1.asyncHandler)(admin.rejectPromotion));
router.get("/users", (0, asyncHandler_1.asyncHandler)(admin.listUsers));
router.patch("/users/:id/status", (0, asyncHandler_1.asyncHandler)(admin.setUserStatus));
// Business Contacts verification workflows
router.get("/business-contacts/verifications", (0, asyncHandler_1.asyncHandler)(adminVerification.listPendingVerifications));
router.patch("/business-contacts/:id/verify", (0, asyncHandler_1.asyncHandler)(adminVerification.verifyBusiness));
exports.default = router;
