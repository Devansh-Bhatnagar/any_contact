"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
const updateSchema = createSchema.partial();
async function assertOwner(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this business");
}
async function assertPromotionOwner(promotionId, userId, role) {
    const promotion = await prisma_1.prisma.promotion.findUnique({ where: { id: promotionId }, include: { business: true } });
    if (!promotion)
        throw new HttpError_1.HttpError(404, "Promotion not found");
    if (promotion.business.ownerId !== userId && role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "You do not own this promotion");
    }
    return promotion;
}
async function create(req, res) {
    await assertOwner(req.params.businessId, req.user.userId, req.user.role);
    const data = createSchema.parse(req.body);
    const promotion = await prisma_1.prisma.promotion.create({ data: { ...data, businessId: req.params.businessId } });
    res.status(201).json(promotion);
}
async function list(req, res) {
    const promotions = await prisma_1.prisma.promotion.findMany({ where: { businessId: req.params.businessId } });
    res.json(promotions);
}
async function getOne(req, res) {
    const promotion = await prisma_1.prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promotion)
        throw new HttpError_1.HttpError(404, "Promotion not found");
    res.json(promotion);
}
async function update(req, res) {
    const promotion = await assertPromotionOwner(req.params.id, req.user.userId, req.user.role);
    if (promotion.status !== "PENDING")
        throw new HttpError_1.HttpError(400, "Only pending promotions can be edited");
    const data = updateSchema.parse(req.body);
    const updated = await prisma_1.prisma.promotion.update({ where: { id: req.params.id }, data });
    res.json(updated);
}
async function remove(req, res) {
    await assertPromotionOwner(req.params.id, req.user.userId, req.user.role);
    await prisma_1.prisma.promotion.delete({ where: { id: req.params.id } });
    res.status(204).send();
}
