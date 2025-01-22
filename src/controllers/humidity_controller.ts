import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { numberString } from "../../utils/schemas";

const prisma = new PrismaClient();

const humidityMeasurementSchema = z.object({
  measurement: z.coerce.number(),
  value_type: z.string().optional(),
  machine_id: z.string(),
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

  const { measurement, value_type, machine_id } = validationResult.data;

  try {
    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType: value_type,
        sensorType: "Humidity",
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
