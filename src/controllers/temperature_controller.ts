import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTemperatureMeasurements(
  req: Request,
  res: Response
): Promise<void | any> {
  try {
    const measurements = await prisma.measurement.findMany({
      where: {
        measurementType: "Temperature"
      }
    });
    return res.json(measurements);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred while fetching temperature measurements" });
  }
}