import { Request, Response } from "express";
import { PrismaClient, SensorType, SensorSettingsPeriod } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const sensorSettingsSchema = z.object({
    sensorType: z.nativeEnum(SensorType),
    maxValue: z.number(),
    minValue: z.number(),
    timeIntervalSeconds: z.number().int(),
    activePeriod: z.nativeEnum(SensorSettingsPeriod),
});

export async function updateSensorSettings(
    req: Request,
    res: Response
): Promise<void | any> {
    const sensorSettingsId = parseInt(req.params.sensorSettingsId);

    if (isNaN(sensorSettingsId)) {
        return res.status(400).json({ error: "Invalid sensorSettingsId" });
    }

    const settingsResult = sensorSettingsSchema.safeParse(req.body);

    if (!settingsResult.success) {
        return res.status(400).json(settingsResult.error.flatten());
    }

    const { sensorType, maxValue, minValue, timeIntervalSeconds, activePeriod } = settingsResult.data;

    const updatedSensorSettings = await prisma.sensorSettings.update({
        where: { id: sensorSettingsId },
        data: {
            sensorType,
            maxValue,
            minValue,
            timeIntervalSeconds,
            activePeriod,
        },
    });

    return res.status(200).json({ sensorSettings: updatedSensorSettings });
}
