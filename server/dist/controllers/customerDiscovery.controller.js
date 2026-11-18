"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyGroupedBusinesses = getNearbyGroupedBusinesses;
exports.searchBusinesses = searchBusinesses;
exports.getActiveSpecialOffers = getActiveSpecialOffers;
exports.getBusinessDetails = getBusinessDetails;
exports.getSharePayload = getSharePayload;
exports.getFavorites = getFavorites;
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.getSavedListOrder = getSavedListOrder;
exports.saveListOrder = saveListOrder;
exports.getBusinessReviews = getBusinessReviews;
exports.addBusinessReview = addBusinessReview;
exports.replyToReview = replyToReview;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const businessHours_1 = require("../utils/businessHours");
const privacyMask_1 = require("../utils/privacyMask");
async function getNearbyGroupedBusinesses(req, res) {
    const userId = req.user?.userId;
    const areaQuery = req.query.area;
    const pincodeQuery = req.query.pincode;
    // If user is authenticated and didn't specify query, check their preferred area
    let targetArea = areaQuery;
    let targetPincode = pincodeQuery;
    if (userId && !targetArea && !targetPincode) {
        const pref = await prisma_1.prisma.customerNotificationPreference.findUnique({
            where: { userId },
        });
        if (pref) {
            targetArea = pref.area;
            targetPincode = pref.pincode || undefined;
        }
    }
    // Filter approved businesses
    const whereClause = {
        status: "APPROVED",
    };
    if (targetArea) {
        whereClause.area = { equals: targetArea, mode: "insensitive" };
    }
    else if (targetPincode) {
        whereClause.pincode = { equals: targetPincode };
    }
    const businesses = await prisma_1.prisma.business.findMany({
        where: whereClause,
        include: {
            reviews: {
                select: { rating: true },
            },
            specialOffers: {
                where: {
                    isActive: true,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                },
                select: { id: true, title: true, offerBadge: true },
            },
            statusStories: {
                where: { isActive: true, expiresAt: { gt: new Date() } },
                select: { id: true, title: true, expiresAt: true },
                take: 1,
            },
        },
        orderBy: { companyName: "asc" },
    });
    // Check if user has custom ordering
    let customOrderMap = {};
    let favoritesSet = new Set();
    if (userId) {
        const [orders, favs] = await Promise.all([
            prisma_1.prisma.customerBusinessOrder.findMany({
                where: { userId },
                select: { businessId: true, customOrder: true },
            }),
            prisma_1.prisma.businessFavorite.findMany({
                where: { userId },
                select: { businessId: true },
            }),
        ]);
        for (const o of orders)
            customOrderMap[o.businessId] = o.customOrder;
        for (const f of favs)
            favoritesSet.add(f.businessId);
    }
    // Map and sort
    const formatted = businesses.map((b) => {
        const ratings = b.reviews.map((r) => r.rating);
        const avgRating = ratings.length > 0
            ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
            : 0;
        const openStatus = (0, businessHours_1.calculateOpenStatus)(b.workingHours, b.manualStatus);
        return {
            id: b.id,
            companyName: b.companyName,
            ownerName: b.ownerName,
            category: b.category,
            description: b.description,
            area: b.area,
            pincode: b.pincode,
            city: b.city,
            address: b.address,
            statusLine: b.statusLine,
            googleMapsUrl: b.googleMapsUrl,
            verified: b.verified,
            openStatus,
            rating: avgRating,
            reviewCount: ratings.length,
            activeOffersCount: b.specialOffers.length,
            activeStatus: b.statusStories[0] || null,
            isFavorite: favoritesSet.has(b.id),
            customOrder: customOrderMap[b.id] ?? 9999,
            maskedPhone: (0, privacyMask_1.maskPhoneNumber)(b.phone),
        };
    });
    // Sort by customOrder first (if present), then alphabetical
    formatted.sort((a, b) => {
        if (a.customOrder !== b.customOrder) {
            return a.customOrder - b.customOrder;
        }
        return a.companyName.localeCompare(b.companyName);
    });
    // Group category-wise
    const categoryGroups = {};
    for (const item of formatted) {
        if (!categoryGroups[item.category]) {
            categoryGroups[item.category] = [];
        }
        categoryGroups[item.category].push(item);
    }
    res.json({
        filter: { area: targetArea || "ALL", pincode: targetPincode || null },
        totalCount: formatted.length,
        categories: Object.keys(categoryGroups).map((cat) => ({
            category: cat,
            count: categoryGroups[cat].length,
            businesses: categoryGroups[cat],
        })),
        flatList: formatted,
    });
}
async function searchBusinesses(req, res) {
    const q = req.query.q?.trim();
    const area = req.query.area?.trim();
    const pincode = req.query.pincode?.trim();
    const category = req.query.category?.trim();
    const whereClause = {
        status: "APPROVED",
    };
    if (q) {
        const terms = [q];
        if (q.toLowerCase().endsWith("er") && q.length > 4) {
            terms.push(q.slice(0, -2) + "ing");
            terms.push(q.slice(0, -2));
        }
        else if (q.toLowerCase().endsWith("ing") && q.length > 5) {
            terms.push(q.slice(0, -3) + "er");
            terms.push(q.slice(0, -3));
        }
        whereClause.OR = terms.flatMap((term) => [
            { companyName: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { statusLine: { contains: term, mode: "insensitive" } },
            { category: { contains: term, mode: "insensitive" } },
            { area: { contains: term, mode: "insensitive" } },
        ]);
    }
    if (area) {
        whereClause.area = { contains: area, mode: "insensitive" };
    }
    if (pincode) {
        whereClause.pincode = { equals: pincode };
    }
    if (category) {
        whereClause.category = { contains: category, mode: "insensitive" };
    }
    const results = await prisma_1.prisma.business.findMany({
        where: whereClause,
        include: {
            reviews: { select: { rating: true } },
            specialOffers: {
                where: {
                    isActive: true,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                },
                select: { id: true, title: true, offerBadge: true },
            },
        },
        orderBy: { companyName: "asc" },
    });
    const formatted = results.map((b) => {
        const ratings = b.reviews.map((r) => r.rating);
        const avgRating = ratings.length > 0
            ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
            : 0;
        return {
            id: b.id,
            companyName: b.companyName,
            category: b.category,
            area: b.area,
            pincode: b.pincode,
            city: b.city,
            statusLine: b.statusLine,
            googleMapsUrl: b.googleMapsUrl,
            verified: b.verified,
            openStatus: (0, businessHours_1.calculateOpenStatus)(b.workingHours, b.manualStatus),
            rating: avgRating,
            reviewCount: ratings.length,
            activeOffersCount: b.specialOffers.length,
            maskedPhone: (0, privacyMask_1.maskPhoneNumber)(b.phone),
        };
    });
    res.json({
        query: { q, area, pincode, category },
        count: formatted.length,
        results: formatted,
    });
}
async function getActiveSpecialOffers(req, res) {
    const area = req.query.area;
    const now = new Date();
    const offers = await prisma_1.prisma.specialOffer.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            business: {
                status: "APPROVED",
                ...(area ? { area: { equals: area, mode: "insensitive" } } : {}),
            },
        },
        include: {
            business: {
                select: {
                    id: true,
                    companyName: true,
                    category: true,
                    area: true,
                    pincode: true,
                    verified: true,
                    googleMapsUrl: true,
                    workingHours: true,
                    manualStatus: true,
                    phone: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const formatted = offers.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        offerBadge: o.offerBadge,
        discountCode: o.discountCode,
        discountPercent: o.discountPercent,
        bannerUrl: o.bannerUrl,
        startDate: o.startDate,
        endDate: o.endDate,
        business: {
            id: o.business.id,
            companyName: o.business.companyName,
            category: o.business.category,
            area: o.business.area,
            pincode: o.business.pincode,
            verified: o.business.verified,
            googleMapsUrl: o.business.googleMapsUrl,
            openStatus: (0, businessHours_1.calculateOpenStatus)(o.business.workingHours, o.business.manualStatus),
            maskedPhone: (0, privacyMask_1.maskPhoneNumber)(o.business.phone),
        },
    }));
    res.json({ count: formatted.length, offers: formatted });
}
async function getBusinessDetails(req, res) {
    const { id } = req.params;
    const userId = req.user?.userId;
    const now = new Date();
    const business = await prisma_1.prisma.business.findUnique({
        where: { id },
        include: {
            reviews: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            specialOffers: {
                where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
            },
            statusStories: {
                where: { isActive: true, expiresAt: { gt: now } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!business || business.status !== "APPROVED") {
        throw new HttpError_1.HttpError(404, "Business not found or not approved");
    }
    let isFavorite = false;
    if (userId) {
        const fav = await prisma_1.prisma.businessFavorite.findUnique({
            where: { userId_businessId: { userId, businessId: id } },
        });
        isFavorite = !!fav;
    }
    const ratings = business.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
        : 0;
    const openStatus = (0, businessHours_1.calculateOpenStatus)(business.workingHours, business.manualStatus);
    // Category default quick replies if business has not defined custom quickReplies
    let quickReplies = business.quickReplies;
    if (!quickReplies || quickReplies.length === 0) {
        const defaultReplies = await prisma_1.prisma.categoryQuickReply.findFirst({
            where: { category: { equals: business.category, mode: "insensitive" } },
        });
        quickReplies = defaultReplies ? defaultReplies.options : [
            "Check availability & pricing",
            "Request service appointment",
            "Working hours and location",
        ];
    }
    res.json({
        id: business.id,
        companyName: business.companyName,
        ownerName: business.ownerName,
        category: business.category,
        description: business.description,
        address: business.address,
        city: business.city,
        state: business.state,
        area: business.area,
        pincode: business.pincode,
        statusLine: business.statusLine,
        googleMapsUrl: business.googleMapsUrl,
        verified: business.verified,
        openStatus,
        workingHours: business.workingHours,
        rating: avgRating,
        reviewCount: ratings.length,
        reviews: business.reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            businessReply: r.businessReply,
            repliedAt: r.repliedAt,
            createdAt: r.createdAt,
        })),
        specialOffers: business.specialOffers,
        activeStatuses: business.statusStories,
        quickReplies,
        isFavorite,
        maskedPhone: (0, privacyMask_1.maskPhoneNumber)(business.phone),
    });
}
async function getSharePayload(req, res) {
    const { id } = req.params;
    const business = await prisma_1.prisma.business.findUnique({
        where: { id },
        select: {
            id: true,
            companyName: true,
            category: true,
            area: true,
            city: true,
            statusLine: true,
            googleMapsUrl: true,
            verified: true,
        },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    const shareUrl = `https://leadsphonebook.com/b/${business.id}`;
    const shareText = `Check out ${business.companyName} (${business.category}) in ${business.area || business.city || "your area"}${business.verified ? " [Verified]" : ""} on Leads Phone Book: ${shareUrl}`;
    res.json({
        businessId: business.id,
        companyName: business.companyName,
        shareUrl,
        shareText,
        googleMapsUrl: business.googleMapsUrl,
    });
}
async function getFavorites(req, res) {
    const userId = req.user.userId;
    const favorites = await prisma_1.prisma.businessFavorite.findMany({
        where: { userId },
        include: {
            business: {
                include: {
                    reviews: { select: { rating: true } },
                    specialOffers: {
                        where: {
                            isActive: true,
                            startDate: { lte: new Date() },
                            endDate: { gte: new Date() },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const formatted = favorites.map((f) => {
        const b = f.business;
        const ratings = b.reviews.map((r) => r.rating);
        const avgRating = ratings.length > 0
            ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
            : 0;
        return {
            id: b.id,
            companyName: b.companyName,
            category: b.category,
            area: b.area,
            pincode: b.pincode,
            statusLine: b.statusLine,
            googleMapsUrl: b.googleMapsUrl,
            verified: b.verified,
            openStatus: (0, businessHours_1.calculateOpenStatus)(b.workingHours, b.manualStatus),
            rating: avgRating,
            reviewCount: ratings.length,
            activeOffersCount: b.specialOffers.length,
            favoritedAt: f.createdAt,
            maskedPhone: (0, privacyMask_1.maskPhoneNumber)(b.phone),
        };
    });
    res.json({ count: formatted.length, favorites: formatted });
}
async function addFavorite(req, res) {
    const userId = req.user.userId;
    const { businessId } = req.params;
    const business = await prisma_1.prisma.business.findUnique({
        where: { id: businessId },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    await prisma_1.prisma.businessFavorite.upsert({
        where: { userId_businessId: { userId, businessId } },
        update: {},
        create: { userId, businessId },
    });
    res.status(201).json({ success: true, message: "Added to favorites", businessId });
}
async function removeFavorite(req, res) {
    const userId = req.user.userId;
    const { businessId } = req.params;
    await prisma_1.prisma.businessFavorite.deleteMany({
        where: { userId, businessId },
    });
    res.status(204).send();
}
async function getSavedListOrder(req, res) {
    const userId = req.user.userId;
    const orders = await prisma_1.prisma.customerBusinessOrder.findMany({
        where: { userId },
        orderBy: { customOrder: "asc" },
    });
    res.json(orders);
}
async function saveListOrder(req, res) {
    const userId = req.user.userId;
    const schema = zod_1.z.object({
        businessIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    });
    const { businessIds } = schema.parse(req.body);
    await prisma_1.prisma.$transaction(businessIds.map((bId, idx) => prisma_1.prisma.customerBusinessOrder.upsert({
        where: { userId_businessId: { userId, businessId: bId } },
        update: { customOrder: idx },
        create: { userId, businessId: bId, customOrder: idx },
    })));
    res.json({ success: true, message: "List order saved successfully", orderCount: businessIds.length });
}
async function getBusinessReviews(req, res) {
    const { id } = req.params;
    const reviews = await prisma_1.prisma.businessReview.findMany({
        where: { businessId: id },
        orderBy: { createdAt: "desc" },
    });
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
        : 0;
    res.json({
        rating: avgRating,
        reviewCount: reviews.length,
        reviews: reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            businessReply: r.businessReply,
            repliedAt: r.repliedAt,
            createdAt: r.createdAt,
        })),
    });
}
async function addBusinessReview(req, res) {
    const customerId = req.user.userId;
    const { id: businessId } = req.params;
    const schema = zod_1.z.object({
        rating: zod_1.z.number().int().min(1).max(5),
        comment: zod_1.z.string().min(1, "Comment is required"),
    });
    const data = schema.parse(req.body);
    const business = await prisma_1.prisma.business.findUnique({
        where: { id: businessId },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    const customer = await prisma_1.prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true },
    });
    // Strict Privacy: Generate masked customer name so customer's personal identity is protected
    const maskedName = (0, privacyMask_1.getMaskedCustomerName)(customer?.name, customerId);
    const review = await prisma_1.prisma.businessReview.create({
        data: {
            businessId,
            customerId,
            customerName: maskedName,
            rating: data.rating,
            comment: data.comment,
        },
    });
    res.status(201).json(review);
}
async function replyToReview(req, res) {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const schema = zod_1.z.object({
        reply: zod_1.z.string().min(1, "Reply is required"),
    });
    const { reply } = schema.parse(req.body);
    const review = await prisma_1.prisma.businessReview.findUnique({
        where: { id: reviewId },
        include: { business: { select: { ownerId: true } } },
    });
    if (!review) {
        throw new HttpError_1.HttpError(404, "Review not found");
    }
    // Only the business owner (or an admin) can reply to this review
    if (review.business.ownerId !== userId && req.user.role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "You can only reply to reviews on your own business");
    }
    const updated = await prisma_1.prisma.businessReview.update({
        where: { id: reviewId },
        data: {
            businessReply: reply,
            repliedAt: new Date(),
        },
    });
    res.json(updated);
}
