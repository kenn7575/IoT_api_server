import { Request, Response } from "express";
import { PrismaClient, SensorType, SensorSettingsPeriod } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function createSensorSettings(
    req: Request,
    res: Response
): Promise<void | any> {
    const sensorSettingsSchema = z.object({
        sensorType: z.nativeEnum(SensorType),
        maxValue: z.number(),
        minValue: z.number(),
        timeIntervalSeconds: z.number().optional().default(300),
        activePeriod: z.nativeEnum(SensorSettingsPeriod),
        deviceId: z.number(),
    });
    
    try {
        const validatedData = sensorSettingsSchema.parse(req.body);
    
        const newSensorSettings = await prisma.sensorSettings.create({
            data: {
                sensorType: validatedData.sensorType,
                maxValue: validatedData.maxValue,
                minValue: validatedData.minValue,
                timeIntervalSeconds: validatedData.timeIntervalSeconds,
                activePeriod: validatedData.activePeriod,
                deviceId: validatedData.deviceId,
            },
        });
    
        res.status(201).json(newSensorSettings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
}