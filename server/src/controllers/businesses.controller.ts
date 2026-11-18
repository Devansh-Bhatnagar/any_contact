import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const workingHourSchema = z.object({
  day: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  open: z.string().nullable(),
  close: z.string().nullable(),
  closed: z.boolean(),
});

const createSchema = z.object({
  companyName: z.string().min(1),
  ownerName: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  workingHours: z.array(workingHourSchema).optional(),
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
] as const;

function computeCompletionPercent(business: Record<string, unknown>): number {
  const filled = PROFILE_FIELDS.filter((field) => {
    const value = business[field];
    return value !== null && value !== undefined && value !== "";
  }).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

async function loadOwnedBusiness(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") {
    throw new HttpError(403, "You do not own this business");
  }
  return business;
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);

  const existing = await prisma.business.findFirst({ where: { ownerId: req.user!.userId } });
  if (existing) throw new HttpError(409, "You already have a business profile");

  const business = await prisma.business.create({
    data: { ...data, ownerId: req.user!.userId, profileCompletionPercent: computeCompletionPercent(data) },
  });
  res.status(201).json(business);
}

export async function getMine(req: Request, res: Response) {
  const business = await prisma.business.findFirst({
    where: { ownerId: req.user!.userId },
    include: { media: true, socialLinks: true, services: true, products: true, promotions: true },
  });
  if (!business) throw new HttpError(404, "No business profile yet");
  res.json(business);
}

export async function getPublic(req: Request, res: Response) {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    include: { media: true, socialLinks: true, services: true, products: true },
  });
  if (!business || business.status !== "APPROVED") throw new HttpError(404, "Business not found");
  res.json(business);
}

export async function update(req: Request, res: Response) {
  await loadOwnedBusiness(req.params.id, req.user!.userId, req.user!.role);
  const data = updateSchema.parse(req.body);

  const merged = { ...(await prisma.business.findUniqueOrThrow({ where: { id: req.params.id } })), ...data };
  const business = await prisma.business.update({
    where: { id: req.params.id },
    data: { ...data, profileCompletionPercent: computeCompletionPercent(merged) },
  });
  res.json(business);
}

export async function submit(req: Request, res: Response) {
  const business = await loadOwnedBusiness(req.params.id, req.user!.userId, req.user!.role);
  if (business.profileCompletionPercent < 100) {
    throw new HttpError(400, "Complete all required fields before submitting");
  }
  const updated = await prisma.business.update({ where: { id: req.params.id }, data: { status: "PENDING" } });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  await loadOwnedBusiness(req.params.id, req.user!.userId, req.user!.role);
  await prisma.business.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
