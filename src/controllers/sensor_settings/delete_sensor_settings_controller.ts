import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function deleteSensorSettings(
    req: Request,
    res: Response
): Promise<void | any> {
    const sensorSettingsId = parseInt(req.params.sensorSettingsId);

    const sensorSettingsIdResult = z
        .string()
        .min(1, { message: "SensorSettingsId cannot be empty" })
        .max(100, { message: "SensorSettingsId too long. Max 100 char" })
        .safeParse(sensorSettingsId);

    if (!sensorSettingsIdResult.success) {
        return res.status(400).json(sensorSettingsIdResult.error.flatten());
    }

    const deletedSensorSettings = await prisma.sensorSettings.delete({
        where: { id: sensorSettingsId },
    });

    return res.status(200).json({ sensorSettings: deletedSensorSettings });
}