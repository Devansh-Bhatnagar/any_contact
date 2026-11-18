"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
exports.list = list;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const upload_1 = require("../middleware/upload");
const mediaTypeSchema = zod_1.z.enum(["LOGO", "COVER", "GALLERY"]);
const MAX_GALLERY_IMAGES = 10;
async function assertOwner(businessId, userId, role) {
    const business = await prisma_1.prisma.business.findUnique({ where: { id: businessId } });
    if (!business)
        throw new HttpError_1.HttpError(404, "Business not found");
    if (business.ownerId !== userId && role !== "ADMIN")
        throw new HttpError_1.HttpError(403, "You do not own this business");
}
async function upload(req, res) {
    await assertOwner(req.params.businessId, req.user.userId, req.user.role);
    if (!req.file)
        throw new HttpError_1.HttpError(400, "No file uploaded");
    const type = mediaTypeSchema.parse(req.body.type);
    if (type === "GALLERY") {
        const count = await prisma_1.prisma.businessMedia.count({ where: { businessId: req.params.businessId, type: "GALLERY" } });
        if (count >= MAX_GALLERY_IMAGES) {
            throw new HttpError_1.HttpError(400, `Gallery is limited to ${MAX_GALLERY_IMAGES} images`);
        }
    }
    else {
        // A business has exactly one active logo/cover — replace whatever was there before.
        const previous = await prisma_1.prisma.businessMedia.findMany({
            where: { businessId: req.params.businessId, type },
        });
        await prisma_1.prisma.businessMedia.deleteMany({ where: { businessId: req.params.businessId, type } });
        await Promise.all(previous.map((p) => (0, upload_1.deleteFileByUrl)(p.url)));
    }
    const media = await prisma_1.prisma.businessMedia.create({
        data: { businessId: req.params.businessId, type, url: (0, upload_1.fileUrl)(req.file.filename) },
    });
    res.status(201).json(media);
}
async function list(req, res) {
    const media = await prisma_1.prisma.businessMedia.findMany({ where: { businessId: req.params.businessId } });
    res.json(media);
}
async function remove(req, res) {
    const media = await prisma_1.prisma.businessMedia.findUnique({ where: { id: req.params.mediaId } });
    if (!media)
        throw new HttpError_1.HttpError(404, "Media not found");
    await assertOwner(media.businessId, req.user.userId, req.user.role);
    await prisma_1.prisma.businessMedia.delete({ where: { id: req.params.mediaId } });
    await (0, upload_1.deleteFileByUrl)(media.url);
    res.status(204).send();
}
