import { Request, Response } from "express";
import { PrismaClient, SensorType } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const humidityMeasurementSchema = z.object({
  measurement: z.coerce.number(),
  valueType: z.string(),
});

export async function getHumidityMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        sensorType: "Humidity",
      },
    });
    return res.json(measurements);
  } catch (error) {
    return res.status(500).json({
      error: "An error occurred while fetching humidity measurements",
    });
  }
}

export async function createHumidityMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = humidityMeasurementSchema.safeParse(req.body);
  const device = res.locals.device;

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { measurement, valueType } = validationResult.data;

  try {
    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
        sensorType: SensorType.Humidity,
        deviceId: device.id,
        roomId: device.roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    return res.status(500).json({
      error: "An error occurred while saving the humidity measurement",
    });
  }
}
