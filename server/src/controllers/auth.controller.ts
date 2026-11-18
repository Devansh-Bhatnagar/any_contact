import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { HttpError } from "../utils/HttpError";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function issueTokens(userId: string, role: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN") {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });
  await prisma.user.update({ where: { id: userId }, data: { refreshToken } });
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: "BUSINESS_OWNER" },
  });

  const tokens = await issueTokens(user.id, user.role);
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.suspended) throw new HttpError(403, "This account has been suspended");

  const tokens = await issueTokens(user.id, user.role);
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new HttpError(401, "Refresh token no longer valid");
  }

  const tokens = await issueTokens(user.id, user.role);
  res.json(tokens);
}

export async function logout(req: Request, res: Response) {
  await prisma.user.update({ where: { id: req.user!.userId }, data: { refreshToken: null } });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond 204 so this endpoint can't be used to enumerate registered emails.
  if (!user) {
    res.status(204).send();
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  // No email transport is configured yet; log the link so it can be tested locally.
  console.log(`Password reset requested for ${email}: token=${resetToken}`);
  res.status(204).send();
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = z
    .object({ token: z.string(), password: z.string().min(8) })
    .parse(req.body);

  const user = await prisma.user.findFirst({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null, refreshToken: null },
  });

  res.status(204).send();
}
