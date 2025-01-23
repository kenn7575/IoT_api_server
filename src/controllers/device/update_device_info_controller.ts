import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function updateDeviceInfo(
    req: Request,
    res: Response
): Promise<void | any> {
    const deviceInfoSchema = z.object({
        name: z.string(),
        roomId: z.number(),
        description: z.string(),
        active: z.boolean(),
    });

    const validatedData = deviceInfoSchema.parse(req.body);

    const deviceId = res.locals.device.id;

    const device = await prisma.device.findUnique({
        where: { id: deviceId },
    });

    if (!device) {
        return res.status(404).json({ error: "Device not found" });
    }

    if (!device.active) {
        return res.status(403).json({ error: "Device is not active" });
    }

    const updatedDeviceInfo = await prisma.device.update({
        where: { id: deviceId },
        data: {
            name: validatedData.name,
            roomId: validatedData.roomId,
            description: validatedData.description,
            active: validatedData.active,
        },
    });

    return res.status(200).json(updatedDeviceInfo);
}