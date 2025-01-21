import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const deviceLoginSchema = z.object({
  machine_id: z
    .string()
    .min(1, { message: "machine_id is required" })
    .max(100, { message: "machine_id too long. Max 100 char" }),
});

const prisma = new PrismaClient();

export async function deviceLoginController(
  req: Request,
  res: Response
): Promise<void | any> {
  // steps:
  // 1. validate incoming request
  // 2. check if device exists
  // 3. update device updatedAt field
  // 4. create and return API key

  const result = deviceLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }

  const { machine_id } = result.data;

  const device = await prisma.device.findFirst({
    where: {
      machine_id: machine_id.trim(),
    },
  });

  if (!device) {
    return res.status(401).json({ message: "device not found" });
  }

  const apiKey: string = crypto.randomUUID();
  await prisma.apikey.create({
    data: {
      key: apiKey,
      deviceId: device.id,
      name: machine_id,
    },
  });

  return res.json({ apiKey });
}
