import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const deviceSchema = z.object({
  machine_id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255).optional(),
  roomId: z.number().int(),
  active: z.boolean().optional(),
  settings: z.object({
    name: z.string().min(1).max(100),
    timeIntervalSeconds: z.number().int(),
    startTime: z.string().min(1).max(16).optional(),
    endTime: z.string().min(1).max(16).optional(),
  }),
});

export async function registerDevice(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = deviceSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.flatten() });
  }

  const data = validationResult.data;

  try {
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const newSettingsAndDevice = await prisma.setting.create({
      data: {
        name: data.settings.name,
        startTime: data.settings.startTime,
        endTime: data.settings.endTime,
        device: {
          create: {
            machineId: data.machine_id.trim(),
            name: data.name,
            description: data.description,
            roomId: data.roomId,
            active: data.active,
          },
        },
      },
      include: {
        device: true,
      },
    });

    return res.status(201).json(newSettingsAndDevice.device);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred while registering the device" + error,
    });
  }
}
