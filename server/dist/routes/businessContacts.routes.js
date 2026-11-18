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
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const selfService = __importStar(require("../controllers/businessSelfService.controller"));
const discovery = __importStar(require("../controllers/customerDiscovery.controller"));
const chat = __importStar(require("../controllers/businessChat.controller"));
const areaNotif = __importStar(require("../controllers/areaNotification.controller"));
const router = (0, express_1.Router)();
// ==========================================
// [1] Business Self-Service & Profile Routes
// ==========================================
router.get("/profile/me", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.getSelfProfile));
router.patch("/profile/me", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.updateSelfProfile));
router.patch("/working-hours", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.updateWorkingHours));
// Status Stories with variable duration
router.post("/status", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.postStatus));
router.get("/status/me", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.getMyStatuses));
router.delete("/status/:id", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.deleteStatus));
// Business Verification Workflows
router.post("/verification/request", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.requestVerification));
router.get("/verification/status", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.getVerificationStatus));
// Special Time-Bound Offers
router.post("/offers", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.createSpecialOffer));
router.get("/offers/me", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.getMySpecialOffers));
router.patch("/offers/:id", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.updateSpecialOffer));
router.delete("/offers/:id", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(selfService.deleteSpecialOffer));
// Business broadcast area notification (Strict Privacy - no customer data returned)
router.post("/business/notifications/broadcast", auth_1.requireAuth, (0, auth_1.requireRole)("BUSINESS_OWNER", "ADMIN"), (0, asyncHandler_1.asyncHandler)(areaNotif.broadcastAreaNotification));
// ==========================================
// [2] Customer Discovery, Search & List Order
// ==========================================
router.get("/nearby", (0, asyncHandler_1.asyncHandler)(discovery.getNearbyGroupedBusinesses));
router.get("/search", (0, asyncHandler_1.asyncHandler)(discovery.searchBusinesses));
router.get("/offers/active", (0, asyncHandler_1.asyncHandler)(discovery.getActiveSpecialOffers));
// Custom Drag-and-Drop Saved List Ordering
router.get("/list-order", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.getSavedListOrder));
router.put("/list-order", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.saveListOrder));
// Favorites
router.get("/favorites", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.getFavorites));
router.post("/favorites/:businessId", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.addFavorite));
router.delete("/favorites/:businessId", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.removeFavorite));
// Customer Area Notification Preferences (Opt-in / Opt-out)
router.get("/notifications/preferences", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(areaNotif.getNotificationPreferences));
router.put("/notifications/preferences", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(areaNotif.updateNotificationPreferences));
// System Automatic Expiry Sweeper
router.post("/system/cleanup-expired", (0, asyncHandler_1.asyncHandler)(areaNotif.cleanupExpired));
// ==========================================
// [3] WhatsApp-Style Chat & Masked Calling
// ==========================================
router.get("/chat/conversations", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.getConversations));
router.post("/chat/conversations", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.startOrGetConversation));
router.get("/chat/conversations/:conversationId/messages", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.getMessages));
router.post("/chat/conversations/:conversationId/messages", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.sendMessage));
router.post("/chat/conversations/:conversationId/share-location", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.shareLocation));
// Review reply by business owner
router.post("/reviews/:reviewId/reply", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.replyToReview));
// Public / Authenticated Single Business Details & Interactions
router.get("/:id", (0, asyncHandler_1.asyncHandler)(discovery.getBusinessDetails));
router.get("/:id/share", (0, asyncHandler_1.asyncHandler)(discovery.getSharePayload));
router.get("/:id/quick-replies", (0, asyncHandler_1.asyncHandler)(chat.getCategoryQuickReplies));
router.post("/:id/call", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(chat.initiateMaskedCall));
router.get("/:id/reviews", (0, asyncHandler_1.asyncHandler)(discovery.getBusinessReviews));
router.post("/:id/reviews", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(discovery.addBusinessReview));
exports.default = router;
