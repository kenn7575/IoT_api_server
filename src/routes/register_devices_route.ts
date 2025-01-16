import { Router } from "express";
import { registerDevice } from "../controllers/register_devices_controller";

const router = Router();

router.post("/register-device", registerDevice);

export default router;