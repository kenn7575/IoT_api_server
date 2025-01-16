import express from "express";
import { deviceLoginController } from "../controllers/device_login_controller";

const router = express.Router();

router.post("/" /* controller */); //register new device
router.post("/login", deviceLoginController); //login device and return API key

export default router;
