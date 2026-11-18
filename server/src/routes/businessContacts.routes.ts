import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

import * as selfService from "../controllers/businessSelfService.controller";
import * as discovery from "../controllers/customerDiscovery.controller";
import * as chat from "../controllers/businessChat.controller";
import * as areaNotif from "../controllers/areaNotification.controller";

const router = Router();

// ==========================================
// [1] Business Self-Service & Profile Routes
// ==========================================
router.get(
  "/profile/me",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.getSelfProfile)
);
router.patch(
  "/profile/me",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.updateSelfProfile)
);
router.patch(
  "/working-hours",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.updateWorkingHours)
);

// Status Stories with variable duration
router.post(
  "/status",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.postStatus)
);
router.get(
  "/status/me",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.getMyStatuses)
);
router.delete(
  "/status/:id",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.deleteStatus)
);

// Business Verification Workflows
router.post(
  "/verification/request",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.requestVerification)
);
router.get(
  "/verification/status",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.getVerificationStatus)
);

// Special Time-Bound Offers
router.post(
  "/offers",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.createSpecialOffer)
);
router.get(
  "/offers/me",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.getMySpecialOffers)
);
router.patch(
  "/offers/:id",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.updateSpecialOffer)
);
router.delete(
  "/offers/:id",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(selfService.deleteSpecialOffer)
);

// Business broadcast area notification (Strict Privacy - no customer data returned)
router.post(
  "/business/notifications/broadcast",
  requireAuth,
  requireRole("BUSINESS_OWNER", "ADMIN"),
  asyncHandler(areaNotif.broadcastAreaNotification)
);

// ==========================================
// [2] Customer Discovery, Search & List Order
// ==========================================
router.get("/nearby", asyncHandler(discovery.getNearbyGroupedBusinesses));
router.get("/search", asyncHandler(discovery.searchBusinesses));
router.get("/offers/active", asyncHandler(discovery.getActiveSpecialOffers));

// Custom Drag-and-Drop Saved List Ordering
router.get("/list-order", requireAuth, asyncHandler(discovery.getSavedListOrder));
router.put("/list-order", requireAuth, asyncHandler(discovery.saveListOrder));

// Favorites
router.get("/favorites", requireAuth, asyncHandler(discovery.getFavorites));
router.post("/favorites/:businessId", requireAuth, asyncHandler(discovery.addFavorite));
router.delete("/favorites/:businessId", requireAuth, asyncHandler(discovery.removeFavorite));

// Customer Area Notification Preferences (Opt-in / Opt-out)
router.get(
  "/notifications/preferences",
  requireAuth,
  asyncHandler(areaNotif.getNotificationPreferences)
);
router.put(
  "/notifications/preferences",
  requireAuth,
  asyncHandler(areaNotif.updateNotificationPreferences)
);

// System Automatic Expiry Sweeper
router.post("/system/cleanup-expired", asyncHandler(areaNotif.cleanupExpired));

// ==========================================
// [3] WhatsApp-Style Chat & Masked Calling
// ==========================================
router.get("/chat/conversations", requireAuth, asyncHandler(chat.getConversations));
router.post("/chat/conversations", requireAuth, asyncHandler(chat.startOrGetConversation));
router.get(
  "/chat/conversations/:conversationId/messages",
  requireAuth,
  asyncHandler(chat.getMessages)
);
router.post(
  "/chat/conversations/:conversationId/messages",
  requireAuth,
  asyncHandler(chat.sendMessage)
);
router.post(
  "/chat/conversations/:conversationId/share-location",
  requireAuth,
  asyncHandler(chat.shareLocation)
);

// Review reply by business owner
router.post("/reviews/:reviewId/reply", requireAuth, asyncHandler(discovery.replyToReview));

// Public / Authenticated Single Business Details & Interactions
router.get("/:id", asyncHandler(discovery.getBusinessDetails));
router.get("/:id/share", asyncHandler(discovery.getSharePayload));
router.get("/:id/quick-replies", asyncHandler(chat.getCategoryQuickReplies));
router.post("/:id/call", requireAuth, asyncHandler(chat.initiateMaskedCall));
router.get("/:id/reviews", asyncHandler(discovery.getBusinessReviews));
router.post("/:id/reviews", requireAuth, asyncHandler(discovery.addBusinessReview));

export default router;

