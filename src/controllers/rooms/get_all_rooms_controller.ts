import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function getAllRoomsController(
  req: Request,
  res: Response
): Promise<void | any> {
  const rooms = await prisma.room.findMany();

  return res.status(200).json(rooms);
}
