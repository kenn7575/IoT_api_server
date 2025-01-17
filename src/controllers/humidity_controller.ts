import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const humidityMeasurementSchema = z.object({
  measurement: z.number().int(),
  valueType: z.string().max(100).optional(),
  deviceId: z.number().int(),
  roomId: z.number().int(),
});

export async function getHumidityMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        measurementType: "Humidity"
      }
    });
    return res.json(measurements);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while fetching humidity measurements" });
  }
}

export async function createHumidityMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = humidityMeasurementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { measurement, valueType, deviceId, roomId } = validationResult.data;

  try {
    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
        measurementType: "Humidity",
        deviceId,
        roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while saving the humidity measurement" });
  }
}