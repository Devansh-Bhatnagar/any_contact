import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

export async function listPendingVerifications(req: Request, res: Response) {
  const status = req.query.status as string | undefined;

  const whereClause: Record<string, unknown> = {};
  if (status === "PENDING" || !status) {
    whereClause.verificationRequested = true;
  } else if (status === "VERIFIED") {
    whereClause.verified = true;
  }

  const businesses = await prisma.business.findMany({
    where: whereClause,
    select: {
      id: true,
      companyName: true,
      ownerName: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      area: true,
      pincode: true,
      googleMapsUrl: true,
      verified: true,
      verificationRequested: true,
      verificationNotes: true,
      verificationRequestedAt: true,
      verifiedAt: true,
      createdAt: true,
    },
    orderBy: { verificationRequestedAt: "desc" },
  });

  res.json({
    count: businesses.length,
    businesses,
  });
}

export async function verifyBusiness(req: Request, res: Response) {
  const adminId = req.user!.userId;
  const { id } = req.params;

  const schema = z.object({
    verified: z.boolean(),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const business = await prisma.business.findUnique({
    where: { id },
  });
  if (!business) {
    throw new HttpError(404, "Business not found");
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      verified: data.verified,
      verificationRequested: false, // Close open request
      verificationNotes: data.notes || (data.verified ? "Approved by Admin" : "Rejected by Admin"),
      verifiedAt: data.verified ? new Date() : null,
      verifiedByAdminId: data.verified ? adminId : null,
    },
  });

  // Notify business owner
  await prisma.notification.create({
    data: {
      userId: updated.ownerId,
      type: data.verified ? "SUCCESS" : "WARNING",
      title: data.verified ? "🎉 Business Verification Approved!" : "Business Verification Update",
      message: data.verified
        ? `Congratulations! ${updated.companyName} is now officially verified and displays the Verified badge to all customers.`
        : `Your verification request for ${updated.companyName} was not approved. Note: ${data.notes || "Please check your profile details."}`,
    },
  });

  res.json({
    id: updated.id,
    companyName: updated.companyName,
    verified: updated.verified,
    verificationRequested: updated.verificationRequested,
    verificationNotes: updated.verificationNotes,
    verifiedAt: updated.verifiedAt,
  });
}
