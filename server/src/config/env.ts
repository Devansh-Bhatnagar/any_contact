import "dotenv/config";
import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const DEFAULT_PORT = 5034;
// Production API domain (VPS, behind a reverse proxy in front of PORT). Local
// dev overrides this via BASE_URL in .env (see .env.example).
const PRODUCTION_BASE_URL = "https://api.addphonenumber.in";

// Browser-facing origins allowed to call this API: the marketing site (apex +
// www) and the admin dashboard subdomain. Local dev overrides via CORS_ORIGIN
// in .env (comma-separated list — see .env.example).
const DEFAULT_CORS_ORIGINS = [
  "https://addphonenumber.in",
  "https://www.addphonenumber.in",
  "https://admin.addphonenumber.in",
];

export const env = {
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  baseUrl: process.env.BASE_URL ?? PRODUCTION_BASE_URL,
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 10),
  // Resolved from the server project root (not __dirname/dist), so uploads always
  // land in server/uploads regardless of ts-node/tsx dev mode vs. compiled dist build.
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), "uploads"),
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_CORS_ORIGINS,
};
