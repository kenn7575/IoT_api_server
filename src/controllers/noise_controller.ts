import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const noiseMeasurementSchema = z.object({
  measurement: z.number().int(),
  valueType: z.string().max(100).optional(),
  deviceId: z.number().int(),
  roomId: z.number().int(),
});

export async function getNoiseMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        measurementType: "Noise"
      }
    });
    return res.json(measurements);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while fetching noise measurements" });
  }
}

export async function createNoiseMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = noiseMeasurementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { measurement, valueType, deviceId, roomId } = validationResult.data;

  try {
    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
        measurementType: "Noise",
        deviceId,
        roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while saving the noise measurement" });
  }
}