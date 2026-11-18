"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.update = update;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const serviceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative().optional(),
});
async function assertOwner(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this business");
}
async function assertServiceOwner(serviceId, userId, role) {
    const service = await prisma_1.prisma.service.findUnique({ where: { id: serviceId }, include: { business: true } });
    if (!service)
        throw new HttpError_1.HttpError(404, "Service not found");
    if (service.business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this service");
    return service;
}
async function create(req, res) {
    await assertOwner(req.params.businessId, req.user.userId, req.user.role);
    const data = serviceSchema.parse(req.body);
    const service = await prisma_1.prisma.service.create({ data: { ...data, businessId: req.params.businessId } });
    res.status(201).json(service);
}
async function list(req, res) {
    const services = await prisma_1.prisma.service.findMany({ where: { businessId: req.params.businessId } });
    res.json(services);
}
async function update(req, res) {
    await assertServiceOwner(req.params.serviceId, req.user.userId, req.user.role);
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma_1.prisma.service.update({ where: { id: req.params.serviceId }, data });
    res.json(service);
}
async function remove(req, res) {
    await assertServiceOwner(req.params.serviceId, req.user.userId, req.user.role);
    await prisma_1.prisma.service.delete({ where: { id: req.params.serviceId } });
    res.status(204).send();
}
