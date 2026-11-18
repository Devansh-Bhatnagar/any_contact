"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPendingVerifications = listPendingVerifications;
exports.verifyBusiness = verifyBusiness;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
async function listPendingVerifications(req, res) {
    const status = req.query.status;
    const whereClause = {};
    if (status === "PENDING" || !status) {
        whereClause.verificationRequested = true;
    }
    else if (status === "VERIFIED") {
        whereClause.verified = true;
    }
    const businesses = await prisma_1.prisma.business.findMany({
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
async function verifyBusiness(req, res) {
    const adminId = req.user.userId;
    const { id } = req.params;
    const schema = zod_1.z.object({
        verified: zod_1.z.boolean(),
        notes: zod_1.z.string().optional(),
    });
    const data = schema.parse(req.body);
    const business = await prisma_1.prisma.business.findUnique({
        where: { id },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    const updated = await prisma_1.prisma.business.update({
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
    await prisma_1.prisma.notification.create({
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
