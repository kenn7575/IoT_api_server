import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const noiseMeasurementSchema = z.object({
  measurement: z.coerce.number(),
  valueType: z.string(),
});

export async function getNoiseMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        sensorType: "Noise",
      },
    });
    return res.json(measurements);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while fetching noise measurements" });
  }
}

export async function createNoiseMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const device = res.locals.device;
  console.log("🚀 ~ device:", device);

  const validationResult = noiseMeasurementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: validationResult.error.flatten().fieldErrors });
  }

  const { measurement, valueType } = validationResult.data;

  try {
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
        sensorType: "Noise",
        deviceId: device.id,
        roomId: device.roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while saving the noise measurement" });
  }
}
