import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const machineIdSchema = z.object({
  machineId: z.string().min(1),
});
const updateDeviceSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().min(1).max(16).optional(),
  endTime: z.string().min(1).max(16).optional(),
  updateSettingsIntervalSeconds: z.coerce.number().int().optional(),
});
const prisma = new PrismaClient();

export async function updateSettingsController(
  req: Request,
  res: Response
): Promise<void | any> {
  // steps:
  // 1. validate id
  // 2. validate new data
  // 3. check if room exists
  // 4. update room

  // 1. validate id
  const { machine_id } = req.params;
  const idResult = machineIdSchema.safeParse({ machineId: machine_id });
  if (!idResult.success) {
    return res.status(400).json(idResult.error.flatten().fieldErrors);
  }

  // 2. validate new data
  const newDataResult = updateDeviceSettingsSchema.safeParse(req.body);
  if (!newDataResult.success) {
    return res.status(400).json(newDataResult.error.flatten().fieldErrors);
  }

  // 3. check if room exists
  const device = await prisma.device.findFirst({
    where: {
      machineId: idResult.data.machineId,
    },
    include: {
      setting: true,
    },
  });
  if (!device?.setting) {
    return res.status(404).json({ error: "Device settings not found" });
  }

  const updatedRoom = await prisma.setting.update({
    where: {
      id: device.setting.id,
    },
    data: {
      name: newDataResult.data.name,
      startTime: newDataResult.data.startTime,
      endTime: newDataResult.data.endTime,
      updateSettingsIntervalSeconds:
        newDataResult.data.updateSettingsIntervalSeconds,
    },
  });

  return res.status(200).json(updatedRoom);
}
