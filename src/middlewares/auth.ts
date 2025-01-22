import { Express, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const apiKeySchema = z.object({
  apiKey: z
    .string({ message: "Api key is required" })
    .min(1, { message: "Api key must be at least 1 in length" }),
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

  const device = await prisma.device.findFirst({
    where: {
      apikey: {
        some: {
          key: result.data.apiKey,
        },
      },
    },
  });

  if (!device) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  res.locals.device = device;
  next();
};
