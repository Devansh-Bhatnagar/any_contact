"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBusinesses = searchBusinesses;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const querySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    status: zod_1.z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
    promotionStatus: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "RUNNING", "COMPLETED"]).optional(),
    sort: zod_1.z.enum(["newest", "oldest", "mostViewed"]).optional().default("newest"),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
});
async function searchBusinesses(req, res) {
    const { q, category, city, status, promotionStatus, sort, page, limit } = querySchema.parse(req.query);
    const where = {
        status: status ?? "APPROVED",
        ...(category ? { category } : {}),
        ...(city ? { city } : {}),
        ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
        ...(promotionStatus ? { promotions: { some: { status: promotionStatus } } } : {}),
    };
    const orderBy = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };
    // "mostViewed" requires a view-count column, which isn't tracked yet; falls back to newest.
    const [items, total] = await Promise.all([
        prisma_1.prisma.business.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: { media: true },
        }),
        prisma_1.prisma.business.count({ where }),
    ]);
    res.json({ items, total, page, limit });
}
