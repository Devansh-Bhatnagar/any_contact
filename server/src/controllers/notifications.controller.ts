import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

export async function list(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifications);
}

export async function markRead(req: Request, res: Response) {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user!.userId) {
    throw new HttpError(404, "Notification not found");
  }
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(updated);
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
  res.status(204).send();
}
