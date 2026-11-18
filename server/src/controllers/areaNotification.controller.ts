import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

export async function getNotificationPreferences(req: Request, res: Response) {
  const userId = req.user!.userId;

  let pref = await prisma.customerNotificationPreference.findUnique({
    where: { userId },
  });

  if (!pref) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { area: true, pincode: true },
    });

    pref = await prisma.customerNotificationPreference.create({
      data: {
        userId,
        area: user?.area || "Indiranagar",
        pincode: user?.pincode || "560038",
        offersEnabled: true,
        statusUpdatesEnabled: true,
        openCloseAlertsEnabled: true,
      },
    });
  }

  res.json(pref);
}

export async function updateNotificationPreferences(req: Request, res: Response) {
  const userId = req.user!.userId;

  const schema = z.object({
    area: z.string().min(1, "Area is required"),
    pincode: z.string().nullable().optional(),
    offersEnabled: z.boolean().optional(),
    statusUpdatesEnabled: z.boolean().optional(),
    openCloseAlertsEnabled: z.boolean().optional(),
  });
  const data = schema.parse(req.body);

  const updated = await prisma.customerNotificationPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      area: data.area,
      pincode: data.pincode,
      offersEnabled: data.offersEnabled ?? true,
      statusUpdatesEnabled: data.statusUpdatesEnabled ?? true,
      openCloseAlertsEnabled: data.openCloseAlertsEnabled ?? true,
    },
  });

  res.json(updated);
}

export async function broadcastAreaNotification(req: Request, res: Response) {
  const userId = req.user!.userId;

  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true, companyName: true, area: true },
  });

  if (!business) {
    throw new HttpError(404, "No business profile registered under your account");
  }

  if (!business.area) {
    throw new HttpError(400, "Please update your business area in your profile before broadcasting");
  }

  const schema = z.object({
    type: z.enum(["OFFER", "STATUS", "OPEN_CLOSE"]),
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
  });
  const data = schema.parse(req.body);

  // Filter customers who opted in to this notification category in this area
  const whereFilter: Record<string, unknown> = {
    area: { equals: business.area, mode: "insensitive" },
  };
  if (data.type === "OFFER") whereFilter.offersEnabled = true;
  if (data.type === "STATUS") whereFilter.statusUpdatesEnabled = true;
  if (data.type === "OPEN_CLOSE") whereFilter.openCloseAlertsEnabled = true;

  const targetCustomers = await prisma.customerNotificationPreference.findMany({
    where: whereFilter,
    select: { userId: true },
  });

  if (targetCustomers.length > 0) {
    await prisma.notification.createMany({
      data: targetCustomers.map((c) => ({
        userId: c.userId,
        type: "INFO",
        title: `[${business.companyName}] ${data.title}`,
        message: data.message,
      })),
    });
  }

  await prisma.areaNotificationLog.create({
    data: {
      businessId: business.id,
      area: business.area,
      type: data.type,
      title: data.title,
      message: data.message,
      recipientCount: targetCustomers.length,
    },
  });

  // STRICT PRIVACY: Return ONLY the aggregate count and area.
  // NEVER return customer list, IDs, names, or phones to the business person.
  res.status(201).json({
    success: true,
    message: "Broadcast notification dispatched to opted-in customers in your area",
    area: business.area,
    type: data.type,
    notifiedCount: targetCustomers.length,
  });
}

export async function cleanupExpired(_req: Request, res: Response) {
  const now = new Date();

  // 1. Deactivate expired status stories
  const expiredStatuses = await prisma.statusStory.updateMany({
    where: {
      isActive: true,
      expiresAt: { lte: now },
    },
    data: { isActive: false },
  });

  // 2. Deactivate expired special offers
  const expiredOffers = await prisma.specialOffer.updateMany({
    where: {
      isActive: true,
      endDate: { lt: now },
    },
    data: { isActive: false },
  });

  // 3. Mark expired call sessions as ENDED
  const expiredCalls = await prisma.maskedCallSession.updateMany({
    where: {
      status: "INITIATED",
      expiresAt: { lte: now },
    },
    data: { status: "ENDED" },
  });

  res.json({
    success: true,
    expiredStatusesDeactivated: expiredStatuses.count,
    expiredOffersDeactivated: expiredOffers.count,
    expiredCallsEnded: expiredCalls.count,
    timestamp: now.toISOString(),
  });
}

