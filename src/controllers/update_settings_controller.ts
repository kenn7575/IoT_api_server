import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

const sensorSettingsSchema = z.object({
  id: z.number().int(),
  sensorType: z.enum(["Temperature", "Humidity", "Noise", "Pressure", "Light", "Other"]),
  maxValue: z.number(),
  minValue: z.number(),
  timeinterval_seconds: z.number().int(),
  active_period: z.enum(["Open", "Closed"]),
  deviceId: z.number().int(),
});

const settingsSchema = z.object({
  id: z.number().int(),
  name: z.string().max(100),
  timeIntervalSeconds: z.number().int(),
  startTime: z.date(),
  endTime: z.date(),
});

export async function updateSensorSettings(req: Request, res: Response): Promise<void | any> {
  const validationResult = sensorSettingsSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { id, ...data } = validationResult.data;

  try {
    const updatedSensorSettings = await prisma.sensorSettings.update({
      where: { id },
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
  const validationResult = settingsSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { id, ...data } = validationResult.data;

  try {
    const updatedSettings = await prisma.setting.update({
      where: { id },
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
  const sensorSettingsValidation = sensorSettingsSchema.safeParse(req.query.sensorSettings);
  const settingsValidation = settingsSchema.safeParse(req.query.settings);

  if (!sensorSettingsValidation.success || !settingsValidation.success) {
    return res.status(400).json({
      sensorSettingsError: sensorSettingsValidation.error?.errors,
      settingsError: settingsValidation.error?.errors,
    });
  }

  const { id: sensorSettingsId, ...sensorSettingsData } = sensorSettingsValidation.data;
  const { id: settingsId, ...settingsData } = settingsValidation.data;

  try {
    const [updatedSensorSettings, updatedSettings] = await Promise.all([
      prisma.sensorSettings.update({
        where: { id: sensorSettingsId },
        data: {
          ...sensorSettingsData,
          updatedAt: new Date(),
        },
      }),
      prisma.setting.update({
        where: { id: settingsId },
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