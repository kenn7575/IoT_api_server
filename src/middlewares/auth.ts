import { Express, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const apiKeySchema = z.object({
  apiKey: z
    .string({ message: "api_key is required" })
    .min(1, { message: "api_key must be at least 1 in length" }),
});

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers["api_key"];
  const result = apiKeySchema.safeParse({ apiKey: apiKey });
  if (!result.success) {
    res.status(400).json(result.error.flatten().fieldErrors);
    return;
  }

  const data = await prisma.apiKey.findFirst({
    where: {
      apiKey: "7b464d5f-42d5-4485-bb55-e69a20b0c30d",
    },
    include: {
      device: true,
    },
  });
  console.log("Data:", data);

  if (!data) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  res.locals.device = data.device;
  next();
};
