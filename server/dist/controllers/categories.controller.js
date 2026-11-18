"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const nameSchema = zod_1.z.object({ name: zod_1.z.string().min(1) });
async function list(_req, res) {
    const categories = await prisma_1.prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
}
async function create(req, res) {
    const { name } = nameSchema.parse(req.body);
    const category = await prisma_1.prisma.category.create({ data: { name } });
    res.status(201).json(category);
}
async function update(req, res) {
    const { name } = nameSchema.parse(req.body);
    const category = await prisma_1.prisma.category.update({ where: { id: req.params.id }, data: { name } });
    res.json(category);
}
async function remove(req, res) {
    await prisma_1.prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
}
