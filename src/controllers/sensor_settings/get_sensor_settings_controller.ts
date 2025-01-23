import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function getSensorSettings(
    req: Request,
    res: Response
): Promise<void | any> {
    const machine_id = req.params.machine_id;
    const device = res.locals.device;

    const result = z
    .string()
    .min(1, { message: "MachineId cannot be empty" })
    .max(100, { message: "MachineId too long. Max 100 char" })
    .safeParse(machine_id);

    if (!result.success) {
        return res.status(400).json(result.error.flatten());
    }

    console.log("machine id", machine_id);
    console.log("machine id", machine_id.length);

    if (!device) {
        return res.status(404).json({ message: "Device not found" });
    }

    const deviceData = await prisma.sensorSettings.findFirst({
        where: { deviceId: device.id },
        include: {
            device: true,
        },
    });

    console.log("🚀 ~ deviceData:", deviceData);
    console.log("deviceData", deviceData);

    if (!deviceData) {
        return res.status(404).json({ message: "Sensor settings not found" });
    }

    const returnData = {
        sensorSettings: deviceData, // list of sensor settings
    };

    return res.status(200).json(returnData);
}