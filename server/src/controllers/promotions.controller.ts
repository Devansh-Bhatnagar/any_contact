import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const updateSchema = createSchema.partial();

async function assertOwner(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this business");
}

async function assertPromotionOwner(promotionId: string, userId: string, role: string) {
  const promotion = await prisma.promotion.findUnique({ where: { id: promotionId }, include: { business: true } });
  if (!promotion) throw new HttpError(404, "Promotion not found");
  if (promotion.business.ownerId !== userId && role !== "ADMIN") {
    throw new HttpError(403, "You do not own this promotion");
  }
  return promotion;
}

export async function create(req: Request, res: Response) {
  await assertOwner(req.params.businessId, req.user!.userId, req.user!.role);
  const data = createSchema.parse(req.body);
  const promotion = await prisma.promotion.create({ data: { ...data, businessId: req.params.businessId } });
  res.status(201).json(promotion);
}

export async function list(req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({ where: { businessId: req.params.businessId } });
  res.json(promotions);
}

export async function getOne(req: Request, res: Response) {
  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) throw new HttpError(404, "Promotion not found");
  res.json(promotion);
}

export async function update(req: Request, res: Response) {
  const promotion = await assertPromotionOwner(req.params.id, req.user!.userId, req.user!.role);
  if (promotion.status !== "PENDING") throw new HttpError(400, "Only pending promotions can be edited");
  const data = updateSchema.parse(req.body);
  const updated = await prisma.promotion.update({ where: { id: req.params.id }, data });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  await assertPromotionOwner(req.params.id, req.user!.userId, req.user!.role);
  await prisma.promotion.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
