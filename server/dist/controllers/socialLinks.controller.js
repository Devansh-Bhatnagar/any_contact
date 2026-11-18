"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsert = upsert;
exports.list = list;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const platformSchema = zod_1.z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "TWITTER"]);
const upsertSchema = zod_1.z.object({
    links: zod_1.z.array(zod_1.z.object({ platform: platformSchema, url: zod_1.z.string().url() })),
});
async function assertOwner(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this business");
}
async function upsert(req, res) {
    await assertOwner(req.params.businessId, req.user.userId, req.user.role);
    const { links } = upsertSchema.parse(req.body);
    const results = await prisma_1.prisma.$transaction(links.map((link) => prisma_1.prisma.socialLink.upsert({
        where: { businessId_platform: { businessId: req.params.businessId, platform: link.platform } },
        create: { businessId: req.params.businessId, platform: link.platform, url: link.url },
        update: { url: link.url },
    })));
    res.json(results);
}
async function list(req, res) {
    const links = await prisma_1.prisma.socialLink.findMany({ where: { businessId: req.params.businessId } });
    res.json(links);
}
