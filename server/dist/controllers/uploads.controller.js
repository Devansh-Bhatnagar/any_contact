"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
const HttpError_1 = require("../utils/HttpError");
const upload_1 = require("../middleware/upload");
async function uploadFile(req, res) {
    if (!req.file)
        throw new HttpError_1.HttpError(400, "No file uploaded");
    res.status(201).json({ id: req.file.filename, url: (0, upload_1.fileUrl)(req.file.filename) });
}
