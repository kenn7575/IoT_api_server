import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const roomIdSchema = z.object({
  roomId: z.coerce.number(),
});

const prisma = new PrismaClient();

export async function deleteRoomController(
  req: Request,
  res: Response
): Promise<void | any> {
  // steps:
  // 1. validate id
  // 2. check if room exists
  // 3. update room

  const { room_id } = req.params;
  const result = roomIdSchema.safeParse({ roomId: room_id });
  if (!result.success) {
    return res.status(400).json(result.error.flatten().fieldErrors);
  }

  const roomExists = await prisma.room.findFirst({
    where: {
      id: result.data.roomId,
    },
  });
  if (!roomExists) {
    return res.status(404).json({ error: "Room not found" });
  }

  const deletedRoom = await prisma.room.delete({
    where: {
      id: result.data.roomId,
    },
  });

  return res.status(200).json(deletedRoom);
}
