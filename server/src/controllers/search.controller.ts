import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
  promotionStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "RUNNING", "COMPLETED"]).optional(),
  sort: z.enum(["newest", "oldest", "mostViewed"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function searchBusinesses(req: Request, res: Response) {
  const { q, category, city, status, promotionStatus, sort, page, limit } = querySchema.parse(req.query);

  const where: Prisma.BusinessWhereInput = {
    status: status ?? "APPROVED",
    ...(category ? { category } : {}),
    ...(city ? { city } : {}),
    ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
    ...(promotionStatus ? { promotions: { some: { status: promotionStatus } } } : {}),
  };

  const orderBy: Prisma.BusinessOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };
  // "mostViewed" requires a view-count column, which isn't tracked yet; falls back to newest.

  const [items, total] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { media: true },
    }),
    prisma.business.count({ where }),
  ]);

  res.json({ items, total, page, limit });
}
