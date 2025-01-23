import express from "express";
import { createRoomController } from "../controllers/rooms/create_room_controller";
import { getAllRoomsController } from "../controllers/rooms/get_all_rooms_controller";
import { deleteRoomController } from "../controllers/rooms/delete_room_controller";
import { updateRoomController } from "../controllers/rooms/update_room_controller";

const router = express.Router();

router.post("/", createRoomController);
router.get("/", getAllRoomsController);
router.delete("/:room_id", deleteRoomController);
router.patch("/:room_id", updateRoomController);

export default router;
