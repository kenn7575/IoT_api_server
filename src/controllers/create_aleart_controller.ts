import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const deviceLoginSchema = z.object({
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

export async function createAleartController(
  req: Request,
  res: Response
): Promise<void | any> {
  const device = res.locals.device;

  const result = deviceLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }

  const aleart = await prisma.alert.create({
    data: {
      name: result.data.name,
      deviceId: device.id,
      description: result.data.description,
      roomId: device.roomId,
    },
  });

  return res.status(201).json(aleart);
}
