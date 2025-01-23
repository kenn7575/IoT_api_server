import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must be at least 1 character" })
    .max(100, { message: "Max length is 100 characters" }),
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character" })
    .max(100, { message: "Max length is 100 characters" }),
});

const prisma = new PrismaClient();

export async function createRoomController(
  req: Request,
  res: Response
): Promise<void | any> {
  const result = createRoomSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten().fieldErrors);
  }

  const room = await prisma.room.create({
    data: {
      name: result.data.name,
      description: result.data.description,
    },
  });

  return res.status(201).json(room);
}
