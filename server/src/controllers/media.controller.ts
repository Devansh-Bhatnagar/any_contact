import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { deleteFileByUrl, fileUrl } from "../middleware/upload";

const mediaTypeSchema = z.enum(["LOGO", "COVER", "GALLERY"]);
const MAX_GALLERY_IMAGES = 10;

async function assertOwner(businessId: string, userId: string, role: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, "Business not found");
  if (business.ownerId !== userId && role !== "ADMIN") throw new HttpError(403, "You do not own this business");
}

export async function upload(req: Request, res: Response) {
  await assertOwner(req.params.businessId, req.user!.userId, req.user!.role);

  if (!req.file) throw new HttpError(400, "No file uploaded");
  const type = mediaTypeSchema.parse(req.body.type);

  if (type === "GALLERY") {
    const count = await prisma.businessMedia.count({ where: { businessId: req.params.businessId, type: "GALLERY" } });
    if (count >= MAX_GALLERY_IMAGES) {
      throw new HttpError(400, `Gallery is limited to ${MAX_GALLERY_IMAGES} images`);
    }
  } else {
    // A business has exactly one active logo/cover — replace whatever was there before.
    const previous = await prisma.businessMedia.findMany({
      where: { businessId: req.params.businessId, type },
    });
    await prisma.businessMedia.deleteMany({ where: { businessId: req.params.businessId, type } });
    await Promise.all(previous.map((p) => deleteFileByUrl(p.url)));
  }

  const media = await prisma.businessMedia.create({
    data: { businessId: req.params.businessId, type, url: fileUrl(req.file.filename) },
  });
  res.status(201).json(media);
}

export async function list(req: Request, res: Response) {
  const media = await prisma.businessMedia.findMany({ where: { businessId: req.params.businessId } });
  res.json(media);
}

export async function remove(req: Request, res: Response) {
  const media = await prisma.businessMedia.findUnique({ where: { id: req.params.mediaId } });
  if (!media) throw new HttpError(404, "Media not found");
  await assertOwner(media.businessId, req.user!.userId, req.user!.role);
  await prisma.businessMedia.delete({ where: { id: req.params.mediaId } });
  await deleteFileByUrl(media.url);
  res.status(204).send();
}
