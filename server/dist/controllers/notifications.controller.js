"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const prisma_1 = require("../lib/prisma");
const HttpError_1 = require("../utils/HttpError");
async function list(req, res) {
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
}
async function markRead(req, res) {
    const notification = await prisma_1.prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user.userId) {
        throw new HttpError_1.HttpError(404, "Notification not found");
    }
    const updated = await prisma_1.prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(updated);
}
async function markAllRead(req, res) {
    await prisma_1.prisma.notification.updateMany({ where: { userId: req.user.userId, read: false }, data: { read: true } });
    res.status(204).send();
}
