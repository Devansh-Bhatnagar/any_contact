import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const statusQuerySchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
});

const promotionStatusQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "RUNNING", "COMPLETED"]).optional(),
});

const rejectSchema = z.object({ reason: z.string().min(1) });

export async function dashboardStats(_req: Request, res: Response) {
  const [businesses, pendingReviews, approved, rejected, promotionsRunning] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "PENDING" } }),
    prisma.business.count({ where: { status: "APPROVED" } }),
    prisma.business.count({ where: { status: "REJECTED" } }),
    prisma.promotion.count({ where: { status: "RUNNING" } }),
  ]);

  // Revenue tracking (e.g. paid promotion plans) isn't modeled yet; reserved for a future billing integration.
  res.json({ businesses, pendingReviews, approved, rejected, promotionsRunning, revenue: 0 });
}

export async function listBusinesses(req: Request, res: Response) {
  const { status } = statusQuerySchema.parse(req.query);
  const businesses = await prisma.business.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  res.json(businesses);
}

export async function getBusiness(req: Request, res: Response) {
  const business = await prisma.business.findUnique({
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
  if (!business) throw new HttpError(404, "Business not found");
  res.json(business);
}

export async function approveBusiness(req: Request, res: Response) {
  const business = await prisma.business.update({
    where: { id: req.params.id },
    data: { status: "APPROVED", verified: true },
  });
  await prisma.notification.create({
    data: {
      userId: business.ownerId,
      type: "SUCCESS",
      title: "Business approved",
      message: `${business.companyName} has been approved and is now live.`,
    },
  });
  res.json(business);
}

export async function rejectBusiness(req: Request, res: Response) {
  const { reason } = rejectSchema.parse(req.body);
  const business = await prisma.business.update({
    where: { id: req.params.id },
    data: { status: "REJECTED", verified: false },
  });
  await prisma.notification.create({
    data: {
      userId: business.ownerId,
      type: "ERROR",
      title: "Business rejected",
      message: `${business.companyName} was rejected: ${reason}`,
    },
  });
  res.json(business);
}

export async function listPromotions(req: Request, res: Response) {
  const { status } = promotionStatusQuerySchema.parse(req.query);
  const promotions = await prisma.promotion.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { business: { select: { id: true, companyName: true, ownerId: true } } },
  });
  res.json(promotions);
}

export async function approvePromotion(req: Request, res: Response) {
  const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data: { status: "APPROVED" } });
  res.json(promotion);
}

export async function rejectPromotion(req: Request, res: Response) {
  const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
  res.json(promotion);
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: "BUSINESS_OWNER" },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
}

export async function setUserStatus(req: Request, res: Response) {
  const { suspended } = z.object({ suspended: z.boolean() }).parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { suspended, ...(suspended ? { refreshToken: null } : {}) },
  });
  res.json({ id: user.id, suspended: user.suspended });
}
