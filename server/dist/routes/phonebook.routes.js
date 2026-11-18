"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const phonebook_controller_1 = require("../controllers/phonebook.controller");
const router = (0, express_1.Router)();
// SDUI Single Roundtrip Bootstrap (Eliminates Waterfalls)
router.get("/bootstrap", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.getBootstrap));
// Reference Lookups
router.get("/lookups", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.getReferenceLookups));
// Status Stories
router.post("/status", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.postStatusStory));
router.post("/status/:id/view", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.recordStoryView));
// Leads CRM Pipeline
router.post("/leads", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.createLead));
router.patch("/leads/:id/stage", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.updateLeadStage));
// Secure Device Contacts Matching
router.post("/match-contacts", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.matchContacts));
// Recent Call Records
router.get("/calls", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.getRecentCalls));
router.post("/calls", (0, asyncHandler_1.asyncHandler)(phonebook_controller_1.createCallRecord));
exports.default = router;
