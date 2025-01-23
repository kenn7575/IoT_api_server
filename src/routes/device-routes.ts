import express from "express";
import { deviceLoginController } from "../controllers/device_login_controller";
import { registerDevice } from "../controllers/register_devices_controller";
import { updateDeviceInfo } from "../controllers/device/update_device_info_controller";
import { getSettings } from "../controllers/get_settings_controller";
import { updateSettingsController } from "../controllers/settings/update_settings_controller";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

router.post("/", registerDevice); //register new device
router.post("/login", deviceLoginController); //login device and return API key
router.patch("/:machine_id", authMiddleware, updateDeviceInfo); //update device info

router.get("/:machine_id/settings", authMiddleware, getSettings); //register new device
router.patch("/:machine_id/settings", authMiddleware, updateSettingsController);

export default router;
