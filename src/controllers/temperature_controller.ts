import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

import { SensorType } from "@prisma/client";

const temperatureMeasurementSchema = z.object({
  measurement: z.coerce.number(),
  value_type: z.string().max(100),
});

export async function getTemperatureMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        sensorType: "Temperature" /* measurement_sensorType.Temperature */,
      },
    });
    return res.json(measurements);
  } catch (error) {
    return res.status(500).json({
      error: "An error occurred while fetching temperature measurements",
    });
  }
}

export async function createTemperatureMeasurement(
  req: Request,
  res: Response
): Promise<void | any> {
  const device = res.locals.device;

  const result = temperatureMeasurementSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const data = result.data;
  try {
    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement: data.measurement,
        valueType: data.value_type,
        sensorType: SensorType.Temperature,
        deviceId: device.id,
        roomId: device.roomId,
      },
    });
    return res.status(201).json(newMeasurement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred while saving the temperature measurement",
    });
  }
}
