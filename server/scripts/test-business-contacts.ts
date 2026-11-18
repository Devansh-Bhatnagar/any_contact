/**
 * Comprehensive Test Suite for Business Contacts Feature:
 * Validates all 19 requirements and strict customer privacy rules.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:5034";

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function request(
  method: string,
  path: string,
  options: {
    body?: unknown;
    token?: string;
    expectedStatus?: number | number[];
  } = {}
) {
  const { body, token, expectedStatus = 200 } = options;
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const start = Date.now();
  let status = 0;
  let data: any = null;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
  } catch (err: any) {
    status = 500;
    data = { error: err.message };
  }

  const durationMs = Date.now() - start;
  const isExpected = Array.isArray(expectedStatus)
    ? expectedStatus.includes(status)
    : status === expectedStatus;

  return { status, data, durationMs, isExpected };
}

function record(
  name: string,
  method: string,
  endpoint: string,
  passed: boolean,
  durationMs: number,
  details?: string
) {
  results.push({ name, method, endpoint, passed, durationMs, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} [${method.padEnd(6)}] ${endpoint.padEnd(45)} | ${durationMs}ms ${details ? `| ${details}` : ""}`);
}

async function run() {
  console.log(`\n🚀 Testing Business Contacts Suite against: ${BASE_URL}\n`);

  // -------------------------------------------------------------
  // 1. Authenticate Business Owner, Customer, and Admin
  // -------------------------------------------------------------
  console.log("▶ Authenticating User Roles...");
  const bizOwnerLogin = await request("POST", "/api/auth/login", {
    body: { email: "alex.chen@leadsphonebook.com", password: "Password@123" },
  });
  const bizToken = bizOwnerLogin.data?.accessToken;
  record("Login Business Owner", "POST", "/api/auth/login", !!bizToken, bizOwnerLogin.durationMs);

  const customerLogin = await request("POST", "/api/auth/login", {
    body: { email: "priya.customer@leadsphonebook.com", password: "Password@123" },
  });
  const customerToken = customerLogin.data?.accessToken;
  record("Login Customer", "POST", "/api/auth/login", !!customerToken, customerLogin.durationMs);

  const adminLogin = await request("POST", "/api/auth/login", {
    body: { email: "admin@leadsphonebook.com", password: "Password@123" },
  });
  const adminToken = adminLogin.data?.accessToken;
  record("Login Admin", "POST", "/api/auth/login", !!adminToken, adminLogin.durationMs);

  // -------------------------------------------------------------
  // 2. Nearby Category-Wise Business List & Search
  // -------------------------------------------------------------
  console.log("\n▶ Group 1: Nearby List & Search");
  const nearby = await request("GET", "/api/business-contacts/nearby?area=Indiranagar");
  const nearbyPassed = nearby.isExpected && Array.isArray(nearby.data?.categories) && nearby.data?.categories.length > 0;
  record("Nearby Category-Wise List", "GET", "/api/business-contacts/nearby", nearbyPassed, nearby.durationMs, `Categories: ${nearby.data?.categories?.length}`);

  const searchName = await request("GET", "/api/business-contacts/search?q=Plumber");
  record("Search by Name/Keyword", "GET", "/api/business-contacts/search?q=Plumber", searchName.isExpected && searchName.data?.count > 0, searchName.durationMs);

  const searchArea = await request("GET", "/api/business-contacts/search?area=Indiranagar");
  record("Search by Area", "GET", "/api/business-contacts/search?area=Indiranagar", searchArea.isExpected && searchArea.data?.count > 0, searchArea.durationMs);

  const searchPincode = await request("GET", "/api/business-contacts/search?pincode=560038");
  record("Search by Pin Code", "GET", "/api/business-contacts/search?pincode=560038", searchPincode.isExpected && searchPincode.data?.count > 0, searchPincode.durationMs);

  // -------------------------------------------------------------
  // 3. Highlighted Special Offers
  // -------------------------------------------------------------
  console.log("\n▶ Group 2: Special Offers");
  const activeOffers = await request("GET", "/api/business-contacts/offers/active?area=Indiranagar");
  record("Active Highlighted Offers", "GET", "/api/business-contacts/offers/active", activeOffers.isExpected && activeOffers.data?.count > 0, activeOffers.durationMs);

  // -------------------------------------------------------------
  // 4. Custom Drag-and-Drop List Order
  // -------------------------------------------------------------
  console.log("\n▶ Group 3: Saved List Order");
  const sampleBizId = "00000000-0000-0000-0000-000000000001";
  const saveOrder = await request("PUT", "/api/business-contacts/list-order", {
    token: customerToken,
    body: { businessIds: [sampleBizId] },
  });
  record("Save Custom List Order", "PUT", "/api/business-contacts/list-order", saveOrder.isExpected, saveOrder.durationMs);

  const getOrder = await request("GET", "/api/business-contacts/list-order", { token: customerToken });
  record("Get Saved List Order", "GET", "/api/business-contacts/list-order", getOrder.isExpected && getOrder.data?.length > 0, getOrder.durationMs);

  // -------------------------------------------------------------
  // 5. Customer Favorites
  // -------------------------------------------------------------
  console.log("\n▶ Group 4: Favorites");
  const addFav = await request("POST", `/api/business-contacts/favorites/${sampleBizId}`, {
    token: customerToken,
    expectedStatus: [200, 201],
  });
  record("Add Favorite", "POST", `/api/business-contacts/favorites/:id`, addFav.isExpected, addFav.durationMs);

  const getFavs = await request("GET", "/api/business-contacts/favorites", { token: customerToken });
  record("List Favorites", "GET", "/api/business-contacts/favorites", getFavs.isExpected && getFavs.data?.count > 0, getFavs.durationMs);

  const delFav = await request("DELETE", `/api/business-contacts/favorites/${sampleBizId}`, {
    token: customerToken,
    expectedStatus: 204,
  });
  record("Remove Favorite", "DELETE", `/api/business-contacts/favorites/:id`, delFav.isExpected, delFav.durationMs);

  // -------------------------------------------------------------
  // 6. Ratings, Reviews, and Business Reply
  // -------------------------------------------------------------
  console.log("\n▶ Group 5: Ratings & Reviews");
  const postReview = await request("POST", `/api/business-contacts/${sampleBizId}/reviews`, {
    token: customerToken,
    body: { rating: 5, comment: "Top quality cloud support! Highly recommended." },
    expectedStatus: 201,
  });
  const reviewId = postReview.data?.id;
  // Privacy check on review: customer phone must not be exposed
  const reviewPrivacyPassed = postReview.isExpected && !postReview.data?.customerPhone && postReview.data?.customerName?.startsWith("Customer");
  record("Add Customer Review (Privacy Check)", "POST", `/api/business-contacts/:id/reviews`, reviewPrivacyPassed, postReview.durationMs);

  const getReviews = await request("GET", `/api/business-contacts/${sampleBizId}/reviews`);
  record("Get Business Reviews", "GET", `/api/business-contacts/:id/reviews`, getReviews.isExpected && getReviews.data?.reviewCount > 0, getReviews.durationMs);

  if (reviewId) {
    const replyReview = await request("POST", `/api/business-contacts/reviews/${reviewId}/reply`, {
      token: bizToken,
      body: { reply: "Thank you for your feedback! We are thrilled to partner with you." },
    });
    record("Business Reply to Review", "POST", `/api/business-contacts/reviews/:reviewId/reply`, replyReview.isExpected, replyReview.durationMs);
  }

  // -------------------------------------------------------------
  // 7. Business Self-Service Profile, Working Hours & Status Duration
  // -------------------------------------------------------------
  console.log("\n▶ Group 6: Business Self-Service & Status Duration");
  const getProfile = await request("GET", "/api/business-contacts/profile/me", { token: bizToken });
  record("Get Self-Service Profile", "GET", "/api/business-contacts/profile/me", getProfile.isExpected && !!getProfile.data?.openStatus, getProfile.durationMs);

  const updateProfile = await request("PATCH", "/api/business-contacts/profile/me", {
    token: bizToken,
    body: {
      statusLine: "Specialists in enterprise DevOps & 24/7 cloud reliability",
      googleMapsUrl: "https://maps.google.com/?q=12.9784,77.6408",
      manualStatus: "OPEN",
    },
  });
  record("Update Self-Service Profile", "PATCH", "/api/business-contacts/profile/me", updateProfile.isExpected, updateProfile.durationMs);

  const updateHours = await request("PATCH", "/api/business-contacts/working-hours", {
    token: bizToken,
    body: {
      manualStatus: "OPEN",
      workingHours: {
        monday: { open: "08:00", close: "20:00", isClosed: false },
        tuesday: { open: "08:00", close: "20:00", isClosed: false },
      },
    },
  });
  record("Update Working Hours & Live Open Status", "PATCH", "/api/business-contacts/working-hours", updateHours.isExpected && updateHours.data?.openStatus?.isOpen === true, updateHours.durationMs);

  // Post Status with variable duration (1_WEEK)
  const postStatus = await request("POST", "/api/business-contacts/status", {
    token: bizToken,
    body: {
      title: "🚀 Special Flash Sprint: 2-Day Architecture Review",
      description: "Book an express technical review before Friday.",
      duration: "1_WEEK",
      offerBadge: "LIMITED SLOTS",
    },
    expectedStatus: 201,
  });
  const statusId = postStatus.data?.id;
  // Verify duration calculation: expiresAt should be roughly 7 days ahead
  const expiresAt = postStatus.data?.expiresAt ? new Date(postStatus.data.expiresAt) : null;
  const isOneWeekAhead = expiresAt ? expiresAt.getTime() > Date.now() + 6 * 24 * 3600 * 1000 : false;
  record("Post Status with Variable Duration (1_WEEK)", "POST", "/api/business-contacts/status", postStatus.isExpected && isOneWeekAhead, postStatus.durationMs);

  const getMyStatuses = await request("GET", "/api/business-contacts/status/me", { token: bizToken });
  record("Get My Active & Past Statuses", "GET", "/api/business-contacts/status/me", getMyStatuses.isExpected && getMyStatuses.data?.active?.length > 0, getMyStatuses.durationMs);

  if (statusId) {
    const delStatus = await request("DELETE", `/api/business-contacts/status/${statusId}`, {
      token: bizToken,
      expectedStatus: 204,
    });
    record("Delete / Deactivate Status", "DELETE", `/api/business-contacts/status/:id`, delStatus.isExpected, delStatus.durationMs);
  }

  // -------------------------------------------------------------
  // 8. Business Verification Workflow
  // -------------------------------------------------------------
  console.log("\n▶ Group 7: Business Verification Pipeline");
  const reqVerif = await request("POST", "/api/business-contacts/verification/request", {
    token: bizToken,
    body: { notes: "Incorporation documents and registered GST certificate uploaded." },
  });
  record("Request Business Verification", "POST", "/api/business-contacts/verification/request", reqVerif.isExpected, reqVerif.durationMs);

  const checkVerifStatus = await request("GET", "/api/business-contacts/verification/status", { token: bizToken });
  record("Check Verification Status", "GET", "/api/business-contacts/verification/status", checkVerifStatus.isExpected && checkVerifStatus.data?.verificationRequested === true, checkVerifStatus.durationMs);

  // Admin lists and approves verification
  const adminListVerif = await request("GET", "/api/admin/business-contacts/verifications", { token: adminToken });
  record("Admin List Verification Requests", "GET", "/api/admin/business-contacts/verifications", adminListVerif.isExpected && adminListVerif.data?.count > 0, adminListVerif.durationMs);

  const adminApproveVerif = await request("PATCH", `/api/admin/business-contacts/${sampleBizId}/verify`, {
    token: adminToken,
    body: { verified: true, notes: "Verified against commercial registry." },
  });
  record("Admin Approve Verification Badge", "PATCH", `/api/admin/business-contacts/:id/verify`, adminApproveVerif.isExpected && adminApproveVerif.data?.verified === true, adminApproveVerif.durationMs);

  // -------------------------------------------------------------
  // 9. Special Offers CRUD with Start and End Dates
  // -------------------------------------------------------------
  console.log("\n▶ Group 8: Special Time-Bound Offers CRUD");
  const now = new Date();
  const startDate = new Date(now.getTime() - 1000).toISOString();
  const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

  const createOffer = await request("POST", "/api/business-contacts/offers", {
    token: bizToken,
    body: {
      title: "Year-End Cloud Modernization Grant",
      description: "Get 50% discount on first month of managed services.",
      discountCode: "GRANT50",
      discountPercent: 50,
      offerBadge: "50% OFF",
      startDate,
      endDate,
    },
    expectedStatus: 201,
  });
  const offerId = createOffer.data?.id;
  record("Create Time-Bound Special Offer", "POST", "/api/business-contacts/offers", createOffer.isExpected, createOffer.durationMs);

  const getMyOffers = await request("GET", "/api/business-contacts/offers/me", { token: bizToken });
  record("Get My Offers", "GET", "/api/business-contacts/offers/me", getMyOffers.isExpected && getMyOffers.data?.active?.length > 0, getMyOffers.durationMs);

  if (offerId) {
    const updateOffer = await request("PATCH", `/api/business-contacts/offers/${offerId}`, {
      token: bizToken,
      body: { discountPercent: 40, offerBadge: "40% OFF" },
    });
    record("Update Special Offer", "PATCH", `/api/business-contacts/offers/:id`, updateOffer.isExpected && updateOffer.data?.discountPercent === 40, updateOffer.durationMs);

    const deleteOffer = await request("DELETE", `/api/business-contacts/offers/${offerId}`, {
      token: bizToken,
      expectedStatus: 204,
    });
    record("Delete Special Offer", "DELETE", `/api/business-contacts/offers/:id`, deleteOffer.isExpected, deleteOffer.durationMs);
  }

  // -------------------------------------------------------------
  // 10. WhatsApp-Style Chat, Quick Replies, & Location Share
  // -------------------------------------------------------------
  console.log("\n▶ Group 9: WhatsApp-Style Chat & Location Share");
  const quickReplies = await request("GET", `/api/business-contacts/${sampleBizId}/quick-replies`);
  record("Get Quick Replies", "GET", `/api/business-contacts/:id/quick-replies`, quickReplies.isExpected && Array.isArray(quickReplies.data?.options), quickReplies.durationMs);

  const startConvo = await request("POST", "/api/business-contacts/chat/conversations", {
    token: customerToken,
    body: { businessId: sampleBizId },
  });
  const convoId = startConvo.data?.conversationId;
  record("Start / Open Business Chat", "POST", "/api/business-contacts/chat/conversations", startConvo.isExpected && !!convoId, startConvo.durationMs);

  if (convoId) {
    const sendMsg = await request("POST", `/api/business-contacts/chat/conversations/${convoId}/messages`, {
      token: customerToken,
      body: { text: "Hello! We would like to inquire about your cloud assessment packages." },
      expectedStatus: 201,
    });
    record("Send Text Message in Chat", "POST", `/api/business-contacts/chat/conversations/:id/messages`, sendMsg.isExpected, sendMsg.durationMs);

    // Customer taps Share Location in chat
    const shareLoc = await request("POST", `/api/business-contacts/chat/conversations/${convoId}/share-location`, {
      token: customerToken,
      body: {
        latitude: 12.9784,
        longitude: 77.6408,
        address: "100 Feet Road, Indiranagar, Bengaluru",
      },
      expectedStatus: 201,
    });
    record("Customer Shares Location in Chat", "POST", `/api/business-contacts/chat/conversations/:id/share-location`, shareLoc.isExpected && !!shareLoc.data?.location?.mapUrl, shareLoc.durationMs);

    const getMsgs = await request("GET", `/api/business-contacts/chat/conversations/${convoId}/messages`, {
      token: customerToken,
    });
    record("Get Saved Chat History", "GET", `/api/business-contacts/chat/conversations/:id/messages`, getMsgs.isExpected && getMsgs.data?.count >= 2, getMsgs.durationMs);

    // Customer and Business view conversations (Privacy Check)
    const customerInboxes = await request("GET", "/api/business-contacts/chat/conversations", {
      token: customerToken,
    });
    record("Customer View Conversations", "GET", "/api/business-contacts/chat/conversations", customerInboxes.isExpected, customerInboxes.durationMs);

    const bizInboxes = await request("GET", "/api/business-contacts/chat/conversations", {
      token: bizToken,
    });
    // Check privacy: Business person must ONLY see customerMaskedPhone and customer displayName
    const firstChat = bizInboxes.data?.conversations?.[0];
    const bizChatPrivacyPassed = bizInboxes.isExpected && (!firstChat || (firstChat.customer?.maskedPhone && !firstChat.customer?.email));
    record("Business View Conversations (Customer Privacy Enforced)", "GET", "/api/business-contacts/chat/conversations", bizChatPrivacyPassed, bizInboxes.durationMs);
  }

  // -------------------------------------------------------------
  // 11. Masked Calling & Share Link
  // -------------------------------------------------------------
  console.log("\n▶ Group 10: Masked Calling & Share Link");
  const callSession = await request("POST", `/api/business-contacts/${sampleBizId}/call`, {
    token: customerToken,
    expectedStatus: 201,
  });
  // Check privacy: real customer phone is shielded behind masked caller id and relay token
  const callPrivacyPassed = callSession.isExpected && !!callSession.data?.maskedCallerId && !!callSession.data?.relayToken;
  record("Initiate Masked Call (Customer Phone Shielded)", "POST", `/api/business-contacts/:id/call`, callPrivacyPassed, callSession.durationMs);

  const sharePayload = await request("GET", `/api/business-contacts/${sampleBizId}/share`);
  record("Get Business Share Link", "GET", `/api/business-contacts/:id/share`, sharePayload.isExpected && !!sharePayload.data?.shareUrl, sharePayload.durationMs);

  // -------------------------------------------------------------
  // 12. Area-Based Notifications & Expiry Sweeper
  // -------------------------------------------------------------
  console.log("\n▶ Group 11: Area Notifications & Expiry Sweeper");
  const getNotifPref = await request("GET", "/api/business-contacts/notifications/preferences", {
    token: customerToken,
  });
  record("Get Customer Notification Preferences", "GET", "/api/business-contacts/notifications/preferences", getNotifPref.isExpected, getNotifPref.durationMs);

  const updateNotifPref = await request("PUT", "/api/business-contacts/notifications/preferences", {
    token: customerToken,
    body: {
      area: "Indiranagar",
      pincode: "560038",
      offersEnabled: true,
      statusUpdatesEnabled: true,
      openCloseAlertsEnabled: true,
    },
  });
  record("Update Notification Preferences (Opt-in / Opt-out)", "PUT", "/api/business-contacts/notifications/preferences", updateNotifPref.isExpected, updateNotifPref.durationMs);

  // Business broadcast notification
  const broadcast = await request("POST", "/api/business-contacts/business/notifications/broadcast", {
    token: bizToken,
    body: {
      type: "OFFER",
      title: "Weekend Flash Discount",
      message: "Visit us this weekend for exclusive deals!",
    },
    expectedStatus: 201,
  });
  // Privacy Check: Business person sees ONLY recipient count and area, zero customer personal details
  const broadcastPrivacyPassed = broadcast.isExpected && typeof broadcast.data?.notifiedCount === "number" && !broadcast.data?.customers && !broadcast.data?.users;
  record("Broadcast Area Notification (Zero Customer Data Exposed)", "POST", "/api/business-contacts/business/notifications/broadcast", broadcastPrivacyPassed, broadcast.durationMs);

  // System cleanup expired routine
  const cleanup = await request("POST", "/api/business-contacts/system/cleanup-expired");
  record("System Automatic Expiry Sweeper", "POST", "/api/business-contacts/system/cleanup-expired", cleanup.isExpected, cleanup.durationMs);

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("📊 BUSINESS CONTACTS TEST SUITE RESULTS");
  console.log("==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`TOTAL ENDPOINTS & WORKFLOWS TESTED : ${total}`);
  console.log(`PASSED                             : ${passed}`);
  console.log(`FAILED                             : ${failed}`);
  console.log(`SUCCESS RATE                       : ${successRate}%`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

