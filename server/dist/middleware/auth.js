"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
const HttpError_1 = require("../utils/HttpError");
function requireAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw new HttpError_1.HttpError(401, "Missing or invalid Authorization header");
    }
    try {
        req.user = (0, jwt_1.verifyAccessToken)(header.slice("Bearer ".length));
        next();
    }
    catch {
        throw new HttpError_1.HttpError(401, "Invalid or expired token");
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new HttpError_1.HttpError(403, "Insufficient permissions");
        }
        next();
    };
}
