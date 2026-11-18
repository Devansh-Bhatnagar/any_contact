"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.startOrGetConversation = startOrGetConversation;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.shareLocation = shareLocation;
exports.getCategoryQuickReplies = getCategoryQuickReplies;
exports.initiateMaskedCall = initiateMaskedCall;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
const privacyMask_1 = require("../utils/privacyMask");
const businessHours_1 = require("../utils/businessHours");
async function getConversations(req, res) {
    const userId = req.user.userId;
    // Determine if user is a business owner or customer
    const ownedBusiness = await prisma_1.prisma.business.findFirst({
        where: { ownerId: userId },
        select: { id: true },
    });
    if (ownedBusiness) {
        // Return business inbox with customer privacy masking
        const conversations = await prisma_1.prisma.businessChatConversation.findMany({
            where: { businessId: ownedBusiness.id },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true },
                },
            },
            orderBy: { lastMessageAt: "desc" },
        });
        const formatted = conversations.map((c) => ({
            id: c.id,
            businessId: c.businessId,
            // Customer details strictly masked
            customer: {
                id: c.customer.id,
                displayName: c.customerDisplayName || (0, privacyMask_1.getMaskedCustomerName)(c.customer.name, c.customer.id),
                maskedPhone: (0, privacyMask_1.maskPhoneNumber)(c.customer.phone),
            },
            lastMessageText: c.lastMessageText,
            lastMessageAt: c.lastMessageAt,
            unreadCount: c.businessUnreadCount,
            updatedAt: c.updatedAt,
        }));
        return res.json({ role: "BUSINESS", conversations: formatted });
    }
    // Customer inbox
    const conversations = await prisma_1.prisma.businessChatConversation.findMany({
        where: { customerId: userId },
        include: {
            business: {
                select: {
                    id: true,
                    companyName: true,
                    category: true,
                    area: true,
                    verified: true,
                    statusLine: true,
                    workingHours: true,
                    manualStatus: true,
                },
            },
        },
        orderBy: { lastMessageAt: "desc" },
    });
    const formatted = conversations.map((c) => ({
        id: c.id,
        business: {
            id: c.business.id,
            companyName: c.business.companyName,
            category: c.business.category,
            area: c.business.area,
            verified: c.business.verified,
            statusLine: c.business.statusLine,
            openStatus: (0, businessHours_1.calculateOpenStatus)(c.business.workingHours, c.business.manualStatus),
        },
        lastMessageText: c.lastMessageText,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.customerUnreadCount,
        updatedAt: c.updatedAt,
    }));
    res.json({ role: "CUSTOMER", conversations: formatted });
}
async function startOrGetConversation(req, res) {
    const customerId = req.user.userId;
    const schema = zod_1.z.object({
        businessId: zod_1.z.string().uuid("Invalid business ID"),
    });
    const { businessId } = schema.parse(req.body);
    const business = await prisma_1.prisma.business.findUnique({
        where: { id: businessId },
        select: {
            id: true,
            companyName: true,
            category: true,
            ownerId: true,
            phone: true,
            workingHours: true,
            manualStatus: true,
            verified: true,
            quickReplies: true,
        },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    const customer = await prisma_1.prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true, phone: true },
    });
    const maskedPhone = (0, privacyMask_1.maskPhoneNumber)(customer?.phone);
    const displayName = (0, privacyMask_1.getMaskedCustomerName)(customer?.name, customerId);
    const conversation = await prisma_1.prisma.businessChatConversation.upsert({
        where: {
            businessId_customerId: { businessId, customerId },
        },
        update: {
            customerMaskedPhone: maskedPhone,
            customerDisplayName: displayName,
        },
        create: {
            businessId,
            customerId,
            customerMaskedPhone: maskedPhone,
            customerDisplayName: displayName,
        },
    });
    // Fetch quick replies for when chat opens
    let quickReplies = business.quickReplies;
    if (!quickReplies || quickReplies.length === 0) {
        const defaultReplies = await prisma_1.prisma.categoryQuickReply.findFirst({
            where: { category: { equals: business.category, mode: "insensitive" } },
        });
        quickReplies = defaultReplies
            ? defaultReplies.options
            : [
                "Check availability & pricing",
                "Book appointment / service",
                "Working hours and location",
            ];
    }
    res.json({
        conversationId: conversation.id,
        business: {
            id: business.id,
            companyName: business.companyName,
            category: business.category,
            verified: business.verified,
            openStatus: (0, businessHours_1.calculateOpenStatus)(business.workingHours, business.manualStatus),
        },
        quickReplies,
        customerMaskedPhone: conversation.customerMaskedPhone,
        customerDisplayName: conversation.customerDisplayName,
    });
}
async function getMessages(req, res) {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const conversation = await prisma_1.prisma.businessChatConversation.findUnique({
        where: { id: conversationId },
        include: { business: { select: { ownerId: true } } },
    });
    if (!conversation) {
        throw new HttpError_1.HttpError(404, "Conversation not found");
    }
    // Authorization check
    const isCustomer = conversation.customerId === userId;
    const isBusinessOwner = conversation.business.ownerId === userId;
    if (!isCustomer && !isBusinessOwner && req.user.role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "Access denied to this conversation");
    }
    // Mark unread messages as read
    if (isCustomer && conversation.customerUnreadCount > 0) {
        await prisma_1.prisma.businessChatConversation.update({
            where: { id: conversationId },
            data: { customerUnreadCount: 0 },
        });
    }
    else if (isBusinessOwner && conversation.businessUnreadCount > 0) {
        await prisma_1.prisma.businessChatConversation.update({
            where: { id: conversationId },
            data: { businessUnreadCount: 0 },
        });
    }
    const messages = await prisma_1.prisma.businessChatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });
    res.json({
        conversationId,
        count: messages.length,
        messages: messages.map((m) => ({
            id: m.id,
            senderType: m.senderType,
            messageType: m.messageType,
            text: m.text,
            quickReplyOption: m.quickReplyOption,
            location: m.messageType === "LOCATION"
                ? {
                    latitude: m.latitude,
                    longitude: m.longitude,
                    address: m.locationAddress,
                    mapUrl: m.locationMapUrl,
                }
                : null,
            read: m.read,
            createdAt: m.createdAt,
        })),
    });
}
async function sendMessage(req, res) {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const schema = zod_1.z.object({
        text: zod_1.z.string().min(1, "Message text is required"),
        quickReplyOption: zod_1.z.string().optional(),
    });
    const data = schema.parse(req.body);
    const conversation = await prisma_1.prisma.businessChatConversation.findUnique({
        where: { id: conversationId },
        include: { business: { select: { ownerId: true } } },
    });
    if (!conversation) {
        throw new HttpError_1.HttpError(404, "Conversation not found");
    }
    const isCustomer = conversation.customerId === userId;
    const isBusinessOwner = conversation.business.ownerId === userId;
    if (!isCustomer && !isBusinessOwner && req.user.role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "Not allowed to send messages in this conversation");
    }
    const senderType = isCustomer ? "CUSTOMER" : "BUSINESS";
    const messageType = data.quickReplyOption ? "QUICK_REPLY" : "TEXT";
    const message = await prisma_1.prisma.businessChatMessage.create({
        data: {
            conversationId,
            senderType,
            senderId: userId,
            messageType,
            text: data.text,
            quickReplyOption: data.quickReplyOption,
        },
    });
    await prisma_1.prisma.businessChatConversation.update({
        where: { id: conversationId },
        data: {
            lastMessageText: data.text,
            lastMessageAt: new Date(),
            customerUnreadCount: isBusinessOwner ? { increment: 1 } : undefined,
            businessUnreadCount: isCustomer ? { increment: 1 } : undefined,
        },
    });
    res.status(201).json(message);
}
async function shareLocation(req, res) {
    const customerId = req.user.userId;
    const { conversationId } = req.params;
    const schema = zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        address: zod_1.z.string().min(1, "Address or landmark is required"),
    });
    const data = schema.parse(req.body);
    const conversation = await prisma_1.prisma.businessChatConversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation) {
        throw new HttpError_1.HttpError(404, "Conversation not found");
    }
    if (conversation.customerId !== customerId && req.user.role !== "ADMIN") {
        throw new HttpError_1.HttpError(403, "Only the customer can share their location in this chat");
    }
    const mapUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
    const text = `📍 Shared Location: ${data.address}`;
    const message = await prisma_1.prisma.businessChatMessage.create({
        data: {
            conversationId,
            senderType: "CUSTOMER",
            senderId: customerId,
            messageType: "LOCATION",
            text,
            latitude: data.latitude,
            longitude: data.longitude,
            locationAddress: data.address,
            locationMapUrl: mapUrl,
        },
    });
    await prisma_1.prisma.businessChatConversation.update({
        where: { id: conversationId },
        data: {
            lastMessageText: text,
            lastMessageAt: new Date(),
            businessUnreadCount: { increment: 1 },
        },
    });
    res.status(201).json({
        id: message.id,
        messageType: "LOCATION",
        text,
        location: {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            mapUrl,
        },
        createdAt: message.createdAt,
    });
}
async function getCategoryQuickReplies(req, res) {
    const { id } = req.params;
    const business = await prisma_1.prisma.business.findUnique({
        where: { id },
        select: { category: true, quickReplies: true },
    });
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    // If business has defined custom quick replies, return those
    const customReplies = business.quickReplies;
    if (customReplies && customReplies.length > 0) {
        return res.json({
            category: business.category,
            source: "CUSTOM",
            question: "How can we help you today?",
            options: customReplies,
        });
    }
    // Otherwise check database category quick replies
    const categoryReply = await prisma_1.prisma.categoryQuickReply.findFirst({
        where: { category: { equals: business.category, mode: "insensitive" } },
    });
    if (categoryReply) {
        return res.json({
            category: categoryReply.category,
            source: "CATEGORY_DEFAULT",
            question: categoryReply.questionText,
            options: categoryReply.options,
        });
    }
    // Standard fallback
    res.json({
        category: business.category,
        source: "SYSTEM_DEFAULT",
        question: "What do you want to inquire about?",
        options: [
            "Check pricing and available slots",
            "Request service visit / booking",
            "Ask question about products",
            "Share location for home visit",
        ],
    });
}
async function initiateMaskedCall(req, res) {
    const customerId = req.user.userId;
    const { id: businessId } = req.params;
    const [business, customer] = await Promise.all([
        prisma_1.prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true, companyName: true, phone: true },
        }),
        prisma_1.prisma.user.findUnique({
            where: { id: customerId },
            select: { phone: true, name: true },
        }),
    ]);
    if (!business) {
        throw new HttpError_1.HttpError(404, "Business not found");
    }
    const maskedCallerId = (0, privacyMask_1.generateMaskedCallerId)(customer?.phone);
    const relayToken = `RELAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min session
    const callSession = await prisma_1.prisma.maskedCallSession.create({
        data: {
            businessId,
            customerId,
            maskedCallerId,
            relayToken,
            businessPhone: business.phone || "+91 98765 00000",
            status: "INITIATED",
            expiresAt,
        },
    });
    res.status(201).json({
        sessionId: callSession.id,
        businessId: business.id,
        businessName: business.companyName,
        maskedCallerId: callSession.maskedCallerId,
        relayToken: callSession.relayToken,
        status: callSession.status,
        expiresAt: callSession.expiresAt,
        message: "Masked calling session created. Customer personal number is completely shielded.",
    });
}
