"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelfProfile = getSelfProfile;
exports.updateSelfProfile = updateSelfProfile;
exports.updateWorkingHours = updateWorkingHours;
exports.postStatus = postStatus;
exports.getMyStatuses = getMyStatuses;
exports.deleteStatus = deleteStatus;
exports.requestVerification = requestVerification;
exports.getVerificationStatus = getVerificationStatus;
exports.createSpecialOffer = createSpecialOffer;
exports.getMySpecialOffers = getMySpecialOffers;
exports.updateSpecialOffer = updateSpecialOffer;
exports.deleteSpecialOffer = deleteSpecialOffer;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const businessHours_1 = require("../utils/businessHours");
const statusDuration_1 = require("../utils/statusDuration");
const workingHoursSchema = zod_1.z.record(zod_1.z.object({
    open: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM"),
    close: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM"),
    isClosed: zod_1.z.boolean().optional(),
})).optional();
const updateProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).optional(),
    ownerName: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email().nullable().optional(),
    website: zod_1.z.string().nullable().optional(),
    address: zod_1.z.string().nullable().optional(),
    city: zod_1.z.string().nullable().optional(),
    state: zod_1.z.string().nullable().optional(),
    area: zod_1.z.string().nullable().optional(),
    pincode: zod_1.z.string().nullable().optional(),
    statusLine: zod_1.z.string().nullable().optional(),
    googleMapsUrl: zod_1.z.string().url("Must be valid URL").nullable().optional(),
    quickReplies: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    manualStatus: zod_1.z.enum(["AUTO", "OPEN", "CLOSED"]).optional(),
    workingHours: workingHoursSchema,
});
const postStatusSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().default(""),
    duration: zod_1.z.enum(statusDuration_1.ALLOWED_STATUS_DURATIONS).default("1_DAY"),
    offerBadge: zod_1.z.string().nullable().optional(),
    price: zod_1.z.string().nullable().optional(),
    imageUrl: zod_1.z.string().nullable().optional(),
    gradientStart: zod_1.z.string().default("#00236F"),
    gradientEnd: zod_1.z.string().default("#0051D5"),
});
const specialOfferSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().nullable().optional(),
    discountCode: zod_1.z.string().nullable().optional(),
    discountPercent: zod_1.z.number().int().min(1).max(100).nullable().optional(),
    offerBadge: zod_1.z.string().min(1, "Offer badge is required (e.g. 50% OFF, 1+1 FREE)"),
    bannerUrl: zod_1.z.string().nullable().optional(),
    startDate: zod_1.z.string().datetime("Must be ISO datetime"),
    endDate: zod_1.z.string().datetime("Must be ISO datetime"),
});
async function getOwnedBusiness(userId) {
    const business = await prisma_1.prisma.business.findFirst({
        where: { ownerId: userId },
        include: {
            statusStories: {
                where: { isActive: true, expiresAt: { gt: new Date() } },
                orderBy: { createdAt: "desc" },
            },
            specialOffers: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "No business profile registered under your account");
    }
    return business;
}
async function getSelfProfile(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const openStatus = (0, businessHours_1.calculateOpenStatus)(business.workingHours, business.manualStatus);
    res.json({
        ...business,
        openStatus,
    });
}
async function updateSelfProfile(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const data = updateProfileSchema.parse(req.body);
    const updated = await prisma_1.prisma.business.update({
        where: { id: business.id },
        data: {
            ...data,
            workingHours: data.workingHours ? data.workingHours : undefined,
            quickReplies: data.quickReplies ? data.quickReplies : undefined,
        },
    });
    const openStatus = (0, businessHours_1.calculateOpenStatus)(updated.workingHours, updated.manualStatus);
    // If manualStatus or workingHours changed, trigger background notification to opted-in customers
    if (data.manualStatus && updated.area) {
        try {
            const customers = await prisma_1.prisma.customerNotificationPreference.findMany({
                where: { area: updated.area, openCloseAlertsEnabled: true },
                select: { userId: true },
            });
            if (customers.length > 0) {
                await prisma_1.prisma.notification.createMany({
                    data: customers.map((c) => ({
                        userId: c.userId,
                        type: "INFO",
                        title: `${updated.companyName} is now ${openStatus.statusText}`,
                        message: `Working hours update: ${updated.companyName} is currently ${openStatus.statusText} (${openStatus.todayHours}).`,
                    })),
                });
                await prisma_1.prisma.areaNotificationLog.create({
                    data: {
                        businessId: updated.id,
                        area: updated.area,
                        type: "OPEN_CLOSE",
                        title: `${updated.companyName} Status: ${openStatus.statusText}`,
                        message: `Updated to ${openStatus.statusText}`,
                        recipientCount: customers.length,
                    },
                });
            }
        }
        catch {
            // Background notifications are fire-and-forget
        }
    }
    res.json({
        ...updated,
        openStatus,
    });
}
async function updateWorkingHours(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const schema = zod_1.z.object({
        workingHours: workingHoursSchema.optional(),
        manualStatus: zod_1.z.enum(["AUTO", "OPEN", "CLOSED"]).optional(),
    });
    const data = schema.parse(req.body);
    const updated = await prisma_1.prisma.business.update({
        where: { id: business.id },
        data: {
            workingHours: data.workingHours ? data.workingHours : undefined,
            manualStatus: data.manualStatus,
        },
    });
    const openStatus = (0, businessHours_1.calculateOpenStatus)(updated.workingHours, updated.manualStatus);
    res.json({
        id: updated.id,
        workingHours: updated.workingHours,
        manualStatus: updated.manualStatus,
        openStatus,
    });
}
async function postStatus(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const data = postStatusSchema.parse(req.body);
    const expiresAt = (0, statusDuration_1.calculateStatusExpiry)(data.duration);
    const status = await prisma_1.prisma.statusStory.create({
        data: {
            businessId: business.id,
            title: data.title,
            description: data.description,
            offerBadge: data.offerBadge,
            price: data.price,
            imageUrl: data.imageUrl,
            gradientStart: data.gradientStart,
            gradientEnd: data.gradientEnd,
            duration: data.duration,
            expiresAt,
            isActive: true,
        },
    });
    // Background area notification dispatch for status update
    if (business.area) {
        try {
            const customers = await prisma_1.prisma.customerNotificationPreference.findMany({
                where: { area: business.area, statusUpdatesEnabled: true },
                select: { userId: true },
            });
            if (customers.length > 0) {
                await prisma_1.prisma.notification.createMany({
                    data: customers.map((c) => ({
                        userId: c.userId,
                        type: "INFO",
                        title: `New Status from ${business.companyName}`,
                        message: `${data.title} - active in ${business.area}.`,
                    })),
                });
                await prisma_1.prisma.areaNotificationLog.create({
                    data: {
                        businessId: business.id,
                        area: business.area,
                        type: "STATUS",
                        title: `Status: ${data.title}`,
                        message: data.description || "New status update posted",
                        recipientCount: customers.length,
                    },
                });
            }
        }
        catch {
            // Fire and forget
        }
    }
    res.status(201).json(status);
}
async function getMyStatuses(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const now = new Date();
    const statuses = await prisma_1.prisma.statusStory.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
    });
    const active = statuses.filter((s) => s.isActive && s.expiresAt > now);
    const expired = statuses.filter((s) => !s.isActive || s.expiresAt <= now);
    res.json({ active, expired });
}
async function deleteStatus(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const { id } = req.params;
    const status = await prisma_1.prisma.statusStory.findFirst({
        where: { id, businessId: business.id },
    });
    if (!status) {
        throw new HttpError_1.HttpError(404, "Status story not found");
    }
    await prisma_1.prisma.statusStory.update({
        where: { id },
        data: { isActive: false },
    });
    res.status(204).send();
}
async function requestVerification(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const schema = zod_1.z.object({
        notes: zod_1.z.string().optional(),
    });
    const data = schema.parse(req.body);
    const updated = await prisma_1.prisma.business.update({
        where: { id: business.id },
        data: {
            verificationRequested: true,
            verificationNotes: data.notes || "Requested official verified badge",
            verificationRequestedAt: new Date(),
        },
    });
    res.json({
        id: updated.id,
        companyName: updated.companyName,
        verified: updated.verified,
        verificationRequested: updated.verificationRequested,
        verificationRequestedAt: updated.verificationRequestedAt,
        message: "Verification request submitted for admin review",
    });
}
async function getVerificationStatus(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    res.json({
        id: business.id,
        companyName: business.companyName,
        verified: business.verified,
        verificationRequested: business.verificationRequested,
        verificationNotes: business.verificationNotes,
        verificationRequestedAt: business.verificationRequestedAt,
        verifiedAt: business.verifiedAt,
    });
}
async function createSpecialOffer(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const data = specialOfferSchema.parse(req.body);
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
        throw new HttpError_1.HttpError(400, "Offer endDate must be after startDate");
    }
    const offer = await prisma_1.prisma.specialOffer.create({
        data: {
            businessId: business.id,
            title: data.title,
            description: data.description,
            discountCode: data.discountCode,
            discountPercent: data.discountPercent,
            offerBadge: data.offerBadge,
            bannerUrl: data.bannerUrl,
            startDate: start,
            endDate: end,
            isActive: true,
        },
    });
    // Background area notification dispatch for new special offer
    if (business.area) {
        try {
            const customers = await prisma_1.prisma.customerNotificationPreference.findMany({
                where: { area: business.area, offersEnabled: true },
                select: { userId: true },
            });
            if (customers.length > 0) {
                await prisma_1.prisma.notification.createMany({
                    data: customers.map((c) => ({
                        userId: c.userId,
                        type: "INFO",
                        title: `🔥 Special Offer from ${business.companyName}!`,
                        message: `[${data.offerBadge}] ${data.title} is now active in ${business.area}. Check it out!`,
                    })),
                });
                await prisma_1.prisma.areaNotificationLog.create({
                    data: {
                        businessId: business.id,
                        area: business.area,
                        type: "OFFER",
                        title: `Special Offer: ${data.title}`,
                        message: `Badge: ${data.offerBadge}`,
                        recipientCount: customers.length,
                    },
                });
            }
        }
        catch {
            // Fire and forget
        }
    }
    res.status(201).json(offer);
}
async function getMySpecialOffers(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const now = new Date();
    const offers = await prisma_1.prisma.specialOffer.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
    });
    const active = offers.filter((o) => o.isActive && o.startDate <= now && o.endDate >= now);
    const scheduled = offers.filter((o) => o.isActive && o.startDate > now);
    const expired = offers.filter((o) => !o.isActive || o.endDate < now);
    res.json({ active, scheduled, expired, all: offers });
}
async function updateSpecialOffer(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const { id } = req.params;
    const existing = await prisma_1.prisma.specialOffer.findFirst({
        where: { id, businessId: business.id },
    });
    if (!existing) {
        throw new HttpError_1.HttpError(404, "Special offer not found");
    }
    const patchSchema = specialOfferSchema.partial().extend({
        isActive: zod_1.z.boolean().optional(),
    });
    const data = patchSchema.parse(req.body);
    const updated = await prisma_1.prisma.specialOffer.update({
        where: { id },
        data: {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
    });
    res.json(updated);
}
async function deleteSpecialOffer(req, res) {
    const business = await getOwnedBusiness(req.user.userId);
    const { id } = req.params;
    const existing = await prisma_1.prisma.specialOffer.findFirst({
        where: { id, businessId: business.id },
    });
    if (!existing) {
        throw new HttpError_1.HttpError(404, "Special offer not found");
    }
    await prisma_1.prisma.specialOffer.update({
        where: { id },
        data: { isActive: false },
    });
    res.status(204).send();
}
