import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

const sensorSettingsSchema = z.object({
  sensorType: z.enum(["Temperature", "Humidity", "Noise", "Pressure", "Light", "Other"]),
  maxValue: z.number(),
  minValue: z.number(),
  timeinterval_seconds: z.number().int(),
  active_period: z.enum(["Open", "Closed"]),
});

const settingsSchema = z.object({
  name: z.string().max(100),
  timeIntervalSeconds: z.number().int(),
  startTime: z.date(),
  endTime: z.date(),
});

export async function updateSensorSettings(req: Request, res: Response): Promise<void | any> {
  const { machine_id } = req.params;
  const validationResult = sensorSettingsSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const data = validationResult.data;

  try {
    const device = await prisma.device.findUnique({
      where: { machine_id },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const updatedSensorSettings = await prisma.sensorSettings.update({
      where: { deviceId: device.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json(updatedSensorSettings);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while updating the sensor settings" });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void | any> {
  const { machine_id } = req.params;
  const validationResult = settingsSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const data = validationResult.data;

  try {
    const device = await prisma.device.findUnique({
      where: { machine_id },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    if (device.settingId === null) {
      return res.status(400).json({ error: "Device setting ID is null" });
    }

    const updatedSettings = await prisma.setting.update({
      where: { id: device.settingId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json(updatedSettings);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while updating the settings" });
  }
}

export async function updateBothSettings(req: Request, res: Response): Promise<void | any> {
  const { machine_id } = req.params;
  const sensorSettingsValidation = sensorSettingsSchema.safeParse(req.body.sensorSettings);
  const settingsValidation = settingsSchema.safeParse(req.body.settings);

  if (!sensorSettingsValidation.success || !settingsValidation.success) {
    return res.status(400).json({
      sensorSettingsError: sensorSettingsValidation.error?.errors,
      settingsError: settingsValidation.error?.errors,
    });
  }

  const sensorSettingsData = sensorSettingsValidation.data;
  const settingsData = settingsValidation.data;

  try {
    const device = await prisma.device.findUnique({
      where: { machine_id },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    if (device.settingId === null) {
        return res.status(400).json({ error: "Device setting ID is null" });
    }

    const [updatedSensorSettings, updatedSettings] = await Promise.all([
      prisma.sensorSettings.update({
        where: { deviceId: device.id },
        data: {
          ...sensorSettingsData,
          updatedAt: new Date(),
        },
      }),
      prisma.setting.update({
        where: { id: device.settingId },
        data: {
          ...settingsData,
          updatedAt: new Date(),
        },
      }),
    ]);

    return res.status(200).json({ updatedSensorSettings, updatedSettings });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while updating the settings" });
  }
}