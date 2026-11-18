import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/HttpError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Endpoint not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
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
