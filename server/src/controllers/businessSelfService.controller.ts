import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { calculateOpenStatus } from "../utils/businessHours";
import {
  ALLOWED_STATUS_DURATIONS,
  calculateStatusExpiry,
  StatusDurationOption,
} from "../utils/statusDuration";

const workingHoursSchema = z.record(
  z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM"),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM"),
    isClosed: z.boolean().optional(),
  })
).optional();

const updateProfileSchema = z.object({
  companyName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  statusLine: z.string().nullable().optional(),
  googleMapsUrl: z.string().url("Must be valid URL").nullable().optional(),
  quickReplies: z.array(z.string()).nullable().optional(),
  manualStatus: z.enum(["AUTO", "OPEN", "CLOSED"]).optional(),
  workingHours: workingHoursSchema,
});

const postStatusSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  duration: z.enum(ALLOWED_STATUS_DURATIONS as [StatusDurationOption, ...StatusDurationOption[]]).default("1_DAY"),
  offerBadge: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  gradientStart: z.string().default("#00236F"),
  gradientEnd: z.string().default("#0051D5"),
});

const specialOfferSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  discountCode: z.string().nullable().optional(),
  discountPercent: z.number().int().min(1).max(100).nullable().optional(),
  offerBadge: z.string().min(1, "Offer badge is required (e.g. 50% OFF, 1+1 FREE)"),
  bannerUrl: z.string().nullable().optional(),
  startDate: z.string().datetime("Must be ISO datetime"),
  endDate: z.string().datetime("Must be ISO datetime"),
});

async function getOwnedBusiness(userId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    include: {
      statusStories: {
        where: { isActive: true, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
      specialOffers: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!business) {
    throw new HttpError(404, "No business profile registered under your account");
  }
  return business;
}

export async function getSelfProfile(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const openStatus = calculateOpenStatus(business.workingHours, business.manualStatus);

  res.json({
    ...business,
    openStatus,
  });
}

export async function updateSelfProfile(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const data = updateProfileSchema.parse(req.body);

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      ...data,
      workingHours: data.workingHours ? (data.workingHours as object) : undefined,
      quickReplies: data.quickReplies ? (data.quickReplies as object) : undefined,
    },
  });

  const openStatus = calculateOpenStatus(updated.workingHours, updated.manualStatus);

  // If manualStatus or workingHours changed, trigger background notification to opted-in customers
  if (data.manualStatus && updated.area) {
    try {
      const customers = await prisma.customerNotificationPreference.findMany({
        where: { area: updated.area, openCloseAlertsEnabled: true },
        select: { userId: true },
      });
      if (customers.length > 0) {
        await prisma.notification.createMany({
          data: customers.map((c) => ({
            userId: c.userId,
            type: "INFO",
            title: `${updated.companyName} is now ${openStatus.statusText}`,
            message: `Working hours update: ${updated.companyName} is currently ${openStatus.statusText} (${openStatus.todayHours}).`,
          })),
        });
        await prisma.areaNotificationLog.create({
          data: {
            businessId: updated.id,
            area: updated.area,
            type: "OPEN_CLOSE",
            title: `${updated.companyName} Status: ${openStatus.statusText}`,
            message: `Updated to ${openStatus.statusText}`,
            recipientCount: customers.length,
          },
        });
      }
    } catch {
      // Background notifications are fire-and-forget
    }
  }

  res.json({
    ...updated,
    openStatus,
  });
}

export async function updateWorkingHours(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const schema = z.object({
    workingHours: workingHoursSchema.optional(),
    manualStatus: z.enum(["AUTO", "OPEN", "CLOSED"]).optional(),
  });
  const data = schema.parse(req.body);

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      workingHours: data.workingHours ? (data.workingHours as object) : undefined,
      manualStatus: data.manualStatus,
    },
  });

  const openStatus = calculateOpenStatus(updated.workingHours, updated.manualStatus);
  res.json({
    id: updated.id,
    workingHours: updated.workingHours,
    manualStatus: updated.manualStatus,
    openStatus,
  });
}

export async function postStatus(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const data = postStatusSchema.parse(req.body);

  const expiresAt = calculateStatusExpiry(data.duration);

  const status = await prisma.statusStory.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      offerBadge: data.offerBadge,
      price: data.price,
      imageUrl: data.imageUrl,
      gradientStart: data.gradientStart,
      gradientEnd: data.gradientEnd,
      duration: data.duration,
      expiresAt,
      isActive: true,
    },
  });

  // Background area notification dispatch for status update
  if (business.area) {
    try {
      const customers = await prisma.customerNotificationPreference.findMany({
        where: { area: business.area, statusUpdatesEnabled: true },
        select: { userId: true },
      });
      if (customers.length > 0) {
        await prisma.notification.createMany({
          data: customers.map((c) => ({
            userId: c.userId,
            type: "INFO",
            title: `New Status from ${business.companyName}`,
            message: `${data.title} - active in ${business.area}.`,
          })),
        });
        await prisma.areaNotificationLog.create({
          data: {
            businessId: business.id,
            area: business.area,
            type: "STATUS",
            title: `Status: ${data.title}`,
            message: data.description || "New status update posted",
            recipientCount: customers.length,
          },
        });
      }
    } catch {
      // Fire and forget
    }
  }

  res.status(201).json(status);
}

export async function getMyStatuses(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const now = new Date();

  const statuses = await prisma.statusStory.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  const active = statuses.filter((s) => s.isActive && s.expiresAt > now);
  const expired = statuses.filter((s) => !s.isActive || s.expiresAt <= now);

  res.json({ active, expired });
}

export async function deleteStatus(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const { id } = req.params;

  const status = await prisma.statusStory.findFirst({
    where: { id, businessId: business.id },
  });
  if (!status) {
    throw new HttpError(404, "Status story not found");
  }

  await prisma.statusStory.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(204).send();
}

export async function requestVerification(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const schema = z.object({
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      verificationRequested: true,
      verificationNotes: data.notes || "Requested official verified badge",
      verificationRequestedAt: new Date(),
    },
  });

  res.json({
    id: updated.id,
    companyName: updated.companyName,
    verified: updated.verified,
    verificationRequested: updated.verificationRequested,
    verificationRequestedAt: updated.verificationRequestedAt,
    message: "Verification request submitted for admin review",
  });
}

export async function getVerificationStatus(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  res.json({
    id: business.id,
    companyName: business.companyName,
    verified: business.verified,
    verificationRequested: business.verificationRequested,
    verificationNotes: business.verificationNotes,
    verificationRequestedAt: business.verificationRequestedAt,
    verifiedAt: business.verifiedAt,
  });
}

export async function createSpecialOffer(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const data = specialOfferSchema.parse(req.body);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (end <= start) {
    throw new HttpError(400, "Offer endDate must be after startDate");
  }

  const offer = await prisma.specialOffer.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      discountCode: data.discountCode,
      discountPercent: data.discountPercent,
      offerBadge: data.offerBadge,
      bannerUrl: data.bannerUrl,
      startDate: start,
      endDate: end,
      isActive: true,
    },
  });

  // Background area notification dispatch for new special offer
  if (business.area) {
    try {
      const customers = await prisma.customerNotificationPreference.findMany({
        where: { area: business.area, offersEnabled: true },
        select: { userId: true },
      });
      if (customers.length > 0) {
        await prisma.notification.createMany({
          data: customers.map((c) => ({
            userId: c.userId,
            type: "INFO",
            title: `🔥 Special Offer from ${business.companyName}!`,
            message: `[${data.offerBadge}] ${data.title} is now active in ${business.area}. Check it out!`,
          })),
        });
        await prisma.areaNotificationLog.create({
          data: {
            businessId: business.id,
            area: business.area,
            type: "OFFER",
            title: `Special Offer: ${data.title}`,
            message: `Badge: ${data.offerBadge}`,
            recipientCount: customers.length,
          },
        });
      }
    } catch {
      // Fire and forget
    }
  }

  res.status(201).json(offer);
}

export async function getMySpecialOffers(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const now = new Date();

  const offers = await prisma.specialOffer.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  const active = offers.filter(
    (o) => o.isActive && o.startDate <= now && o.endDate >= now
  );
  const scheduled = offers.filter((o) => o.isActive && o.startDate > now);
  const expired = offers.filter((o) => !o.isActive || o.endDate < now);

  res.json({ active, scheduled, expired, all: offers });
}

export async function updateSpecialOffer(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const { id } = req.params;

  const existing = await prisma.specialOffer.findFirst({
    where: { id, businessId: business.id },
  });
  if (!existing) {
    throw new HttpError(404, "Special offer not found");
  }

  const patchSchema = specialOfferSchema.partial().extend({
    isActive: z.boolean().optional(),
  });
  const data = patchSchema.parse(req.body);

  const updated = await prisma.specialOffer.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  res.json(updated);
}

export async function deleteSpecialOffer(req: Request, res: Response) {
  const business = await getOwnedBusiness(req.user!.userId);
  const { id } = req.params;

  const existing = await prisma.specialOffer.findFirst({
    where: { id, businessId: business.id },
  });
  if (!existing) {
    throw new HttpError(404, "Special offer not found");
  }

  await prisma.specialOffer.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(204).send();
}

