import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function getSettings(
  req: Request,
  res: Response
): Promise<void | any> {
  const machine_id = req.params.machine_id;

  const result = z
    .string()
    .min(1, { message: "MachineId cannot be empty" })
    .max(100, { message: "MachineId too long. Max 100 char" })
    .safeParse(machine_id);

  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }

  console.log("machine id", machine_id);
  console.log("machine id", machine_id.length);

  const deviceData = await prisma.device.findFirst({
    where: { machine_id: machine_id.trim() },
    include: {
      setting: {
        select: {
          endTime: true,
          startTime: true,
        },
      },
      sensorSettings: true,
    },
  });
  // deviceData?.sensorSettings.
  console.log("🚀 ~ deviceData:", deviceData);
  console.log("deviceData", deviceData);

  if (!deviceData) {
    return res.status(404).json({ message: "Device not found" });
  }

  const returnData = {
    sensorSettings: deviceData.sensorSettings, // list of sensor settings
    settings: { startTime: "", endTime: "" }, // device settings
  };
  returnData.settings.startTime = deviceData.setting.startTime
    .toISOString()
    .split("T")[1]
    .split(".")[0];

  returnData.settings.endTime = deviceData.setting.endTime
    .toISOString()
    .split("T")[1]
    .split(".")[0];

  return res.status(200).json(returnData);
}
