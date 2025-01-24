import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function testApi(
  req: Request,
  res: Response
): Promise<void | any> {
  //   const tables = await prisma.table_name.findMany();

  return res.send("connection successful");
}

export async function versionApi(
  req: Request,
  res: Response
): Promise<void | any> {
  //   const tables = await prisma.table_name.findMany();

  return res.send("Version 1.0.0");
}
