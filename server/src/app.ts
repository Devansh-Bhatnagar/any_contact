import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { UPLOADS_DIR } from "./middleware/upload";
import { errorHandler, notFoundHandler } from "./middleware/error";
import routes from "./routes";

export const app = express();

// Security: Hide server technology header
app.disable("x-powered-by");

// Security: HTTP headers protection
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Mobile API client compatibility
  })
);

// Security: Rate limiting to prevent DoS / automated scraping
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." },
});
app.use("/api", generalLimiter);

// Security: Strict CORS
app.use(cors({ origin: env.corsOrigins }));

// Security: Constrained JSON payload limit to protect against memory exhaustion
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Static uploads directory
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
