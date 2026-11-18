"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.getMine = getMine;
exports.getPublic = getPublic;
exports.update = update;
exports.submit = submit;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const workingHourSchema = zod_1.z.object({
    day: zod_1.z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
    open: zod_1.z.string().nullable(),
    close: zod_1.z.string().nullable(),
    closed: zod_1.z.boolean(),
});
const createSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1),
    ownerName: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
const updateSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).optional(),
    ownerName: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    website: zod_1.z.string().url().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    workingHours: zod_1.z.array(workingHourSchema).optional(),
});
const PROFILE_FIELDS = [
    "companyName",
    "ownerName",
    "category",
    "description",
    "phone",
    "email",
    "website",
    "address",
    "city",
    "state",
    "workingHours",
];
function computeCompletionPercent(business) {
    const filled = PROFILE_FIELDS.filter((field) => {
        const value = business[field];
        return value !== null && value !== undefined && value !== "";
    }).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
}
async function loadOwnedBusiness(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "You do not own this business");
    }
    return business;
}
async function create(req, res) {
    const data = createSchema.parse(req.body);
    const existing = await prisma_1.prisma.business.findFirst({ where: { ownerId: req.user.userId } });
    if (existing)
        throw new HttpError_1.HttpError(409, "You already have a business profile");
    const business = await prisma_1.prisma.business.create({
        data: { ...data, ownerId: req.user.userId, profileCompletionPercent: computeCompletionPercent(data) },
    });
    res.status(201).json(business);
}
async function getMine(req, res) {
    const business = await prisma_1.prisma.business.findFirst({
        where: { ownerId: req.user.userId },
        include: { media: true, socialLinks: true, services: true, products: true, promotions: true },
    });
    if (!business)
        throw new HttpError_1.HttpError(404, "No business profile yet");
    res.json(business);
}
async function getPublic(req, res) {
    const business = await prisma_1.prisma.business.findUnique({
        where: { id: req.params.id },
        include: { media: true, socialLinks: true, services: true, products: true },
    });
    if (!business || business.status !== "APPROVED")
        throw new HttpError_1.HttpError(404, "Business not found");
    res.json(business);
}
async function update(req, res) {
    await loadOwnedBusiness(req.params.id, req.user.userId, req.user.role);
    const data = updateSchema.parse(req.body);
    const merged = { ...(await prisma_1.prisma.business.findUniqueOrThrow({ where: { id: req.params.id } })), ...data };
    const business = await prisma_1.prisma.business.update({
        where: { id: req.params.id },
        data: { ...data, profileCompletionPercent: computeCompletionPercent(merged) },
    });
    res.json(business);
}
async function submit(req, res) {
    const business = await loadOwnedBusiness(req.params.id, req.user.userId, req.user.role);
    if (business.profileCompletionPercent < 100) {
        throw new HttpError_1.HttpError(400, "Complete all required fields before submitting");
    }
    const updated = await prisma_1.prisma.business.update({ where: { id: req.params.id }, data: { status: "PENDING" } });
    res.json(updated);
}
async function remove(req, res) {
    await loadOwnedBusiness(req.params.id, req.user.userId, req.user.role);
    await prisma_1.prisma.business.delete({ where: { id: req.params.id } });
    res.status(204).send();
}
