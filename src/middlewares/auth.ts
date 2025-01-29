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
  const apiKey = req.headers["api-key"];
  console.log("🚀 ~ req.headers:", req.headers);
  console.log("🚀 ~ apiKey:", apiKey);
  const result = apiKeySchema.safeParse({ apiKey: apiKey });
  console.log("🚀 ~ result:", result);
  if (!result.success) {
    res.status(400).json(result.error.flatten().fieldErrors);
    return;
  }

  const data = await prisma.apiKey.findFirst({
    where: {
      apiKey: result.data.apiKey.trim(),
    },
    include: {
      device: true,
    },
  });
  console.log("🚀 ~ data:", data);

  if (!data) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  res.locals.device = data.device;
  next();
};
