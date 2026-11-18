"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const upload_1 = require("./middleware/upload");
const error_1 = require("./middleware/error");
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
// Security: Hide server technology header
exports.app.disable("x-powered-by");
// Security: HTTP headers protection
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Mobile API client compatibility
}));
// Security: Rate limiting to prevent DoS / automated scraping
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again later." },
});
exports.app.use("/api", generalLimiter);
// Security: Strict CORS
exports.app.use((0, cors_1.default)({ origin: env_1.env.corsOrigins }));
// Security: Constrained JSON payload limit to protect against memory exhaustion
exports.app.use(express_1.default.json({ limit: "2mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "2mb" }));
// Static uploads directory
exports.app.use("/uploads", express_1.default.static(upload_1.UPLOADS_DIR));
exports.app.get("/health", (_req, res) => res.json({ status: "ok" }));
exports.app.use("/api", routes_1.default);
exports.app.use(error_1.notFoundHandler);
exports.app.use(error_1.errorHandler);
