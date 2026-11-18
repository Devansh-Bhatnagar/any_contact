"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const HttpError_1 = require("../utils/HttpError");
function notFoundHandler(_req, res) {
    res.status(404).json({ message: "Endpoint not found" });
}
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            message: "Validation failed",
            details: err.flatten(),
        });
        return;
    }
    if (err instanceof HttpError_1.HttpError) {
        res.status(err.status).json({
            message: err.message,
            code: err.code,
        });
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (err.code === "P2025") {
            res.status(404).json({ message: "Requested resource not found" });
            return;
        }
        // Unique constraint violation
        if (err.code === "P2002") {
            res.status(409).json({ message: "Resource already exists with this identifier" });
            return;
        }
        // Inconsistent column data / invalid UUID format
        if (err.code === "P2023") {
            res.status(400).json({ message: "Invalid resource identifier format" });
            return;
        }
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
}
