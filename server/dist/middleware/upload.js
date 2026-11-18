"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.UPLOADS_DIR = void 0;
exports.fileUrl = fileUrl;
exports.deleteFileByUrl = deleteFileByUrl;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const HttpError_1 = require("../utils/HttpError");
exports.UPLOADS_DIR = env_1.env.uploadDir;
if (!fs_1.default.existsSync(exports.UPLOADS_DIR)) {
    fs_1.default.mkdirSync(exports.UPLOADS_DIR, { recursive: true });
}
const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "application/pdf",
]);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, exports.UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${(0, uuid_1.v4)()}${ext}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: env_1.env.uploadMaxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(new HttpError_1.HttpError(400, `Unsupported file type: ${file.mimetype}`));
            return;
        }
        cb(null, true);
    },
});
/** Builds the absolute, publicly reachable URL for a file stored under UPLOADS_DIR. */
function fileUrl(filename) {
    return `${env_1.env.baseUrl}/uploads/${filename}`;
}
/** Removes a previously uploaded file given its public URL. Safe to call on a missing file. */
async function deleteFileByUrl(url) {
    const filename = path_1.default.basename(new URL(url).pathname);
    await fs_1.default.promises.unlink(path_1.default.join(exports.UPLOADS_DIR, filename)).catch(() => undefined);
}
