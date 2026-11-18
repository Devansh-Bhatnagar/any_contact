import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getBootstrap,
  getReferenceLookups,
  postStatusStory,
  recordStoryView,
  createLead,
  updateLeadStage,
  matchContacts,
  getRecentCalls,
  createCallRecord,
} from "../controllers/phonebook.controller";

const router = Router();

// SDUI Single Roundtrip Bootstrap (Eliminates Waterfalls)
router.get("/bootstrap", asyncHandler(getBootstrap));

// Reference Lookups
router.get("/lookups", asyncHandler(getReferenceLookups));

// Status Stories
router.post("/status", asyncHandler(postStatusStory));
router.post("/status/:id/view", asyncHandler(recordStoryView));

// Leads CRM Pipeline
router.post("/leads", asyncHandler(createLead));
router.patch("/leads/:id/stage", asyncHandler(updateLeadStage));

// Secure Device Contacts Matching
router.post("/match-contacts", asyncHandler(matchContacts));

// Recent Call Records
router.get("/calls", asyncHandler(getRecentCalls));
router.post("/calls", asyncHandler(createCallRecord));

export default router;

