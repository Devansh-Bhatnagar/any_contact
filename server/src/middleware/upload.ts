import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { HttpError } from "../utils/HttpError";

export const UPLOADS_DIR = env.uploadDir;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/** Builds the absolute, publicly reachable URL for a file stored under UPLOADS_DIR. */
export function fileUrl(filename: string): string {
  return `${env.baseUrl}/uploads/${filename}`;
}

/** Removes a previously uploaded file given its public URL. Safe to call on a missing file. */
export async function deleteFileByUrl(url: string): Promise<void> {
  const filename = path.basename(new URL(url).pathname);
  await fs.promises.unlink(path.join(UPLOADS_DIR, filename)).catch(() => undefined);
}
