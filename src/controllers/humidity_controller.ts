import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { numberString } from "../../utils/schemas";

const prisma = new PrismaClient();

const humidityMeasurementSchema = z.object({
  measurement: numberString,
  valueType: z.string().optional(),
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

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { measurement, valueType, machine_id } = validationResult.data;

  try {
    const device = await prisma.device.findUnique({
      where: { machine_id },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
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
