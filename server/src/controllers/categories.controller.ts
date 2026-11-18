import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const nameSchema = z.object({ name: z.string().min(1) });

export async function list(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
}

export async function create(req: Request, res: Response) {
  const { name } = nameSchema.parse(req.body);
  const category = await prisma.category.create({ data: { name } });
  res.status(201).json(category);
}

export async function update(req: Request, res: Response) {
  const { name } = nameSchema.parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data: { name } });
  res.json(category);
}

export async function remove(req: Request, res: Response) {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
