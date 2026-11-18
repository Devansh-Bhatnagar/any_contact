import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
});

async function assertOwner(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this business");
}

async function assertServiceOwner(serviceId: string, userId: string, role: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId }, include: { business: true } });
  if (!service) throw new HttpError(404, "Service not found");
  if (service.business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this service");
  return service;
}

export async function create(req: Request, res: Response) {
  await assertOwner(req.params.businessId, req.user!.userId, req.user!.role);
  const data = serviceSchema.parse(req.body);
  const service = await prisma.service.create({ data: { ...data, businessId: req.params.businessId } });
  res.status(201).json(service);
}

export async function list(req: Request, res: Response) {
  const services = await prisma.service.findMany({ where: { businessId: req.params.businessId } });
  res.json(services);
}

export async function update(req: Request, res: Response) {
  await assertServiceOwner(req.params.serviceId, req.user!.userId, req.user!.role);
  const data = serviceSchema.partial().parse(req.body);
  const service = await prisma.service.update({ where: { id: req.params.serviceId }, data });
  res.json(service);
}

export async function remove(req: Request, res: Response) {
  await assertServiceOwner(req.params.serviceId, req.user!.userId, req.user!.role);
  await prisma.service.delete({ where: { id: req.params.serviceId } });
  res.status(204).send();
}
