"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.update = update;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative().optional(),
    imageUrl: zod_1.z.string().url().optional(),
});
async function assertOwner(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this business");
}
async function assertProductOwner(productId, userId, role) {
    const product = await prisma_1.prisma.product.findUnique({ where: { id: productId }, include: { business: true } });
    if (!product)
        throw new HttpError_1.HttpError(404, "Product not found");
    if (product.business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this product");
    return product;
}
async function create(req, res) {
    await assertOwner(req.params.businessId, req.user.userId, req.user.role);
    const data = productSchema.parse(req.body);
    const product = await prisma_1.prisma.product.create({ data: { ...data, businessId: req.params.businessId } });
    res.status(201).json(product);
}
async function list(req, res) {
    const products = await prisma_1.prisma.product.findMany({ where: { businessId: req.params.businessId } });
    res.json(products);
}
async function update(req, res) {
    await assertProductOwner(req.params.productId, req.user.userId, req.user.role);
    const data = productSchema.partial().parse(req.body);
    const product = await prisma_1.prisma.product.update({ where: { id: req.params.productId }, data });
    res.json(product);
}
async function remove(req, res) {
    await assertProductOwner(req.params.productId, req.user.userId, req.user.role);
    await prisma_1.prisma.product.delete({ where: { id: req.params.productId } });
    res.status(204).send();
}
