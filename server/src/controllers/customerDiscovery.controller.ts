import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { calculateOpenStatus } from "../utils/businessHours";
import { maskPhoneNumber, getMaskedCustomerName } from "../utils/privacyMask";

export async function getNearbyGroupedBusinesses(req: Request, res: Response) {
  const userId = req.user?.userId;
  const areaQuery = req.query.area as string | undefined;
  const pincodeQuery = req.query.pincode as string | undefined;

  // If user is authenticated and didn't specify query, check their preferred area
  let targetArea = areaQuery;
  let targetPincode = pincodeQuery;

  if (userId && !targetArea && !targetPincode) {
    const pref = await prisma.customerNotificationPreference.findUnique({
      where: { userId },
    });
    if (pref) {
      targetArea = pref.area;
      targetPincode = pref.pincode || undefined;
    }
  }

  // Filter approved businesses
  const whereClause: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (targetArea) {
    whereClause.area = { equals: targetArea, mode: "insensitive" };
  } else if (targetPincode) {
    whereClause.pincode = { equals: targetPincode };
  }

  const businesses = await prisma.business.findMany({
    where: whereClause,
    include: {
      reviews: {
        select: { rating: true },
      },
      specialOffers: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: { id: true, title: true, offerBadge: true },
      },
      statusStories: {
        where: { isActive: true, expiresAt: { gt: new Date() } },
        select: { id: true, title: true, expiresAt: true },
        take: 1,
      },
    },
    orderBy: { companyName: "asc" },
  });

  // Check if user has custom ordering
  let customOrderMap: Record<string, number> = {};
  let favoritesSet = new Set<string>();

  if (userId) {
    const [orders, favs] = await Promise.all([
      prisma.customerBusinessOrder.findMany({
        where: { userId },
        select: { businessId: true, customOrder: true },
      }),
      prisma.businessFavorite.findMany({
        where: { userId },
        select: { businessId: true },
      }),
    ]);
    for (const o of orders) customOrderMap[o.businessId] = o.customOrder;
    for (const f of favs) favoritesSet.add(f.businessId);
  }

  // Map and sort
  const formatted = businesses.map((b) => {
    const ratings = b.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
        : 0;

    const openStatus = calculateOpenStatus(b.workingHours, b.manualStatus);

    return {
      id: b.id,
      companyName: b.companyName,
      ownerName: b.ownerName,
      category: b.category,
      description: b.description,
      area: b.area,
      pincode: b.pincode,
      city: b.city,
      address: b.address,
      statusLine: b.statusLine,
      googleMapsUrl: b.googleMapsUrl,
      verified: b.verified,
      openStatus,
      rating: avgRating,
      reviewCount: ratings.length,
      activeOffersCount: b.specialOffers.length,
      activeStatus: b.statusStories[0] || null,
      isFavorite: favoritesSet.has(b.id),
      customOrder: customOrderMap[b.id] ?? 9999,
      maskedPhone: maskPhoneNumber(b.phone),
    };
  });

  // Sort by customOrder first (if present), then alphabetical
  formatted.sort((a, b) => {
    if (a.customOrder !== b.customOrder) {
      return a.customOrder - b.customOrder;
    }
    return a.companyName.localeCompare(b.companyName);
  });

  // Group category-wise
  const categoryGroups: Record<string, typeof formatted> = {};
  for (const item of formatted) {
    if (!categoryGroups[item.category]) {
      categoryGroups[item.category] = [];
    }
    categoryGroups[item.category].push(item);
  }

  res.json({
    filter: { area: targetArea || "ALL", pincode: targetPincode || null },
    totalCount: formatted.length,
    categories: Object.keys(categoryGroups).map((cat) => ({
      category: cat,
      count: categoryGroups[cat].length,
      businesses: categoryGroups[cat],
    })),
    flatList: formatted,
  });
}

export async function searchBusinesses(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim();
  const area = (req.query.area as string | undefined)?.trim();
  const pincode = (req.query.pincode as string | undefined)?.trim();
  const category = (req.query.category as string | undefined)?.trim();

  const whereClause: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (q) {
    const terms = [q];
    if (q.toLowerCase().endsWith("er") && q.length > 4) {
      terms.push(q.slice(0, -2) + "ing");
      terms.push(q.slice(0, -2));
    } else if (q.toLowerCase().endsWith("ing") && q.length > 5) {
      terms.push(q.slice(0, -3) + "er");
      terms.push(q.slice(0, -3));
    }

    whereClause.OR = terms.flatMap((term) => [
      { companyName: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { statusLine: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
      { area: { contains: term, mode: "insensitive" } },
    ]);
  }

  if (area) {
    whereClause.area = { contains: area, mode: "insensitive" };
  }
  if (pincode) {
    whereClause.pincode = { equals: pincode };
  }
  if (category) {
    whereClause.category = { contains: category, mode: "insensitive" };
  }

  const results = await prisma.business.findMany({
    where: whereClause,
    include: {
      reviews: { select: { rating: true } },
      specialOffers: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: { id: true, title: true, offerBadge: true },
      },
    },
    orderBy: { companyName: "asc" },
  });

  const formatted = results.map((b) => {
    const ratings = b.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
        : 0;

    return {
      id: b.id,
      companyName: b.companyName,
      category: b.category,
      area: b.area,
      pincode: b.pincode,
      city: b.city,
      statusLine: b.statusLine,
      googleMapsUrl: b.googleMapsUrl,
      verified: b.verified,
      openStatus: calculateOpenStatus(b.workingHours, b.manualStatus),
      rating: avgRating,
      reviewCount: ratings.length,
      activeOffersCount: b.specialOffers.length,
      maskedPhone: maskPhoneNumber(b.phone),
    };
  });

  res.json({
    query: { q, area, pincode, category },
    count: formatted.length,
    results: formatted,
  });
}

export async function getActiveSpecialOffers(req: Request, res: Response) {
  const area = req.query.area as string | undefined;
  const now = new Date();

  const offers = await prisma.specialOffer.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      business: {
        status: "APPROVED",
        ...(area ? { area: { equals: area, mode: "insensitive" } } : {}),
      },
    },
    include: {
      business: {
        select: {
          id: true,
          companyName: true,
          category: true,
          area: true,
          pincode: true,
          verified: true,
          googleMapsUrl: true,
          workingHours: true,
          manualStatus: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    offerBadge: o.offerBadge,
    discountCode: o.discountCode,
    discountPercent: o.discountPercent,
    bannerUrl: o.bannerUrl,
    startDate: o.startDate,
    endDate: o.endDate,
    business: {
      id: o.business.id,
      companyName: o.business.companyName,
      category: o.business.category,
      area: o.business.area,
      pincode: o.business.pincode,
      verified: o.business.verified,
      googleMapsUrl: o.business.googleMapsUrl,
      openStatus: calculateOpenStatus(o.business.workingHours, o.business.manualStatus),
      maskedPhone: maskPhoneNumber(o.business.phone),
    },
  }));

  res.json({ count: formatted.length, offers: formatted });
}

export async function getBusinessDetails(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;
  const now = new Date();

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      specialOffers: {
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      },
      statusStories: {
        where: { isActive: true, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!business || business.status !== "APPROVED") {
    throw new HttpError(404, "Business not found or not approved");
  }

  let isFavorite = false;
  if (userId) {
    const fav = await prisma.businessFavorite.findUnique({
      where: { userId_businessId: { userId, businessId: id } },
    });
    isFavorite = !!fav;
  }

  const ratings = business.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
      : 0;

  const openStatus = calculateOpenStatus(business.workingHours, business.manualStatus);

  // Category default quick replies if business has not defined custom quickReplies
  let quickReplies = business.quickReplies as string[] | null;
  if (!quickReplies || quickReplies.length === 0) {
    const defaultReplies = await prisma.categoryQuickReply.findFirst({
      where: { category: { equals: business.category, mode: "insensitive" } },
    });
    quickReplies = defaultReplies ? (defaultReplies.options as string[]) : [
      "Check availability & pricing",
      "Request service appointment",
      "Working hours and location",
    ];
  }

  res.json({
    id: business.id,
    companyName: business.companyName,
    ownerName: business.ownerName,
    category: business.category,
    description: business.description,
    address: business.address,
    city: business.city,
    state: business.state,
    area: business.area,
    pincode: business.pincode,
    statusLine: business.statusLine,
    googleMapsUrl: business.googleMapsUrl,
    verified: business.verified,
    openStatus,
    workingHours: business.workingHours,
    rating: avgRating,
    reviewCount: ratings.length,
    reviews: business.reviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      businessReply: r.businessReply,
      repliedAt: r.repliedAt,
      createdAt: r.createdAt,
    })),
    specialOffers: business.specialOffers,
    activeStatuses: business.statusStories,
    quickReplies,
    isFavorite,
    maskedPhone: maskPhoneNumber(business.phone),
  });
}

export async function getSharePayload(req: Request, res: Response) {
  const { id } = req.params;
  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      category: true,
      area: true,
      city: true,
      statusLine: true,
      googleMapsUrl: true,
      verified: true,
    },
  });

  if (!business) {
    throw new HttpError(404, "Business not found");
  }

  const shareUrl = `https://leadsphonebook.com/b/${business.id}`;
  const shareText = `Check out ${business.companyName} (${business.category}) in ${business.area || business.city || "your area"}${business.verified ? " [Verified]" : ""} on Leads Phone Book: ${shareUrl}`;

  res.json({
    businessId: business.id,
    companyName: business.companyName,
    shareUrl,
    shareText,
    googleMapsUrl: business.googleMapsUrl,
  });
}

export async function getFavorites(req: Request, res: Response) {
  const userId = req.user!.userId;
  const favorites = await prisma.businessFavorite.findMany({
    where: { userId },
    include: {
      business: {
        include: {
          reviews: { select: { rating: true } },
          specialOffers: {
            where: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = favorites.map((f) => {
    const b = f.business;
    const ratings = b.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
        : 0;

    return {
      id: b.id,
      companyName: b.companyName,
      category: b.category,
      area: b.area,
      pincode: b.pincode,
      statusLine: b.statusLine,
      googleMapsUrl: b.googleMapsUrl,
      verified: b.verified,
      openStatus: calculateOpenStatus(b.workingHours, b.manualStatus),
      rating: avgRating,
      reviewCount: ratings.length,
      activeOffersCount: b.specialOffers.length,
      favoritedAt: f.createdAt,
      maskedPhone: maskPhoneNumber(b.phone),
    };
  });

  res.json({ count: formatted.length, favorites: formatted });
}

export async function addFavorite(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { businessId } = req.params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business) {
    throw new HttpError(404, "Business not found");
  }

  await prisma.businessFavorite.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: {},
    create: { userId, businessId },
  });

  res.status(201).json({ success: true, message: "Added to favorites", businessId });
}

export async function removeFavorite(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { businessId } = req.params;

  await prisma.businessFavorite.deleteMany({
    where: { userId, businessId },
  });

  res.status(204).send();
}

export async function getSavedListOrder(req: Request, res: Response) {
  const userId = req.user!.userId;
  const orders = await prisma.customerBusinessOrder.findMany({
    where: { userId },
    orderBy: { customOrder: "asc" },
  });

  res.json(orders);
}

export async function saveListOrder(req: Request, res: Response) {
  const userId = req.user!.userId;
  const schema = z.object({
    businessIds: z.array(z.string().uuid()).min(1),
  });
  const { businessIds } = schema.parse(req.body);

  await prisma.$transaction(
    businessIds.map((bId, idx) =>
      prisma.customerBusinessOrder.upsert({
        where: { userId_businessId: { userId, businessId: bId } },
        update: { customOrder: idx },
        create: { userId, businessId: bId, customOrder: idx },
      })
    )
  );

  res.json({ success: true, message: "List order saved successfully", orderCount: businessIds.length });
}

export async function getBusinessReviews(req: Request, res: Response) {
  const { id } = req.params;
  const reviews = await prisma.businessReview.findMany({
    where: { businessId: id },
    orderBy: { createdAt: "desc" },
  });

  const ratings = reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? parseFloat((ratings.reduce((acc, r) => acc + r, 0) / ratings.length).toFixed(1))
      : 0;

  res.json({
    rating: avgRating,
    reviewCount: reviews.length,
    reviews: reviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      businessReply: r.businessReply,
      repliedAt: r.repliedAt,
      createdAt: r.createdAt,
    })),
  });
}

export async function addBusinessReview(req: Request, res: Response) {
  const customerId = req.user!.userId;
  const { id: businessId } = req.params;

  const schema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1, "Comment is required"),
  });
  const data = schema.parse(req.body);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business) {
    throw new HttpError(404, "Business not found");
  }

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { name: true },
  });

  // Strict Privacy: Generate masked customer name so customer's personal identity is protected
  const maskedName = getMaskedCustomerName(customer?.name, customerId);

  const review = await prisma.businessReview.create({
    data: {
      businessId,
      customerId,
      customerName: maskedName,
      rating: data.rating,
      comment: data.comment,
    },
  });

  res.status(201).json(review);
}

export async function replyToReview(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { reviewId } = req.params;

  const schema = z.object({
    reply: z.string().min(1, "Reply is required"),
  });
  const { reply } = schema.parse(req.body);

  const review = await prisma.businessReview.findUnique({
    where: { id: reviewId },
    include: { business: { select: { ownerId: true } } },
  });

  if (!review) {
    throw new HttpError(404, "Review not found");
  }

  // Only the business owner (or an admin) can reply to this review
  if (review.business.ownerId !== userId && req.user!.role !== "ADMIN") {
    throw new HttpError(403, "You can only reply to reviews on your own business");
  }

  const updated = await prisma.businessReview.update({
    where: { id: reviewId },
    data: {
      businessReply: reply,
      repliedAt: new Date(),
    },
  });

  res.json(updated);
}
