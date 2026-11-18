import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
});

async function assertOwner(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this business");
}

async function assertProductOwner(productId: string, userId: string, role: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { business: true } });
  if (!product) throw new HttpError(404, "Product not found");
  if (product.business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this product");
  return product;
}

export async function create(req: Request, res: Response) {
  await assertOwner(req.params.businessId, req.user!.userId, req.user!.role);
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data: { ...data, businessId: req.params.businessId } });
  res.status(201).json(product);
}

export async function list(req: Request, res: Response) {
  const products = await prisma.product.findMany({ where: { businessId: req.params.businessId } });
  res.json(products);
}

export async function update(req: Request, res: Response) {
  await assertProductOwner(req.params.productId, req.user!.userId, req.user!.role);
  const data = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.productId }, data });
  res.json(product);
}

export async function remove(req: Request, res: Response) {
  await assertProductOwner(req.params.productId, req.user!.userId, req.user!.role);
  await prisma.product.delete({ where: { id: req.params.productId } });
  res.status(204).send();
}
