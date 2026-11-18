import { Request, Response } from "express";
import { HttpError } from "../utils/HttpError";
import { fileUrl } from "../middleware/upload";

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, "No file uploaded");
  res.status(201).json({ id: req.file.filename, url: fileUrl(req.file.filename) });
}
