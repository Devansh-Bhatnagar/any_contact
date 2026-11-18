import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

const platformSchema = z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "TWITTER"]);
const upsertSchema = z.object({
  links: z.array(z.object({ platform: platformSchema, url: z.string().url() })),
});

async function assertOwner(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this business");
}

export async function upsert(req: Request, res: Response) {
  await assertOwner(req.params.businessId, req.user!.userId, req.user!.role);
  const { links } = upsertSchema.parse(req.body);

  const results = await prisma.$transaction(
    links.map((link) =>
      prisma.socialLink.upsert({
        where: { businessId_platform: { businessId: req.params.businessId, platform: link.platform } },
        create: { businessId: req.params.businessId, platform: link.platform, url: link.url },
        update: { url: link.url },
      })
    )
  );
  res.json(results);
}

export async function list(req: Request, res: Response) {
  const links = await prisma.socialLink.findMany({ where: { businessId: req.params.businessId } });
  res.json(links);
}
