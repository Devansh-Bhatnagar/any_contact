"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const HttpError_1 = require("../utils/HttpError");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
async function issueTokens(userId, role) {
    const accessToken = (0, jwt_1.signAccessToken)({ userId, role });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId, role });
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { refreshToken } });
    return { accessToken, refreshToken };
}
async function register(req, res) {
    const { email, password, name } = registerSchema.parse(req.body);
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new HttpError_1.HttpError(409, "Email already registered");
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { email, passwordHash, name, role: "BUSINESS_OWNER" },
    });
    const tokens = await issueTokens(user.id, user.role);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens });
}
async function login(req, res) {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        throw new HttpError_1.HttpError(401, "Invalid email or password");
    }
    if (user.suspended)
        throw new HttpError_1.HttpError(403, "This account has been suspended");
    const tokens = await issueTokens(user.id, user.role);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens });
}
async function refresh(req, res) {
    const { refreshToken } = zod_1.z.object({ refreshToken: zod_1.z.string() }).parse(req.body);
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new HttpError_1.HttpError(401, "Invalid or expired refresh token");
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
        throw new HttpError_1.HttpError(401, "Refresh token no longer valid");
    }
    const tokens = await issueTokens(user.id, user.role);
    res.json(tokens);
}
async function logout(req, res) {
    await prisma_1.prisma.user.update({ where: { id: req.user.userId }, data: { refreshToken: null } });
    res.status(204).send();
}
async function me(req, res) {
    const user = await prisma_1.prisma.user.findUniqueOrThrow({ where: { id: req.user.userId } });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt });
}
async function forgotPassword(req, res) {
    const { email } = zod_1.z.object({ email: zod_1.z.string().email() }).parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    // Always respond 204 so this endpoint can't be used to enumerate registered emails.
    if (!user) {
        res.status(204).send();
        return;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    // No email transport is configured yet; log the link so it can be tested locally.
    console.log(`Password reset requested for ${email}: token=${resetToken}`);
    res.status(204).send();
}
async function resetPassword(req, res) {
    const { token, password } = zod_1.z
        .object({ token: zod_1.z.string(), password: zod_1.z.string().min(8) })
        .parse(req.body);
    const user = await prisma_1.prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
        throw new HttpError_1.HttpError(400, "Invalid or expired reset token");
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetTokenExpiresAt: null, refreshToken: null },
    });
    res.status(204).send();
}
