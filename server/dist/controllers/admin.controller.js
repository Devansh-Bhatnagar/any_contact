"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardStats = dashboardStats;
exports.listBusinesses = listBusinesses;
exports.getBusiness = getBusiness;
exports.approveBusiness = approveBusiness;
exports.rejectBusiness = rejectBusiness;
exports.listPromotions = listPromotions;
exports.approvePromotion = approvePromotion;
exports.rejectPromotion = rejectPromotion;
exports.listUsers = listUsers;
exports.setUserStatus = setUserStatus;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const statusQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
});
const promotionStatusQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "RUNNING", "COMPLETED"]).optional(),
});
const rejectSchema = zod_1.z.object({ reason: zod_1.z.string().min(1) });
async function dashboardStats(_req, res) {
    const [businesses, pendingReviews, approved, rejected, promotionsRunning] = await Promise.all([
        prisma_1.prisma.business.count(),
        prisma_1.prisma.business.count({ where: { status: "PENDING" } }),
        prisma_1.prisma.business.count({ where: { status: "APPROVED" } }),
        prisma_1.prisma.business.count({ where: { status: "REJECTED" } }),
        prisma_1.prisma.promotion.count({ where: { status: "RUNNING" } }),
    ]);
    // Revenue tracking (e.g. paid promotion plans) isn't modeled yet; reserved for a future billing integration.
    res.json({ businesses, pendingReviews, approved, rejected, promotionsRunning, revenue: 0 });
}
async function listBusinesses(req, res) {
    const { status } = statusQuerySchema.parse(req.query);
    const businesses = await prisma_1.prisma.business.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
    });
    res.json(businesses);
}
async function getBusiness(req, res) {
    const business = await prisma_1.prisma.business.findUnique({
        where: { id: req.params.id },
        include: {
            media: true,
            socialLinks: true,
            services: true,
            products: true,
            promotions: true,
            owner: { select: { id: true, name: true, email: true, suspended: true, createdAt: true } },
        },
    });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    res.json(business);
}
async function approveBusiness(req, res) {
    const business = await prisma_1.prisma.business.update({
        where: { id: req.params.id },
        data: { status: "APPROVED", verified: true },
    });
    await prisma_1.prisma.notification.create({
        data: {
            userId: business.ownerId,
            type: "SUCCESS",
            title: "Business approved",
            message: `${business.companyName} has been approved and is now live.`,
        },
    });
    res.json(business);
}
async function rejectBusiness(req, res) {
    const { reason } = rejectSchema.parse(req.body);
    const business = await prisma_1.prisma.business.update({
        where: { id: req.params.id },
        data: { status: "REJECTED", verified: false },
    });
    await prisma_1.prisma.notification.create({
        data: {
            userId: business.ownerId,
            type: "ERROR",
            title: "Business rejected",
            message: `${business.companyName} was rejected: ${reason}`,
        },
    });
    res.json(business);
}
async function listPromotions(req, res) {
    const { status } = promotionStatusQuerySchema.parse(req.query);
    const promotions = await prisma_1.prisma.promotion.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: "desc" },
        include: { business: { select: { id: true, companyName: true, ownerId: true } } },
    });
    res.json(promotions);
}
async function approvePromotion(req, res) {
    const promotion = await prisma_1.prisma.promotion.update({ where: { id: req.params.id }, data: { status: "APPROVED" } });
    res.json(promotion);
}
async function rejectPromotion(req, res) {
    const promotion = await prisma_1.prisma.promotion.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
    res.json(promotion);
}
async function listUsers(_req, res) {
    const users = await prisma_1.prisma.user.findMany({
        where: { role: "BUSINESS_OWNER" },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(users);
}
async function setUserStatus(req, res) {
    const { suspended } = zod_1.z.object({ suspended: zod_1.z.boolean() }).parse(req.body);
    const user = await prisma_1.prisma.user.update({
        where: { id: req.params.id },
        data: { suspended, ...(suspended ? { refreshToken: null } : {}) },
    });
    res.json({ id: user.id, suspended: user.suspended });
}
