import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const temperatureMeasurementSchema = z.object({
  measurement: z.coerce.number(),
  value_type: z.string().max(100).optional(),
  machine_id: z
    .string()
    .min(1, { message: "machine_id is required" })
    .max(100, { message: "machine_id too long. Max 100 char" }),
});
import { measurement_sensorType } from "@prisma/client";
import { numberString } from "../../utils/schemas";
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
  const validationResult = temperatureMeasurementSchema.safeParse(req.body);
  console.log("validationResult", validationResult);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.flatten() });
  }

  const { measurement, value_type, machine_id } = validationResult.data;

  try {
    const device = await prisma.device.findUnique({
      where: { machine_id: machine_id.trim() },
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const newMeasurement = await prisma.measurement.create({
      data: {
        measurement,
        valueType: value_type,
        sensorType: "Temperature" /* measurement_sensorType.Temperature */,
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
