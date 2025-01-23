import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const roomIdSchema = z.object({
  roomId: z.coerce.number(),
});
const updateRoomSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
const prisma = new PrismaClient();

export async function updateRoomController(
  req: Request,
  res: Response
): Promise<void | any> {
  // steps:
  // 1. validate id
  // 2. validate new data
  // 3. check if room exists
  // 4. update room

  const { room_id } = req.params;
  console.log("🚀 ~ req.params:", req.params);
  const idResult = roomIdSchema.safeParse({ roomId: room_id });
  console.log("🚀 ~ idResult:", idResult.data);
  if (!idResult.success) {
    return res.status(400).json(idResult.error.flatten().fieldErrors);
  }

  const newDataResult = updateRoomSchema.safeParse(req.body);
  if (!newDataResult.success) {
    return res.status(400).json(newDataResult.error.flatten().fieldErrors);
  }

  const roomExists = await prisma.room.findFirst({
    where: {
      id: idResult.data.roomId,
    },
  });
  if (!roomExists) {
    return res.status(404).json({ error: "Room not found" });
  }
  const updatedRoom = await prisma.room.update({
    where: {
      id: idResult.data.roomId,
    },
    data: newDataResult.data,
  });

  return res.status(200).json(updatedRoom);
}
