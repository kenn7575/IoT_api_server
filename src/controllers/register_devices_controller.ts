import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const deviceSchema = z.object({
  machine_id: z.string().max(100),
  name: z.string().max(100),
  description: z.string().max(255).optional(),
  roomId: z.number().int().optional(),
  settingId: z.number().int().optional(),
  active: z.boolean().default(true),
});

export async function registerDevice(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = deviceSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { machine_id, name, description, roomId, settingId, active } = validationResult.data;

  try {
    const newDevice = await prisma.device.create({
      data: {
        machine_id,
        name,
        description,
        roomId,
        settingId,
        active,
        updatedAt: new Date(),
      },
    });
    return res.status(201).json(newDevice);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while registering the device" });
  }
}