import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const temperatureMeasurementSchema = z.object({
  measurement: z.number().int(),
  valueType: z.string().max(100).optional(),
  machine_id: z.number().int(),
  roomId: z.number().int(),
});

export async function getTemperatureMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        sensorType: "Temperature",
      },
    });
    return res.json(measurements);
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "An error occurred while fetching temperature measurements",
      });
  }
}

export async function createTemperatureMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const validationResult = temperatureMeasurementSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors });
  }

  const { measurement, valueType, machine_id, roomId } = validationResult.data;

  try {
    const device = await prisma.device.findUnique({
      where: { id: machine_id },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType,
        sensorType: "Temperature",
        deviceId: device.id,
        roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "An error occurred while saving the temperature measurement",
      });
  }
}
