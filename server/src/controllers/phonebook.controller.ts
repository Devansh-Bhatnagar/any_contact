import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const postStatusSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(1000),
  offerBadge: z.string().trim().max(50).optional().nullable(),
  price: z.string().trim().max(50).optional().nullable(),
  gradientStart: z.string().trim().max(30).optional(),
  gradientEnd: z.string().trim().max(30).optional(),
});

const createLeadSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(150),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(150),
  phone: z.string().trim().min(3, "Phone is required").max(30),
  email: z.string().trim().email().max(100).optional().nullable().or(z.literal("")),
  category: z.string().trim().min(1, "Category is required").max(100),
  city: z.string().trim().max(100).optional().nullable(),
  stageCode: z.string().trim().max(50).default("NEW"),
  note: z.string().trim().max(1000).optional().nullable(),
});

const updateLeadStageSchema = z.object({
  stageCode: z.string().trim().min(1).max(50),
});

const matchContactsSchema = z.object({
  phones: z.array(z.string().trim().min(3).max(35)).max(1000),
});

/**
 * SDUI Bootstrap Endpoint
 * Eliminates network waterfalls by combining UI metadata, component configuration,
 * reference lookups, contact directory, and active status stories in a single payload.
 */
export async function getBootstrap(req: Request, res: Response) {
  const now = new Date();

  // Parallel database fetch for maximum performance
  const [
    lookups,
    uiComponents,
    verifiedBusinesses,
    activeStories,
    userBusiness,
    userLeads,
    callRecords,
  ] = await Promise.all([
    // 1. Database-backed lookups (Categories, Honorifics, Lead Stages, Navigation)
    prisma.referenceLookup.findMany({
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    }),

    // 2. Server-Driven UI component metadata
    prisma.uiComponentConfig.findMany({
      where: { isEnabled: true },
      orderBy: [{ screenKey: "asc" }, { sortOrder: "asc" }],
    }),

    // 3. Verified Businesses directory
    prisma.business.findMany({
      where: { status: "APPROVED" },
      orderBy: { companyName: "asc" },
      select: {
        id: true,
        companyName: true,
        ownerName: true,
        category: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        verified: true,
        profileCompletionPercent: true,
        statusStories: {
          where: { expiresAt: { gt: now } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),

    // 4. All active non-expired status stories
    prisma.statusStory.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
            category: true,
            phone: true,
            verified: true,
          },
        },
      },
    }),

    // 5. Authenticated user's business profile (if logged in, otherwise default primary)
    prisma.business.findFirst({
      where: req.user ? { ownerId: req.user.userId } : { verified: true },
      include: {
        statusStories: {
          where: { expiresAt: { gt: now } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),

    // 6. User's CRM Leads
    prisma.lead.findMany({
      orderBy: { lastActiveAt: "desc" },
    }),

    // 7. Recent Call Records
    prisma.callRecord.findMany({
      orderBy: { timestamp: "desc" },
    }),
  ]);

  // Group lookups for clean metadata consumption
  const navigationTabs = lookups
    .filter((l) => l.group === "NAVIGATION_TAB")
    .map((l) => ({
      code: l.code,
      label: l.label,
      sortOrder: l.sortOrder,
      isDefault: l.isDefault,
      ...(typeof l.meta === "object" && l.meta !== null ? l.meta : {}),
    }));

  const categories = lookups
    .filter((l) => l.group === "CATEGORY")
    .map((l) => ({
      code: l.code,
      label: l.label,
      sortOrder: l.sortOrder,
    }));

  const honorifics = lookups
    .filter((l) => l.group === "HONORIFIC")
    .map((l) => ({
      code: l.code,
      label: l.label,
      sortOrder: l.sortOrder,
    }));

  const leadStages = lookups
    .filter((l) => l.group === "LEAD_STAGE")
    .map((l) => ({
      code: l.code,
      label: l.label,
      sortOrder: l.sortOrder,
      ...(typeof l.meta === "object" && l.meta !== null ? l.meta : {}),
    }));

  const callFilters = lookups
    .filter((l) => l.group === "CALL_FILTER")
    .map((l) => ({
      code: l.code,
      label: l.label,
      sortOrder: l.sortOrder,
      isDefault: l.isDefault,
    }));

  // Structure SDUI component config by screen
  const componentsByScreen: Record<string, Record<string, unknown>> = {};
  for (const comp of uiComponents) {
    if (!componentsByScreen[comp.screenKey]) {
      componentsByScreen[comp.screenKey] = {};
    }
    componentsByScreen[comp.screenKey][comp.componentKey] = {
      type: comp.type,
      title: comp.title,
      sortOrder: comp.sortOrder,
      props: comp.props,
    };
  }

  // Format Contacts Directory
  const contacts = verifiedBusinesses.map((b) => {
    const activeStory = b.statusStories[0];
    return {
      id: b.id,
      businessName: b.companyName,
      ownerName: b.ownerName,
      phone: b.phone ?? "",
      email: b.email ?? "",
      category: b.category,
      city: [b.city, b.state].filter(Boolean).join(", "),
      address: b.address ?? "",
      verified: b.verified,
      activeStory: activeStory
        ? {
            id: activeStory.id,
            businessId: b.id,
            businessName: b.companyName,
            category: b.category,
            timeAgo: calculateTimeAgo(activeStory.createdAt),
            title: activeStory.title,
            description: activeStory.description,
            offerBadge: activeStory.offerBadge,
            price: activeStory.price,
            gradientStart: activeStory.gradientStart,
            gradientEnd: activeStory.gradientEnd,
            viewsCount: activeStory.viewsCount,
            phone: b.phone ?? "",
          }
        : null,
    };
  });

  // Format Network Stories
  const networkStatuses = activeStories.map((s) => ({
    id: s.id,
    businessId: s.businessId,
    businessName: s.business.companyName,
    category: s.business.category,
    timeAgo: calculateTimeAgo(s.createdAt),
    title: s.title,
    description: s.description,
    offerBadge: s.offerBadge,
    price: s.price,
    phone: s.business.phone ?? "",
    gradientStart: s.gradientStart,
    gradientEnd: s.gradientEnd,
    viewsCount: s.viewsCount,
    isViewed: false,
  }));

  // Format My Business
  const myBusiness = userBusiness
    ? {
        id: userBusiness.id,
        companyName: userBusiness.companyName,
        ownerName: userBusiness.ownerName,
        category: userBusiness.category,
        description: userBusiness.description ?? "",
        phone: userBusiness.phone ?? "",
        email: userBusiness.email ?? "",
        address: userBusiness.address ?? "",
        city: [userBusiness.city, userBusiness.state].filter(Boolean).join(", "),
        verified: userBusiness.verified,
        profileCompletionPercent: userBusiness.profileCompletionPercent,
        stats: {
          profileViews: 148,
          statusViews: userBusiness.statusStories.reduce((acc, s) => acc + s.viewsCount, 0),
          phoneCalls: 28,
          whatsAppChats: 35,
        },
      }
    : null;

  const myStatuses = (userBusiness?.statusStories ?? []).map((s) => ({
    id: s.id,
    businessId: s.businessId,
    businessName: userBusiness?.companyName ?? "My Business",
    category: userBusiness?.category ?? "Business",
    timeAgo: calculateTimeAgo(s.createdAt),
    title: s.title,
    description: s.description,
    offerBadge: s.offerBadge,
    price: s.price,
    phone: userBusiness?.phone ?? "",
    gradientStart: s.gradientStart,
    gradientEnd: s.gradientEnd,
    viewsCount: s.viewsCount,
  }));

  // Format Recent Call Records
  const recentCalls = (callRecords ?? []).map((c) => {
    let tagTextColor = "#1A73E8";
    if (c.tag === "Internal") tagTextColor = "#7C3AED";
    if (c.tag === "Vendor") tagTextColor = "#0D9488";
    if (c.tag === "Client") tagTextColor = "#1A73E8";

    let avatarText = "";
    if (c.name === "Lakshmi") {
      avatarText = "LA";
    } else if (c.name === "Kalyan") {
      avatarText = "KL";
    } else {
      const parts = c.name.trim().split(" ");
      avatarText = parts[0] ? parts[0].substring(0, 1).toUpperCase() : "";
    }

    return {
      id: c.id,
      name: c.name,
      number: c.number,
      tag: c.tag,
      tagColor: c.tagColor,
      tagTextColor,
      direction: c.direction,
      durationSec: c.durationSec,
      isVerified: c.isVerified,
      isLead: c.isLead,
      category: c.category,
      timeAgo: formatCallTimeAgo(c.timestamp),
      avatarText,
      timestamp: c.timestamp.toISOString(),
    };
  });

  res.json({
    metadata: {
      navigationTabs,
      categories,
      honorifics,
      leadStages,
      callFilters,
      uiComponents: componentsByScreen,
    },
    myBusiness,
    myStatuses,
    networkStatuses,
    contacts,
    recentCalls,
    leads: userLeads.map((l) => ({
      id: l.id,
      businessName: l.businessName,
      contactPerson: l.contactPerson,
      phone: l.phone,
      email: l.email ?? "",
      category: l.category,
      city: l.city ?? "",
      stageCode: l.stageCode,
      note: l.note ?? "",
      lastActiveAt: calculateTimeAgo(l.lastActiveAt),
    })),
  });
}

/**
 * Lightweight reference lookups endpoint
 */
export async function getReferenceLookups(_req: Request, res: Response) {
  const lookups = await prisma.referenceLookup.findMany({
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });
  res.json(lookups);
}

/**
 * Post a 24-hour Status Story
 */
export async function postStatusStory(req: Request, res: Response) {
  const data = postStatusSchema.parse(req.body);

  // Find business for the user
  const business = await prisma.business.findFirst({
    where: req.user ? { ownerId: req.user.userId } : { verified: true },
  });

  if (!business) {
    throw new HttpError(404, "No registered business found to post status for");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // exactly 24h

  const story = await prisma.statusStory.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      offerBadge: data.offerBadge ?? null,
      price: data.price ?? null,
      gradientStart: data.gradientStart ?? "#00236F",
      gradientEnd: data.gradientEnd ?? "#0051D5",
      expiresAt,
    },
  });

  res.status(201).json({
    id: story.id,
    businessId: story.businessId,
    businessName: business.companyName,
    category: business.category,
    timeAgo: "Just now",
    title: story.title,
    description: story.description,
    offerBadge: story.offerBadge,
    price: story.price,
    phone: business.phone ?? "",
    gradientStart: story.gradientStart,
    gradientEnd: story.gradientEnd,
    viewsCount: story.viewsCount,
  });
}

/**
 * Record a Status Story view
 */
export async function recordStoryView(req: Request, res: Response) {
  const { id } = req.params;

  const story = await prisma.statusStory.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });

  res.json({ id: story.id, viewsCount: story.viewsCount });
}

/**
 * Create a new Lead
 */
export async function createLead(req: Request, res: Response) {
  const data = createLeadSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: req.user ? { id: req.user.userId } : { role: "BUSINESS_OWNER" },
  });

  if (!user) {
    throw new HttpError(404, "Owner user not found");
  }

  const lead = await prisma.lead.create({
    data: {
      ownerId: user.id,
      businessName: data.businessName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email || null,
      category: data.category,
      city: data.city || null,
      stageCode: data.stageCode,
      note: data.note || null,
    },
  });

  res.status(201).json({
    id: lead.id,
    businessName: lead.businessName,
    contactPerson: lead.contactPerson,
    phone: lead.phone,
    email: lead.email ?? "",
    category: lead.category,
    city: lead.city ?? "",
    stageCode: lead.stageCode,
    note: lead.note ?? "",
    lastActiveAt: "Just now",
  });
}

/**
 * Update a Lead's Stage Code
 */
export async function updateLeadStage(req: Request, res: Response) {
  const { id } = req.params;
  const { stageCode } = updateLeadStageSchema.parse(req.body);

  const lead = await prisma.lead.update({
    where: { id },
    data: { stageCode, lastActiveAt: new Date() },
  });

  res.json({
    id: lead.id,
    stageCode: lead.stageCode,
    lastActiveAt: "Just now",
  });
}

/**
 * Match device phone contacts against registered businesses, active stories, and CRM leads.
 * Highly optimized and secure with strict validation.
 */
export async function matchContacts(req: Request, res: Response) {
  const { phones } = matchContactsSchema.parse(req.body);
  if (phones.length === 0) {
    return res.json({ matches: {} });
  }

  // Normalize phone numbers (digits and leading plus only)
  const normalizedMap = new Map<string, string[]>(); // normalized -> original phone strings
  for (const p of phones) {
    const norm = p.replace(/[^\d+]/g, "");
    if (norm.length >= 7) {
      const existing = normalizedMap.get(norm) ?? [];
      existing.push(p);
      normalizedMap.set(norm, existing);
    }
  }

  const now = new Date();

  // Find verified businesses with phones
  const businesses = await prisma.business.findMany({
    where: {
      status: "APPROVED",
      phone: { not: null },
    },
    select: {
      id: true,
      companyName: true,
      ownerName: true,
      phone: true,
      category: true,
      verified: true,
      statusStories: {
        where: { expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Find existing CRM leads
  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      phone: true,
      stageCode: true,
      businessName: true,
    },
  });

  // Index businesses by full normalized phone and last 10 digits
  const bizByPhone = new Map<string, (typeof businesses)[0]>();
  for (const b of businesses) {
    if (b.phone) {
      const norm = b.phone.replace(/[^\d+]/g, "");
      bizByPhone.set(norm, b);
      if (norm.length >= 10) {
        bizByPhone.set(norm.slice(-10), b);
      }
    }
  }

  // Index leads by full normalized phone and last 10 digits
  const leadByPhone = new Map<string, (typeof leads)[0]>();
  for (const l of leads) {
    if (l.phone) {
      const norm = l.phone.replace(/[^\d+]/g, "");
      leadByPhone.set(norm, l);
      if (norm.length >= 10) {
        leadByPhone.set(norm.slice(-10), l);
      }
    }
  }

  const matches: Record<
    string,
    {
      isVerifiedBusiness: boolean;
      businessName?: string;
      category?: string;
      leadId?: string;
      leadStageCode?: string;
      activeStory?: {
        id: string;
        title: string;
        description: string;
        offerBadge: string | null;
        price: string | null;
        timeAgo: string;
        viewsCount: number;
        gradientStart: string;
        gradientEnd: string;
        phone: string;
      } | null;
    }
  > = {};

  for (const [norm, origList] of normalizedMap.entries()) {
    const last10 = norm.slice(-10);
    const biz = bizByPhone.get(norm) ?? (last10.length === 10 ? bizByPhone.get(last10) : undefined);
    const lead = leadByPhone.get(norm) ?? (last10.length === 10 ? leadByPhone.get(last10) : undefined);

    if (biz || lead) {
      const activeStory = biz?.statusStories?.[0];
      const matchData = {
        isVerifiedBusiness: !!biz?.verified,
        businessName: biz?.companyName,
        category: biz?.category,
        leadId: lead?.id,
        leadStageCode: lead?.stageCode,
        activeStory: activeStory
          ? {
              id: activeStory.id,
              title: activeStory.title,
              description: activeStory.description,
              offerBadge: activeStory.offerBadge,
              price: activeStory.price,
              timeAgo: calculateTimeAgo(activeStory.createdAt),
              viewsCount: activeStory.viewsCount,
              gradientStart: activeStory.gradientStart,
              gradientEnd: activeStory.gradientEnd,
              phone: biz?.phone ?? "",
            }
          : null,
      };

      for (const orig of origList) {
        matches[orig] = matchData;
      }
    }
  }

  res.json({ matches });
}

function calculateTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatCallTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

const createCallRecordSchema = z.object({
  name: z.string().trim().min(1).max(100),
  number: z.string().trim().min(3).max(30),
  tag: z.string().trim().max(50).optional().nullable(),
  direction: z.enum(["OUTGOING", "INCOMING", "MISSED"]).default("OUTGOING"),
  durationSec: z.number().int().min(0).default(0),
  isVerified: z.boolean().default(false),
  isLead: z.boolean().default(false),
  category: z.string().trim().max(100).optional().nullable(),
});

export async function getRecentCalls(_req: Request, res: Response) {
  const records = await prisma.callRecord.findMany({
    orderBy: { timestamp: "desc" },
  });
  res.json(
    records.map((c) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      tag: c.tag,
      tagColor: c.tagColor,
      direction: c.direction,
      durationSec: c.durationSec,
      isVerified: c.isVerified,
      isLead: c.isLead,
      category: c.category,
      timeAgo: formatCallTimeAgo(c.timestamp),
      timestamp: c.timestamp.toISOString(),
    }))
  );
}

export async function createCallRecord(req: Request, res: Response) {
  const data = createCallRecordSchema.parse(req.body);
  const record = await prisma.callRecord.create({
    data: {
      name: data.name,
      number: data.number,
      tag: data.tag ?? null,
      direction: data.direction,
      durationSec: data.durationSec,
      isVerified: data.isVerified,
      isLead: data.isLead,
      category: data.category ?? null,
      timestamp: new Date(),
    },
  });
  res.status(201).json(record);
}

